/** Tekrarlanabilir dağılım için küçük tohumlu üreteç (mulberry32). */
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof seededRandom>;

export const range = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
export const gaussian = (rng: Rng) => (rng() + rng() + rng() - 1.5) / 1.5;
