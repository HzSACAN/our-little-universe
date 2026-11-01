import type { StarId } from '../content/memories';

// Takımyıldız, Yağmur'un baş harfi olan bir Y çizer. Anıların hikâye sırası
// (content/memories.ts) ile bu bağlantı grafiği bilerek ayrıdır: Y dallanan bir
// şekildir, halka gibi kapanmaz ve son yıldızdan ilkine dönen bir kenarı yoktur.
//
//        violet ·            · dawn
//                \          /
//          azure ·  \      /
//                     \  /
//                    rose      ← kolların birleştiği düğüm
//                      |
//                   binary
//                      |
//                    gold      ← gövdenin ucu, hikâyenin başladığı yer

export type YRole = 'stem-root' | 'stem' | 'fork' | 'arm-left-mid' | 'arm-left-tip' | 'arm-right-tip';

export const yRoles: Record<StarId, YRole> = {
  gold: 'stem-root',
  binary: 'stem',
  rose: 'fork',
  azure: 'arm-left-mid',
  violet: 'arm-left-tip',
  dawn: 'arm-right-tip',
};

/**
 * Genel görünüm kamerasından bakış yönü (u, v: kamera eksenlerine göre tanjant)
 * ve uzaklık. Dünya konumları bundan türetilir; yıldızlar farklı derinliklerde
 * kaldığı için Y yalnızca bu bakıştan okunur, uçuşta derinliği açığa çıkar.
 * Hafif asimetri ve düzensiz aralıklar bilinçlidir: font çizgisi gibi değil,
 * gökyüzündeki bir takımyıldız gibi görünmesi için.
 */
export const yLayout: Record<StarId, { u: number; v: number; distance: number }> = {
  gold: { u: 0.022, v: -0.252, distance: 700 },
  binary: { u: -0.008, v: -0.118, distance: 1450 },
  rose: { u: 0.004, v: 0.006, distance: 2000 },
  azure: { u: -0.078, v: 0.098, distance: 2550 },
  violet: { u: -0.152, v: 0.214, distance: 3150 },
  dawn: { u: 0.168, v: 0.236, distance: 3800 },
};

/** Y'nin kenarları: gövde (iki kenar), sol kol (iki kenar), sağ kol (bir kenar). */
export const constellationEdges: readonly [StarId, StarId][] = [
  ['gold', 'binary'],
  ['binary', 'rose'],
  ['rose', 'azure'],
  ['azure', 'violet'],
  ['rose', 'dawn'],
];

/**
 * Bir kenar, iki ucundaki yıldız da keşfedildiğinde açılır. Sonuç ziyaret
 * sırasından bağımsızdır; kenarlar her zaman sabit grafik sırasıyla döner.
 */
export function discoveredEdges(visited: readonly StarId[]): [StarId, StarId][] {
  return constellationEdges.filter(([a, b]) => visited.includes(a) && visited.includes(b));
}
