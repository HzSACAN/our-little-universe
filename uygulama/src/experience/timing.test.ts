import { describe, expect, it } from 'vitest';
import { createFrameClock, createQualityWindow, frameSeconds, restartFrameClock, shouldLowerQuality } from './timing';

const tripSeconds = (fps: number) => {
  const clock = createFrameClock();
  frameSeconds(clock, 10); // açılış/derleme zamanı yolculuğa eklenmez
  let elapsed = 0;
  let wall = 0;
  while (elapsed < 4 && wall < 30) {
    wall += 1 / fps;
    elapsed += frameSeconds(clock, 1 / fps);
  }
  return wall;
};

describe('aktif yolculuk zamanı', () => {
  it.each([60, 30, 15, 5])('%i FPS: 4 sn yolculuk düşük FPS yüzünden uzamaz', (fps) => {
    expect(tripSeconds(fps)).toBeGreaterThanOrEqual(4 - 1e-9);
    expect(tripSeconds(fps)).toBeLessThanOrEqual(4 + 1 / fps + 1e-9);
  });

  it('gizli sekmeden dönüşte boş zamanı atlar, sonraki yavaş aktif kareyi korur', () => {
    const clock = createFrameClock();
    frameSeconds(clock, 0.01);
    expect(frameSeconds(clock, 0.05)).toBe(0.05);
    restartFrameClock(clock);
    expect(frameSeconds(clock, 120)).toBe(0);
    expect(frameSeconds(clock, 0.3)).toBe(0.3);
  });

  it('geçersiz delta süreyi bozmaz', () => {
    const clock = createFrameClock();
    frameSeconds(clock, 0);
    for (const dt of [NaN, Infinity, -1, 0]) expect(frameSeconds(clock, dt)).toBe(0);
  });
});

describe('kalite kademesini düşürme', () => {
  it.each([0.03, 0.1, 0.3, 0.6])('%s sn aktif karelerde en geç 8 sn içinde tepki verir', (delta) => {
    const window = createQualityWindow();
    let elapsed = 0;
    let lowered = false;
    while (elapsed < 8 && !lowered) {
      elapsed += delta;
      lowered = shouldLowerQuality(window, delta);
    }
    expect(lowered).toBe(true);
    expect(elapsed).toBeLessThanOrEqual(8);
  });

  it('60 FPS ve seyrek tekil takılmada kaliteyi düşürmez', () => {
    const window = createQualityWindow();
    for (let i = 0; i < 1200; i++) {
      expect(shouldLowerQuality(window, i % 180 === 0 ? 0.3 : 1 / 60)).toBe(false);
    }
  });

  it('bir yavaş pencereden sonra sağlıklı pencere gelirse uyarıları sıfırlar', () => {
    const window = createQualityWindow();
    for (let i = 0; i < 40; i++) expect(shouldLowerQuality(window, 0.1)).toBe(false);
    for (let i = 0; i < 240; i++) expect(shouldLowerQuality(window, 1 / 60)).toBe(false);
    expect(window.strikes).toBe(0);
  });
});
