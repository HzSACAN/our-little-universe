import { useEffect, useLayoutEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CubicBezierCurve3, Euler, MathUtils, Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { Destination, Flight } from './state';
import type { SceneBridge } from './bridge';
import { createFrameClock, frameSeconds, restartFrameClock } from './timing';
import { baseFov, buildFlightCurve, flightDuration, poseFor, smootherstep, type CameraPose, type Layout } from './world';

// Kameranın tek sahibi. Uçuş, sürükleyerek bakınma, fare paralaksı ve
// kadraj uyarlaması burada yürütülür; başka hiçbir şey kameraya yazmaz.

interface CameraRigProps {
  layout: Layout;
  /** Kameranın şu an durduğu yer (uçuş yokken). */
  at: Destination;
  flight: Flight | null;
  bridge: SceneBridge;
  onArrive: (flightId: number) => void;
  running: boolean;
}

interface ActiveFlight {
  id: number;
  to: Destination;
  curve: CubicBezierCurve3;
  fromQuat: Quaternion;
  toQuat: Quaternion;
  toPose: CameraPose;
  duration: number;
  elapsed: number;
  reduced: boolean;
  snapped: boolean;
}

const up = new Vector3(0, 1, 0);
const tmpMatrix = new Matrix4();
const tmpVec = new Vector3();
const tmpVec2 = new Vector3();
const tmpQuat = new Quaternion();
const tmpQuat2 = new Quaternion();
const lookEuler = new Euler(0, 0, 0, 'YXZ');

function quaternionFor(position: Vector3, target: Vector3, out = new Quaternion()) {
  tmpMatrix.lookAt(position, target, up);
  return out.setFromRotationMatrix(tmpMatrix);
}

export function CameraRig({ layout, at, flight, bridge, onArrive, running }: CameraRigProps) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;

  const frameClock = useRef(createFrameClock());
  useLayoutEffect(() => restartFrameClock(frameClock.current), [running]);

  const basePosition = useRef(new Vector3());
  const baseQuat = useRef(new Quaternion());
  const active = useRef<ActiveFlight | null>(null);
  const smoothLook = useRef({ yaw: 0, pitch: 0, hoverX: 0, hoverY: 0 });
  const settle = useRef(0);
  const clock = useRef(0);
  const travel = useRef(0);
  const onArriveRef = useRef(onArrive);
  onArriveRef.current = onArrive;
  const layoutRef = useRef(layout);

  const setBase = (pose: CameraPose) => {
    basePosition.current.copy(pose.position);
    quaternionFor(pose.position, pose.target, baseQuat.current);
  };

  // İlk kurulum: açılış kadrajı, hafif bir yerleşme hareketiyle.
  useLayoutEffect(() => {
    setBase(poseFor(at, layout));
    camera.position.copy(basePosition.current);
    camera.quaternion.copy(baseQuat.current);
    camera.fov = baseFov(layout);
    camera.near = 0.5;
    camera.far = 9000;
    camera.updateProjectionMatrix();
    settle.current = bridge.reducedMotion ? 0 : 1;
    // Yalnızca kurulumda çalışır; sonraki değişiklikler aşağıdaki efektlerde.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  const startFlight = (id: number, to: Destination, remaining?: number) => {
    const pose = poseFor(to, layoutRef.current);
    const from = camera.position.clone();
    const reduced = bridge.reducedMotion;
    const duration = reduced ? 0.7 : remaining ?? flightDuration(from, pose.position);
    // Mevcut bakış (sürükleme dahil) başlangıç yönelimi olur: bakış zıplamaz.
    smoothLook.current = { yaw: 0, pitch: 0, hoverX: 0, hoverY: 0 };
    bridge.look.yaw = 0;
    bridge.look.pitch = 0;
    active.current = {
      id,
      to,
      curve: buildFlightCurve(from, pose.position, to),
      fromQuat: camera.quaternion.clone(),
      toQuat: quaternionFor(pose.position, pose.target),
      toPose: pose,
      duration,
      elapsed: 0,
      reduced,
      snapped: false,
    };
    settle.current = 0;
    bridge.flying = true;
  };

  // Yeni uçuş isteği. Uçuş kimliği değişmedikçe yeniden başlamaz.
  useEffect(() => {
    if (!flight) return;
    if (active.current?.id === flight.id) return;
    startFlight(flight.id, flight.to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flight?.id]);

  // Ekran oranı değişimi: dünya sabit kalır, yalnızca kadraj uyarlanır.
  useEffect(() => {
    if (layoutRef.current === layout) return;
    layoutRef.current = layout;
    const current = active.current;
    if (current) {
      // Süren yolculuk bulunduğu yerden yeni kadraja yeniden hedeflenir.
      const left = Math.max(1.2, (1 - current.elapsed / current.duration) * current.duration);
      startFlight(current.id, current.to, current.reduced ? undefined : left);
    } else {
      setBase(poseFor(at, layout));
      smoothLook.current = { yaw: 0, pitch: 0, hoverX: 0, hoverY: 0 };
      bridge.look.yaw = 0;
      bridge.look.pitch = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // Uçuş dışındayken bulunulan yer değişirse (ör. varış) taban kadrajı güncelle.
  useEffect(() => {
    if (!active.current) setBase(poseFor(at, layoutRef.current));
  }, [at]);

  // Unmount: köprüdeki uçuş bayrağını temizle; eski uçuş callback'i çağrılmaz.
  useEffect(
    () => () => {
      active.current = null;
      bridge.flying = false;
      bridge.travel = 0;
    },
    [bridge],
  );

  useFrame((_, rawDelta) => {
    // Gizli sekmeden dönüşte büyük zaman farkı kamerayı sıçratmaz.
    const dt = frameSeconds(frameClock.current, rawDelta);
    const reduced = bridge.reducedMotion;
    if (!reduced) clock.current += Math.min(dt, 0.05);
    const f = active.current;
    let travelTarget = 0;
    let fov = baseFov(layoutRef.current);
    let roll = 0;

    if (f) {
      // Hareket azaltma uçuş sırasında açılırsa yolculuk hemen tamamlanır.
      if (reduced && !f.reduced) f.elapsed = f.duration;
      f.elapsed = Math.min(f.duration, f.elapsed + dt);
      const t = f.elapsed / f.duration;

      if (f.reduced) {
        // Kısa, durağan geçiş: perde kapanırken kamera hedefe taşınır.
        if (t >= 0.5 && !f.snapped) {
          f.snapped = true;
          camera.position.copy(f.toPose.position);
          camera.quaternion.copy(f.toQuat);
        }
        if (bridge.veil) bridge.veil.style.opacity = String(Math.sin(t * Math.PI) * 0.85);
      } else {
        // Hızlanma kısa, frenleme daha uzun: zamanı hafifçe büker.
        const warped = 1 - Math.pow(1 - t, 1.25);
        const e = smootherstep(warped);
        f.curve.getPoint(e, camera.position);

        const s = smootherstep(MathUtils.clamp((t - 0.05) / 0.88, 0, 1));
        tmpQuat.copy(f.fromQuat).slerp(f.toQuat, s);

        // Yolun ortasında bakış hafifçe gidiş yönüne çekilir; geri yolculukta çekilmez.
        f.curve.getTangent(e, tmpVec);
        tmpVec2.set(0, 0, -1).applyQuaternion(tmpQuat);
        const forwardness = MathUtils.clamp(tmpVec.dot(tmpVec2), 0, 1);
        const lead = Math.sin(t * Math.PI) * 0.32 * forwardness;
        if (lead > 0.001) {
          quaternionFor(camera.position, tmpVec2.copy(camera.position).add(tmpVec), tmpQuat2);
          tmpQuat.slerp(tmpQuat2, lead);
        }
        camera.quaternion.copy(tmpQuat);

        const intensity = Math.sin(t * Math.PI);
        travelTarget = intensity;
        fov += intensity * 7;
        roll = layoutRef.current === 'wide' ? Math.sin(t * Math.PI) * 0.012 : 0;
      }
      if (bridge.progressBar) bridge.progressBar.style.transform = `scaleX(${t})`;

      if (t >= 1) {
        setBase(f.toPose);
        camera.position.copy(basePosition.current);
        camera.quaternion.copy(baseQuat.current);
        if (bridge.veil) bridge.veil.style.opacity = '0';
        active.current = null;
        bridge.flying = false;
        onArriveRef.current(f.id);
      }
    } else {
      // Varışta / genel görünümde: sınırlı bakınma ve çok hafif mikro hareket.
      const look = smoothLook.current;
      const k = 1 - Math.exp(-dt * 6);
      const target = bridge.look;
      look.yaw += ((reduced ? 0 : target.yaw) - look.yaw) * k;
      look.pitch += ((reduced ? 0 : target.pitch) - look.pitch) * k;
      look.hoverX += ((reduced ? 0 : target.hoverX) - look.hoverX) * k * 0.5;
      look.hoverY += ((reduced ? 0 : target.hoverY) - look.hoverY) * k * 0.5;

      camera.position.copy(basePosition.current);
      if (settle.current > 0) {
        settle.current = Math.max(0, settle.current - dt / 1.6);
        const s = smootherstep(settle.current);
        tmpVec.set(0, 0, 1).applyQuaternion(baseQuat.current).multiplyScalar(s * 45);
        camera.position.add(tmpVec);
      }
      if (!reduced) {
        camera.position.x += Math.sin(clock.current * 0.13) * 0.6;
        camera.position.y += Math.cos(clock.current * 0.17) * 0.45;
      }
      lookEuler.set(
        look.pitch - look.hoverY * 0.025,
        -look.yaw - look.hoverX * 0.035,
        0,
      );
      tmpQuat.setFromEuler(lookEuler);
      camera.quaternion.copy(baseQuat.current).multiply(tmpQuat);
    }

    if (roll !== 0) {
      tmpQuat.setFromAxisAngle(tmpVec.set(0, 0, 1), roll);
      camera.quaternion.multiply(tmpQuat);
    }

    travel.current += (travelTarget - travel.current) * (1 - Math.exp(-dt * 8));
    bridge.travel = reduced ? 0 : travel.current;

    if (Math.abs(camera.fov - fov) > 0.001) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
    camera.updateMatrixWorld();
  });

  return null;
}
