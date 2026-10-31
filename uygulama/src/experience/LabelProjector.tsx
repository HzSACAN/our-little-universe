import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { starOrder } from '../content/memories';
import { stars } from './world';
import type { SceneBridge } from './bridge';

const projected = new Vector3();
const activeProjected = new Vector3();

/**
 * Yıldız etiketlerini gerçek projeksiyondan konumlandırır. Ekran dışında,
 * kameranın arkasında ya da öndeki parlak yıldızın arkasında kalan etiketler gizlenir.
 * DOM'a doğrudan yazar; React state güncellenmez.
 */
export function LabelProjector({ bridge }: { bridge: SceneBridge }) {
  const size = useThree((s) => s.size);
  useFrame(({ camera }) => {
    const cam = camera as PerspectiveCamera;
    const focal = size.height / (2 * Math.tan(MathUtils.degToRad(cam.fov / 2)));
    let active: { x: number; y: number; r: number; d: number } | null = null;
    if (bridge.current) {
      const body = stars[bridge.current];
      activeProjected.copy(body.position).project(cam);
      const d = cam.position.distanceTo(body.position);
      active = {
        x: (activeProjected.x * 0.5 + 0.5) * size.width,
        y: (-activeProjected.y * 0.5 + 0.5) * size.height,
        r: (body.radius * 3 * focal) / d,
        d,
      };
    }
    for (const id of starOrder) {
      const el = bridge.labels[id];
      if (!el) continue;
      const body = stars[id];
      projected.copy(body.position).project(cam);
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      const d = cam.position.distanceTo(body.position);
      const ringRadius = Math.max(22, Math.min(80, (body.radius * 1.6 * focal) / d));
      let visible =
        !bridge.flying &&
        id !== bridge.current &&
        projected.z > -1 &&
        projected.z < 1 &&
        x > 24 &&
        x < size.width - 24 &&
        y > 70 &&
        y < size.height - 70;
      if (visible && active && d > active.d && Math.hypot(x - active.x, y - active.y) < active.r + 40) visible = false;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.setProperty('--ring', `${ringRadius.toFixed(1)}px`);
      if (el.dataset.visible !== String(visible)) {
        el.dataset.visible = String(visible);
        el.tabIndex = visible ? 0 : -1;
        el.setAttribute('aria-hidden', String(!visible));
      }
    }
  });
  return null;
}
