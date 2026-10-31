import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { HalfFloatType, NoToneMapping } from 'three';
import type { StarId } from '../content/memories';
import type { Flight, Destination } from './state';
import type { SceneBridge } from './bridge';
import { qualitySettings, type QualityTier } from './quality';
import { Sky } from './Sky';
import { Nebula } from './Nebula';
import { Starfield } from './Starfield';
import { MemoryStars } from './MemoryStars';
import { CameraRig } from './CameraRig';
import { LabelProjector } from './LabelProjector';
import type { Layout } from './world';

interface SceneProps {
  layout: Layout;
  at: Destination;
  flight: Flight | null;
  bridge: SceneBridge;
  tier: QualityTier;
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
  const { layout, at, flight, bridge, tier, running, interactive, onArrive, onSelect, onContextLost, onSlow } = props;
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
      <CameraRig layout={layout} at={at} flight={flight} bridge={bridge} onArrive={onArrive} />
      <LabelProjector bridge={bridge} />
      <QualityGovernor tier={tier} onSlow={onSlow} />
      <PerfProbe />
      {!disabled.has('post') && (
      <EffectComposer multisampling={q.multisampling} frameBufferType={HalfFloatType} resolutionScale={1}>
        {/* Yalnızca HDR parlaklığı eşiği aşan yıldız çekirdekleri ve korona ışık yayar. */}
        <Bloom
          mipmapBlur
          luminanceThreshold={1.0}
          luminanceSmoothing={0.25}
          intensity={0.75}
          radius={0.72}
          resolutionScale={q.bloomScale}
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
 * bulutsu yoğunluğu ve bloom çözünürlüğü düşer; görsel dil korunur.
 */
function QualityGovernor({ tier, onSlow }: { tier: QualityTier; onSlow: () => void }) {
  const samples = useRef<number[]>([]);
  const strikes = useRef(0);
  const warmup = useRef(1.5);
  useEffect(() => {
    samples.current = [];
    strikes.current = 0;
    warmup.current = 1.5;
  }, [tier]);
  useFrame((_, delta) => {
    if (tier === 'low') return;
    if (delta > 0.25) return; // sekme dönüşü vb.
    if (warmup.current > 0) {
      warmup.current -= delta;
      return;
    }
    samples.current.push(delta);
    if (samples.current.length < 120) return;
    const sorted = [...samples.current].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    samples.current = [];
    // Medyan ~45 fps altındaysa bir kademe in (önce bulutsu çözünürlüğü ve örnekleme).
    strikes.current = median > 1 / 45 ? strikes.current + 1 : 0;
    if (strikes.current >= 2) {
      strikes.current = 0;
      onSlow();
    }
  });
  return null;
}

declare global {
  interface Window {
    __olcum?: () => Record<string, number | string>;
  }
}

/** Yalnızca `?olcum` adresinde açık; hediye arayüzünde sayaç göstermez. */
function PerfProbe() {
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
