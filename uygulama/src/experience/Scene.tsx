import { useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { HalfFloatType, NoToneMapping } from 'three';
import type { StarId } from '../content/memories';
import type { Flight, Destination } from './state';
import type { SceneBridge } from './bridge';
import { createFrameClock, createQualityWindow, frameSeconds, restartFrameClock, shouldLowerQuality } from './timing';
import { qualitySettings, type QualityTier } from './quality';
import { Sky } from './Sky';
import { Nebula } from './Nebula';
import { Starfield } from './Starfield';
import { Constellation } from './Constellation';
import { MemoryStars } from './MemoryStars';
import { Beacons } from './Beacons';
import { CameraRig } from './CameraRig';
import { LabelProjector } from './LabelProjector';
import type { Layout } from './world';

interface SceneProps {
  layout: Layout;
  at: Destination;
  flight: Flight | null;
  bridge: SceneBridge;
  tier: QualityTier;
  visited: StarId[];
  running: boolean;
  interactive: boolean;
  onArrive: (flightId: number) => void;
  onSelect: (id: StarId) => void;
  onContextLost: () => void;
  onSlow: () => void;
}

// Ölçüm sırasında katmanları tek tek kapatmak için: ?olcum&kapat=nebula,bloom
const disabled = new Set(
  new URLSearchParams(window.location.search).has('olcum')
    ? (new URLSearchParams(window.location.search).get('kapat') ?? '').split(',')
    : [],
);

export function Scene(props: SceneProps) {
  const { layout, at, flight, bridge, tier, visited, running, interactive, onArrive, onSelect, onContextLost, onSlow } = props;
  const q = qualitySettings(tier);
  return (
    <Canvas
      dpr={q.dpr}
      frameloop={running ? 'always' : 'never'}
      gl={{ antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false, depth: true }}
      camera={{ fov: 50, near: 0.5, far: 9000, position: [0, 0, 300] }}
      onCreated={({ gl }) => {
        gl.toneMapping = NoToneMapping;
        gl.setClearColor('#040616', 1);
        gl.domElement.dataset.renderer = gl.capabilities.isWebGL2 ? 'webgl2' : 'webgl';
      }}
      aria-hidden
    >
      <ContextWatcher onLost={onContextLost} />
      {!disabled.has('sky') && <Sky octaves={q.skyOctaves} />}
      {!disabled.has('stars') && <Starfield far={q.farStars} mid={q.midStars} dust={q.dust} bridge={bridge} />}
      {!disabled.has('nebula') && (
        <Nebula share={q.nebulaShare} octaves={q.nebulaOctaves} resolution={q.nebulaResolution} bridge={bridge} />
      )}
      {!disabled.has('memory') && <MemoryStars bridge={bridge} interactive={interactive} onSelect={onSelect} />}
      <Constellation visited={visited} bridge={bridge} />
      {!disabled.has('memory') && <Beacons />}
      <CameraRig layout={layout} at={at} flight={flight} bridge={bridge} onArrive={onArrive} running={running} />
      <LabelProjector bridge={bridge} />
      <QualityGovernor tier={tier} running={running} onSlow={onSlow} />
      <PerfProbe tier={tier} />
      {!disabled.has('post') && (
      <EffectComposer multisampling={q.multisampling} frameBufferType={HalfFloatType} resolutionScale={1}>
        {/* Yalnızca HDR parlaklığı eşiği aşan yıldız çekirdekleri ve korona ışık yayar. */}
        <Bloom
          mipmapBlur
          luminanceThreshold={1.0}
          luminanceSmoothing={0.25}
          intensity={0.75}
          radius={0.72}
          levels={q.bloomLevels}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette offset={0.32} darkness={0.42} />
      </EffectComposer>
      )}
    </Canvas>
  );
}

function ContextWatcher({ onLost }: { onLost: () => void }) {
  const gl = useThree((s) => s.gl);
  const onLostRef = useRef(onLost);
  onLostRef.current = onLost;
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (e: Event) => {
      e.preventDefault();
      onLostRef.current();
    };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl]);
  return null;
}

/**
 * Sürekli yavaş çizimde bir alt kalite kademesine iner. Önce piksel oranı,
 * bulutsu yoğunluğu ve bloom geçiş sayısı düşer; görsel dil korunur.
 */
function QualityGovernor({ tier, running, onSlow }: { tier: QualityTier; running: boolean; onSlow: () => void }) {
  const window = useRef(createQualityWindow());
  const clock = useRef(createFrameClock());
  useLayoutEffect(() => {
    window.current = createQualityWindow();
    restartFrameClock(clock.current);
  }, [tier, running]);
  useFrame((_, delta) => {
    if (!running || tier === 'low') return;
    if (shouldLowerQuality(window.current, frameSeconds(clock.current, delta))) onSlow();
  });
  return null;
}

declare global {
  interface Window {
    __olcum?: () => Record<string, number | string>;
  }
}

/** Yalnızca `?olcum` adresinde açık; hediye arayüzünde sayaç göstermez. */
function PerfProbe({ tier }: { tier: QualityTier }) {
  const tierRef = useRef(tier);
  tierRef.current = tier;
  const gl = useThree((s) => s.gl);
  const frames = useRef<number[]>([]);
  const lastInfo = useRef({ calls: 0, triangles: 0 });
  const enabled = useRef(new URLSearchParams(window.location.search).has('olcum'));
  useEffect(() => {
    if (!enabled.current) return;
    // Son işleme birden çok geçiş çizer; sayaçları frame başına biz sıfırlarız.
    gl.info.autoReset = false;
    const read = () => {
      const sorted = [...frames.current].sort((a, b) => a - b);
      const pick = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
      const result = {
        frames: sorted.length,
        p50: +(pick(0.5) * 1000).toFixed(2),
        p95: +(pick(0.95) * 1000).toFixed(2),
        p99: +(pick(0.99) * 1000).toFixed(2),
        longFrames: sorted.filter((d) => d > 1 / 30).length,
        calls: lastInfo.current.calls,
        triangles: lastInfo.current.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
        programs: gl.info.programs?.length ?? 0,
        dpr: gl.getPixelRatio(),
        tier: tierRef.current,
      };
      frames.current = [];
      return result;
    };
    window.__olcum = read;
    return () => {
      gl.info.autoReset = true;
      // Kök gecikmeli kapanır; yeni kökün ölçüm fonksiyonunu silme.
      if (window.__olcum === read) delete window.__olcum;
    };
  }, [gl]);
  useFrame((_, delta) => {
    if (!enabled.current) return;
    lastInfo.current = { calls: gl.info.render.calls, triangles: gl.info.render.triangles };
    gl.info.reset();
    if (delta > 0.5) return;
    frames.current.push(delta);
    if (frames.current.length > 6000) frames.current.shift();
  });
  return null;
}
