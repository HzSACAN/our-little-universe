import { describe, expect, it } from 'vitest';
import { discoveredEdges, isComplete, memories, nextUnvisited, starOrder } from './memories';

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
  it('yalnız iki ucu keşfedilmiş komşu yıldızları bağlar', () => {
    expect(discoveredEdges(['gold', 'rose'])).toEqual([]);
    expect(discoveredEdges(['rose', 'binary', 'gold'])).toEqual([['gold', 'binary'], ['binary', 'rose']]);
  });
  it('kapanış çizgisini ancak bütün yıldızlar keşfedildiğinde ekler', () => {
    expect(discoveredEdges(['gold', 'dawn'])).toEqual([]);
    expect(discoveredEdges(starOrder)).toHaveLength(6);
    expect(discoveredEdges([...starOrder].reverse()).at(-1)).toEqual(['dawn', 'gold']);
  });
  it('sıradaki keşfedilmemiş durağa döner ve gerektiğinde başa sarar', () => {
    expect(nextUnvisited(null, [])).toBe('gold');
    expect(nextUnvisited('gold', ['gold', 'binary', 'rose'])).toBe('azure');
    expect(nextUnvisited('dawn', ['dawn', 'gold'])).toBe('binary');
  });
});
