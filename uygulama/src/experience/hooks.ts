import { useEffect, useState, type RefObject } from 'react';
import { createTapGuard, type TapGuard } from './tapGuard';
import { layoutFor, type Layout } from './layout';
import { LOOK_LIMITS, type SceneBridge } from './bridge';

export function useLayout(): Layout {
  const [layout, setLayout] = useState<Layout>(() => layoutFor(window.innerWidth, window.innerHeight));
  useEffect(() => {
    const update = () => setLayout(layoutFor(window.innerWidth, window.innerHeight));
    // İlk çizim ile dinleyicinin bağlanması arasındaki boyut değişimi kaçmasın.
    update();
    window.addEventListener('resize', update, { passive: true });
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);
  return layout;
}

/** Sistem tercihine uyar; manuel düğme sistem tercihi değişene kadar geçerlidir. */
export function useReducedMotion(): [boolean, (value: boolean) => void] {
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return [reduced, setReduced];
}

export function useDocumentVisible() {
  const [visible, setVisible] = useState(() => !document.hidden);
  useEffect(() => {
    const onChange = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);
  return visible;
}

export function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    // Three.js 0.186 ve bulutsu sampler3D yolu WebGL2 gerektirir.
    const gl = canvas.getContext('webgl2');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/**
 * Sürükleyerek sınırlı bakınma. Tek parmak/fare ile çalışır; ikinci parmak
 * gelirse sürükleme bırakılır. pointercancel ve yakalama kaybında kontrol takılı kalmaz.
 */
export function useLookControls(target: RefObject<HTMLElement | null>, bridge: SceneBridge, enabled: boolean) {
  useEffect(() => {
    const el = target.current;
    if (!el) return;
    const pointers = new Set<number>();
    let drag: { id: number; x: number; y: number; yaw: number; pitch: number } | null = null;

    const end = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (drag?.id === e.pointerId) drag = null;
    };
    const down = (e: PointerEvent) => {
      pointers.add(e.pointerId);
      if (pointers.size > 1) {
        drag = null;
        return;
      }
      // Sahne ve yıldızın üzerine oturan dokunma hedefi bakınmayı başlatabilir;
      // panel ve düğmeler başlatmaz.
      const origin = e.target instanceof Element ? e.target : null;
      if (!origin?.closest('.stage, [data-look-through]') || !el.isConnected) return;
      if (!enabled || bridge.flying || bridge.reducedMotion || e.button > 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: bridge.look.yaw, pitch: bridge.look.pitch };
    };
    const move = (e: PointerEvent) => {
      if (drag && drag.id === e.pointerId) {
        if (bridge.flying) {
          drag = null;
          return;
        }
        const scale = 1.25 / Math.max(window.innerWidth, 1);
        bridge.look.yaw = clamp(drag.yaw + (e.clientX - drag.x) * scale, -LOOK_LIMITS.yaw, LOOK_LIMITS.yaw);
        bridge.look.pitch = clamp(drag.pitch + (e.clientY - drag.y) * scale, -LOOK_LIMITS.pitch, LOOK_LIMITS.pitch);
      } else if (e.pointerType === 'mouse' && !drag) {
        bridge.look.hoverX = (e.clientX / window.innerWidth - 0.5) * 2;
        bridge.look.hoverY = (e.clientY / window.innerHeight - 0.5) * 2;
      }
    };
    const onBlur = () => {
      drag = null;
      pointers.clear();
    };
    const leave = () => {
      bridge.look.hoverX = 0;
      bridge.look.hoverY = 0;
    };
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', leave);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      el.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', onBlur);
    };
  }, [target, bridge, enabled]);
}

/** Kaba işaretçi (dokunmatik ekran) mi? İpucu metni buna göre seçilir. */
export function useCoarsePointer() {
  const [coarse, setCoarse] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse)');
    const onChange = (e: MediaQueryListEvent) => setCoarse(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return coarse;
}

/** Bir CSS medya sorgusunun güncel sonucu; ekran döndürülünce yeniden değerlendirilir. */
export function useMediaQuery(media: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(media).matches);
  useEffect(() => {
    const query = window.matchMedia(media);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    setMatches(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [media]);
  return matches;
}

/**
 * Sayfadaki bütün işaretçi basışlarını izleyen dokunuş koruması. Basış başladığında
 * o anki varış kimliği kaydedilir; sürükleme, pointercancel ve ikinci parmak dokunuşu bozar.
 */
export function useTapGuard(arrival: RefObject<number>): TapGuard {
  const [guard] = useState(createTapGuard);
  useEffect(() => {
    const opts = { capture: true, passive: true } as const;
    const down = (e: PointerEvent) => guard.down(e.pointerId, e.clientX, e.clientY, arrival.current);
    const move = (e: PointerEvent) => guard.move(e.pointerId, e.clientX, e.clientY);
    const up = (e: PointerEvent) => guard.up(e.pointerId);
    const cancel = (e: PointerEvent) => guard.cancel(e.pointerId);
    window.addEventListener('pointerdown', down, opts);
    window.addEventListener('pointermove', move, opts);
    window.addEventListener('pointerup', up, opts);
    window.addEventListener('pointercancel', cancel, opts);
    return () => {
      window.removeEventListener('pointerdown', down, opts);
      window.removeEventListener('pointermove', move, opts);
      window.removeEventListener('pointerup', up, opts);
      window.removeEventListener('pointercancel', cancel, opts);
    };
  }, [guard, arrival]);
  return guard;
}
