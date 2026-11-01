import { describe, expect, it } from 'vitest';
import { starOrder, type StarId } from '../content/memories';
import { constellationEdges, discoveredEdges, yRoles } from './constellationGraph';

const degree = (id: StarId) => constellationEdges.filter(([a, b]) => a === id || b === id).length;

// Basit karıştırma: aynı sıralar tekrar üretilebilsin diye tohumlu.
function permutations(seed: number, count: number): StarId[][] {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: count }, () => {
    const order = [...starOrder];
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  });
}

describe('Y takımyıldızı grafiği', () => {
  it('altı yıldızın hepsini kullanan, döngüsüz beş kenarlı bir ağaçtır', () => {
    expect(constellationEdges).toHaveLength(5);
    const used = new Set(constellationEdges.flat());
    expect([...used].sort()).toEqual([...starOrder].sort());
    // Birleşim-bul ile döngü kontrolü: 6 düğüm, 5 kenar, tek bileşen.
    const parent = Object.fromEntries(starOrder.map((id) => [id, id])) as Record<StarId, StarId>;
    const find = (x: StarId): StarId => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    for (const [a, b] of constellationEdges) {
      expect(find(a)).not.toBe(find(b));
      parent[find(a)] = find(b);
    }
  });

  it('bir çatal düğümü (derece 3), üç uç (derece 1) ve iki ara düğüm vardır', () => {
    const fork = starOrder.filter((id) => degree(id) === 3);
    expect(fork).toEqual(['rose']);
    expect(yRoles.rose).toBe('fork');
    const tips = starOrder.filter((id) => degree(id) === 1).sort();
    expect(tips).toEqual(['dawn', 'gold', 'violet']);
    expect(starOrder.filter((id) => degree(id) === 2).sort()).toEqual(['azure', 'binary']);
  });

  it('eski halkanın son yıldızdan ilk yıldıza kapanış kenarını içermez', () => {
    const has = (a: StarId, b: StarId) => constellationEdges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    expect(has('dawn', 'gold')).toBe(false);
    expect(discoveredEdges(starOrder).some(([a, b]) => a === 'dawn' && b === 'gold')).toBe(false);
  });

  it('bir bağlantı yalnızca iki ucu keşfedilince açılır', () => {
    expect(discoveredEdges([])).toEqual([]);
    expect(discoveredEdges(['gold'])).toEqual([]);
    expect(discoveredEdges(['gold', 'rose'])).toEqual([]);
    expect(discoveredEdges(['rose', 'dawn'])).toEqual([['rose', 'dawn']]);
    expect(discoveredEdges(['violet', 'azure', 'gold'])).toEqual([['azure', 'violet']]);
  });

  it('farklı ziyaret sıraları her adımda aynı kenar kümesini ve aynı nihai Y’yi üretir', () => {
    const finalEdges = discoveredEdges(starOrder);
    expect(finalEdges).toEqual([...constellationEdges]);
    for (const order of permutations(1106, 40)) {
      for (let k = 1; k <= order.length; k++) {
        const prefix = order.slice(0, k);
        // Aynı yıldız kümesi hangi sırayla keşfedilirse keşfedilsin aynı sonuç.
        expect(discoveredEdges(prefix)).toEqual(discoveredEdges([...prefix].reverse()));
      }
      expect(discoveredEdges(order)).toEqual(finalEdges);
    }
  });

  it('tekrar ziyaretler kenar çoğaltmaz', () => {
    expect(discoveredEdges(['gold', 'binary', 'gold', 'binary'])).toEqual([['gold', 'binary']]);
  });
});
