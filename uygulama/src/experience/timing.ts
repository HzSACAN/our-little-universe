/** Sahne ilk açıldığında ve gizli sekmeden döndüğünde geçen boş zamanı atlar. */
export interface FrameClock {
  skipNext: boolean;
}

export const createFrameClock = (): FrameClock => ({ skipNext: true });

export function restartFrameClock(clock: FrameClock) {
  clock.skipNext = true;
}

/** Aktif sahnedeki süre FPS'e göre kırpılmaz; uçuş duvar saatiyle aynı hızda ilerler. */
export function frameSeconds(clock: FrameClock, delta: number): number {
  if (clock.skipNext) {
    clock.skipNext = false;
    return 0;
  }
  return Number.isFinite(delta) && delta > 0 ? delta : 0;
}

export interface QualityWindow {
  warmup: number;
  elapsed: number;
  samples: number[];
  strikes: number;
}

export const createQualityWindow = (): QualityWindow => ({
  warmup: 1.5,
  elapsed: 0,
  samples: [],
  strikes: 0,
});

/**
 * İki ardışık 2 sn penceresinde medyan 45 FPS altındaysa kaliteyi azaltır.
 * 250 ms'den yavaş aktif kareler de sayılır; düşük FPS'te 120 kare beklenmez.
 */
export function shouldLowerQuality(window: QualityWindow, delta: number): boolean {
  if (!Number.isFinite(delta) || delta <= 0) return false;
  if (window.warmup > 0) {
    window.warmup = Math.max(0, window.warmup - delta);
    return false;
  }
  window.elapsed += delta;
  window.samples.push(delta);
  if (window.elapsed < 2 || window.samples.length < 3) return false;
  window.samples.sort((a, b) => a - b);
  const median = window.samples[Math.floor(window.samples.length / 2)];
  window.strikes = median > 1 / 45 ? window.strikes + 1 : 0;
  window.elapsed = 0;
  window.samples = [];
  if (window.strikes < 2) return false;
  window.strikes = 0;
  return true;
}
