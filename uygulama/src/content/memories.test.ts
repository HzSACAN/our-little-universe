import { describe, expect, it } from 'vitest';
import { isComplete, memories, nextUnvisited, starOrder } from './memories';

describe('altı yıldızlı hikâye', () => {
  it('altı farklı durağa ve tutarlı sıra numaralarına sahiptir', () => {
    expect(new Set(starOrder).size).toBe(6);
    expect(memories.map((m) => m.index)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it('tekrar ziyaretleri altı farklı keşif olarak saymaz', () => {
    expect(isComplete(Array(6).fill('gold'))).toBe(false);
    expect(isComplete(starOrder.slice(0, 5))).toBe(false);
    expect(isComplete([...starOrder].reverse())).toBe(true);
  });
  it('mektup belirli bir sıraya veya son numaralı yıldıza bağlı değildir', () => {
    expect(isComplete(['dawn', 'violet', 'gold', 'azure', 'binary', 'rose'])).toBe(true);
    expect(isComplete(['dawn', 'dawn', 'violet', 'gold', 'azure', 'binary'])).toBe(false);
    expect(isComplete(['binary', 'rose', 'azure', 'violet', 'gold', 'dawn'])).toBe(true);
  });
  it('her fotoğrafın dosyası ve alternatif metni vardır; boyutu fotograf.mjs sınırındadır', () => {
    const files = Object.keys(import.meta.glob('../../public/anilar/*')).map((f) => f.replace('../../public/', ''));
    for (const { id, photo } of memories) {
      if (!photo) continue;
      expect(files, id).toContain(photo.src);
      expect(photo.alt.trim().length, `${id} alt metni`).toBeGreaterThan(10);
      expect(Math.min(photo.width, photo.height), id).toBeLessThanOrEqual(1200);
      expect(Math.max(photo.width, photo.height), id).toBeLessThanOrEqual(2400);
    }
  });
  it('sıradaki keşfedilmemiş durağa döner ve gerektiğinde başa sarar', () => {
    expect(nextUnvisited(null, [])).toBe('gold');
    expect(nextUnvisited('gold', ['gold', 'binary', 'rose'])).toBe('azure');
    expect(nextUnvisited('dawn', ['dawn', 'gold'])).toBe('binary');
  });
});
