import { CatmullRomCurve3, Color, Vector3 } from 'three';
import { gaussian, range, seededRandom } from './random';
import { stars } from './world';

// Bulutsular dünya uzayındaki kıvrımlı damarlar boyunca dizilmiş yumuşak
// hacim parçacıklarından oluşur. Ana atmosfer mavi/lacivert; diğer renkler bölgesel vurgudur.

export const palette = {
  void: '#040616',
  navy: '#10135a',
  blue: '#3659e3',
  purple: '#703cbe',
  fuchsia: '#d94c9b',
  turquoise: '#6de8de',
  gold: '#e8c58f',
  green: '#9cf2b5',
  rose: '#c73a6a',
  ice: '#8fb4ff',
  indigo: '#2c35a8',
  lavender: '#8a7ae0',
};

interface Filament {
  points: [number, number, number][];
  count: number;
  size: [number, number];
  spread: number;
  core: string;
  edge: string;
  intensity: number;
  stretch: [number, number];
  /**
   * Gaz alanının ölçeği (dünya birimi): aynı damardaki bütün parçacıklar aynı
   * hacmin kesitlerini gösterir. Büyük değer = geniş, uzak yapılar.
   */
  scale: number;
  /** Işıyan yoğunlaşmaların gücü: yalnız seçili bölgeler parlak çekirdek ve ince ayrıntı taşır. */
  glow?: number;
}

// Konumlar Y takımyıldızına göre seçildi (yıldızlar: altın gövde ucunda öne yakın,
// ikili ve pembe gövdede, turkuaz ve mor sol kolda, şafak sağ kolun ucunda).
// Yıldızların çevresinde yüzeyi örtmeyecek kadar boşluk bırakılır (buildNebula).
const filaments: Filament[] = [
  // Ön planda, açılışta kameranın iki yanında süzülen ince tül: paralaksın en güçlü katmanı.
  {
    points: [[-360, -90, 250], [-230, -40, 140], [-180, -140, 10]],
    count: 12, size: [70, 150], spread: 40, scale: 70,
    core: palette.ice, edge: palette.blue, intensity: 0.28, stretch: [1.2, 2.2],
  },
  {
    points: [[280, 170, 230], [200, 110, 120], [320, 60, -20]],
    count: 10, size: [70, 140], spread: 40, scale: 70,
    core: palette.lavender, edge: palette.indigo, intensity: 0.28, stretch: [1.2, 2.4],
  },
  // Sağ alttan derine, sol yukarı kıvrılan turkuaz-yeşil ana damar (referanstaki parlak gövde).
  {
    points: [[460, -280, 60], [270, -230, -280], [90, -70, -740], [-150, 110, -1260], [-370, 320, -1860], [-620, 560, -2480]],
    count: 58, size: [90, 260], spread: 70, scale: 150,
    core: palette.green, edge: palette.turquoise, intensity: 0.5, glow: 1.6, stretch: [1.4, 3.2],
  },
  // Sol üstte bölgesel fuşya vurgusu.
  {
    points: [[-520, 230, -60], [-360, 300, -460], [-260, 250, -880], [-500, 220, -1380], [-760, 160, -1900]],
    count: 44, size: [80, 230], spread: 60, scale: 130,
    core: palette.fuchsia, edge: palette.indigo, intensity: 0.32, glow: 0.7, stretch: [1.6, 3.4],
  },
  // Altın yıldızın ardında sıcak, altın-pembe bölge.
  {
    points: [[190, -40, -430], [90, -250, -540], [-80, -210, -660]],
    count: 20, size: [70, 170], spread: 55, scale: 110,
    core: palette.gold, edge: palette.purple, intensity: 0.3, glow: 0.8, stretch: [1.2, 2.4],
  },
  // Altından ikiliye giden yolu kesen ince tül; kamera bunun içinden geçer.
  {
    points: [[220, -40, -650], [40, -20, -740], [-180, -110, -820]],
    count: 18, size: [60, 140], spread: 45, scale: 90,
    core: palette.ice, edge: palette.indigo, intensity: 0.26, stretch: [1.4, 2.6],
  },
  // Sol altta kızıl/eflatun bölge.
  {
    points: [[-470, -300, -280], [-310, -370, -700], [-170, -400, -1120], [90, -360, -1520]],
    count: 32, size: [100, 260], spread: 70, scale: 150,
    core: palette.rose, edge: palette.indigo, intensity: 0.3, glow: 0.5, stretch: [1.3, 2.8],
  },
  // İkili ve pembe yıldızın (Y'nin gövdesi) ardında buz mavisi / lavanta ışık.
  {
    points: [[260, 110, -1340], [40, 60, -1500], [-280, 20, -1720]],
    count: 22, size: [140, 320], spread: 90, scale: 180,
    core: palette.ice, edge: palette.blue, intensity: 0.32, glow: 0.7, stretch: [1.2, 2.4],
  },
  // Kolların birleştiği düğümün çevresinde fuşya bir tül.
  {
    points: [[-180, 150, -1430], [70, 240, -1620], [290, 170, -1780]],
    count: 16, size: [80, 190], spread: 55, scale: 120,
    core: palette.lavender, edge: palette.indigo, intensity: 0.26, stretch: [1.4, 2.6],
  },
  // Sol kol: turkuaz yıldızın çevresi ve mor yıldıza uzanan geçit.
  {
    points: [[-40, 210, -1950], [-240, 380, -2260], [-450, 360, -2520]],
    count: 22, size: [110, 280], spread: 85, scale: 160,
    core: palette.turquoise, edge: palette.blue, intensity: 0.32, glow: 0.7, stretch: [1.3, 2.8],
  },
  {
    points: [[-280, 600, -2540], [-540, 880, -2900], [-800, 780, -3160]],
    count: 22, size: [120, 300], spread: 90, scale: 180,
    core: palette.fuchsia, edge: palette.indigo, intensity: 0.3, stretch: [1.4, 2.8],
  },
  // Sağ kol: şafak yıldızının altın-pembe ışığı ve yeşil vurgusu.
  {
    points: [[360, 800, -3120], [680, 1060, -3500], [1000, 900, -3820]],
    count: 24, size: [140, 330], spread: 100, scale: 200,
    core: palette.gold, edge: palette.rose, intensity: 0.3, glow: 0.8, stretch: [1.3, 2.6],
  },
  {
    points: [[300, 640, -2860], [470, 520, -3160]],
    count: 10, size: [90, 200], spread: 60, scale: 120,
    core: palette.green, edge: palette.turquoise, intensity: 0.28, glow: 0.8, stretch: [1.3, 2.4],
  },
  // Sağda uzak buz mavisi hacim.
  {
    points: [[560, 200, -900], [470, 320, -1280], [620, 400, -1700]],
    count: 14, size: [120, 260], spread: 70, scale: 150,
    core: palette.ice, edge: palette.blue, intensity: 0.26, stretch: [1.3, 2.6],
  },
  // En arkada geniş mavi/lacivert hacimler — atmosferin zemini.
  {
    points: [[820, 300, -2000], [300, 380, -2400], [-300, 300, -2600], [-920, 160, -2400]],
    count: 26, size: [320, 620], spread: 160, scale: 320,
    core: palette.blue, edge: palette.navy, intensity: 0.32, stretch: [1.1, 2],
  },
  {
    points: [[700, -300, -1800], [330, -400, -2200], [-120, -440, -2450]],
    count: 16, size: [300, 560], spread: 140, scale: 300,
    core: palette.blue, edge: palette.purple, intensity: 0.26, stretch: [1.1, 2],
  },
  {
    points: [[-300, 900, -4300], [450, 1150, -4500], [1250, 820, -4350]],
    count: 18, size: [380, 700], spread: 170, scale: 360,
    core: palette.indigo, edge: palette.navy, intensity: 0.32, stretch: [1.1, 2],
  },
];

export interface NebulaPuffs {
  count: number;
  centers: Float32Array;
  sizes: Float32Array;
  cores: Float32Array;
  edges: Float32Array;
  params: Float32Array; // yoğunluk, damar tohumu, uzama, gaz alanı ölçeği
  glows: Float32Array; // yoğunlaşma gücü
  tangents: Float32Array; // damarın yerel yönü; parçacık bu eksende uzar
}

export function buildNebula(share: number): NebulaPuffs {
  const rng = seededRandom(20241106);
  const list: { c: Vector3; size: number; core: Color; edge: Color; tangent: Vector3; glow: number; p: [number, number, number, number] }[] = [];
  const avoid = Object.values(stars);

  filaments.forEach((filament, index) => {
    // Damarın bütün parçacıkları aynı tohumu paylaşır: üst üste binen kesitler
    // aynı yapıyı güçlendirir, birbirini ortalayıp sise dönüşmez.
    const seed = index * 37.17 + 11.3;
    const curve = new CatmullRomCurve3(filament.points.map((p) => new Vector3(...p)), false, 'centripetal');
    const core = new Color(filament.core);
    const edge = new Color(filament.edge);
    const n = Math.max(3, Math.round(filament.count * share));
    for (let i = 0; i < n; i++) {
      const t = (i + rng() * 0.8) / n;
      const c = curve.getPoint(Math.min(t, 1));
      const tangent = curve
        .getTangent(Math.min(t, 1))
        .add(new Vector3(gaussian(rng), gaussian(rng), gaussian(rng)).multiplyScalar(0.45))
        .normalize();
      c.x += gaussian(rng) * filament.spread;
      c.y += gaussian(rng) * filament.spread * 0.7;
      c.z += gaussian(rng) * filament.spread;
      let size = range(rng, filament.size[0], filament.size[1]);
      // Anı yıldızlarının yüzeyini bulutsu ile örtme.
      for (const body of avoid) {
        const d = c.distanceTo(body.position);
        if (d < size * 0.7 + body.clearance) size = Math.max(30, (d - body.clearance) / 0.7);
      }
      const coreMix = core.clone().lerp(edge, rng() * 0.35);
      list.push({
        c,
        size,
        core: coreMix,
        edge,
        tangent,
        glow: filament.glow ?? 0.3,
        p: [filament.intensity * range(rng, 0.8, 1.15), seed, range(rng, filament.stretch[0], filament.stretch[1]), filament.scale],
      });
    }
  });

  const count = list.length;
  const centers = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const cores = new Float32Array(count * 3);
  const edges = new Float32Array(count * 3);
  const params = new Float32Array(count * 4);
  const tangents = new Float32Array(count * 3);
  const glows = new Float32Array(count);
  list.forEach((puff, i) => {
    centers.set([puff.c.x, puff.c.y, puff.c.z], i * 3);
    sizes[i] = puff.size;
    cores.set([puff.core.r, puff.core.g, puff.core.b], i * 3);
    edges.set([puff.edge.r, puff.edge.g, puff.edge.b], i * 3);
    params.set(puff.p, i * 4);
    tangents.set([puff.tangent.x, puff.tangent.y, puff.tangent.z], i * 3);
    glows[i] = puff.glow;
  });
  return { count, centers, sizes, cores, edges, params, tangents, glows };
}
