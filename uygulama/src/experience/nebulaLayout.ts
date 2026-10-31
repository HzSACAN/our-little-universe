import { CatmullRomCurve3, Color, Vector3 } from 'three';
import { gaussian, range, seededRandom } from './random';
import { stars } from './world';

// Bulutsular dünya uzayındaki kıvrımlı damarlar boyunca dizilmiş yumuşak
// hacim parçacıklarından oluşur. Damarlar arasında bilinçli koyu boşluklar bırakılır.

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
}

const filaments: Filament[] = [
  // Derin bölüm: turkuaz, mor ve şafak yıldızlarının çevresi ve aralarındaki geçitler.
  {
    points: [[-150, 300, -1850], [80, 430, -1960], [300, 380, -2060]],
    count: 12, size: [70, 160], spread: 50,
    core: palette.fuchsia, edge: palette.purple, intensity: 0.16, stretch: [1.4, 2.6],
  },
  {
    points: [[-60, 520, -1950], [200, 730, -2250], [430, 640, -2520]],
    count: 22, size: [120, 300], spread: 90,
    core: palette.turquoise, edge: palette.blue, intensity: 0.19, stretch: [1.3, 2.8],
  },
  {
    points: [[600, 780, -2600], [900, 1060, -2960], [1160, 900, -3220]],
    count: 22, size: [130, 320], spread: 90,
    core: palette.fuchsia, edge: palette.purple, intensity: 0.2, stretch: [1.4, 2.8],
  },
  {
    points: [[1080, 640, -3120], [1340, 470, -3400]],
    count: 10, size: [90, 200], spread: 60,
    core: palette.green, edge: palette.turquoise, intensity: 0.15, stretch: [1.3, 2.4],
  },
  {
    points: [[1250, 240, -3420], [1620, 500, -3860], [1940, 320, -4220]],
    count: 24, size: [140, 340], spread: 100,
    core: palette.gold, edge: palette.rose, intensity: 0.19, stretch: [1.3, 2.6],
  },
  {
    points: [[1100, 760, -4400], [1800, 520, -4750], [2350, 180, -4500]],
    count: 16, size: [360, 680], spread: 160,
    core: palette.purple, edge: palette.navy, intensity: 0.18, stretch: [1.1, 2],
  },

  // Ön planda, açılışta kameranın iki yanında süzülen mavi-turkuaz tül.
  {
    points: [[-330, -110, 140], [-210, -60, 40], [-160, -150, -80]],
    count: 12, size: [70, 150], spread: 40,
    core: palette.turquoise, edge: palette.blue, intensity: 0.2, stretch: [1.2, 2.2],
  },
  {
    points: [[260, 150, 110], [190, 95, 10], [300, 60, -120]],
    count: 10, size: [70, 140], spread: 40,
    core: palette.fuchsia, edge: palette.purple, intensity: 0.2, stretch: [1.2, 2.4],
  },
  // Sağ alttan derine kıvrılan turkuaz-yeşil ana damar; referanstaki parlak çekirdek.
  {
    points: [[360, -190, -60], [200, -150, -320], [20, -120, -620], [-140, -70, -950], [-330, -40, -1350]],
    count: 46, size: [90, 260], spread: 70,
    core: palette.green, edge: palette.turquoise, intensity: 0.24, stretch: [1.4, 3.2],
  },
  // Sol üstte fuşya/pembe ışık damarları.
  {
    points: [[-470, 230, -120], [-300, 280, -480], [-180, 230, -820], [-420, 190, -1300], [-620, 120, -1700]],
    count: 40, size: [80, 230], spread: 60,
    core: palette.fuchsia, edge: palette.purple, intensity: 0.24, stretch: [1.6, 3.4],
  },
  // Altın yıldızın çevresinde sıcak, altın-pembe bölge.
  {
    points: [[240, -100, -170], [180, -70, -330], [120, 40, -480]],
    count: 20, size: [70, 170], spread: 55,
    core: palette.gold, edge: palette.rose, intensity: 0.2, stretch: [1.2, 2.4],
  },
  // İki yıldız arasındaki yolu kesen ince tül; kamera bunun içinden geçer.
  {
    points: [[210, 0, -640], [40, 90, -730], [-160, 170, -800]],
    count: 18, size: [60, 140], spread: 45,
    core: palette.turquoise, edge: palette.purple, intensity: 0.16, stretch: [1.4, 2.6],
  },
  // Sol altta kızıl/eflatun bölge.
  {
    points: [[-420, -260, -380], [-260, -320, -760], [-120, -330, -1150], [120, -300, -1500]],
    count: 30, size: [100, 260], spread: 70,
    core: palette.rose, edge: palette.purple, intensity: 0.2, stretch: [1.3, 2.8],
  },
  // İkili yıldızın ardında buz mavisi / lavanta ışık.
  {
    points: [[160, 260, -1450], [-60, 210, -1620], [-320, 150, -1780]],
    count: 22, size: [140, 340], spread: 90,
    core: palette.turquoise, edge: palette.blue, intensity: 0.2, stretch: [1.2, 2.4],
  },
  // En arkada geniş mor/lacivert hacim — derinlik zemini.
  {
    points: [[700, 260, -1900], [250, 340, -2300], [-300, 260, -2500], [-850, 120, -2300]],
    count: 26, size: [320, 620], spread: 160,
    core: palette.purple, edge: palette.navy, intensity: 0.2, stretch: [1.1, 2],
  },
  {
    points: [[650, -280, -1700], [330, -380, -2100], [-120, -420, -2350]],
    count: 16, size: [300, 560], spread: 140,
    core: palette.blue, edge: palette.purple, intensity: 0.16, stretch: [1.1, 2],
  },
  // Sağ üstte uzak altın-yeşil vurgu.
  {
    points: [[520, 240, -900], [420, 320, -1250], [560, 380, -1600]],
    count: 14, size: [120, 260], spread: 70,
    core: palette.gold, edge: palette.green, intensity: 0.15, stretch: [1.3, 2.6],
  },
];

export interface NebulaPuffs {
  count: number;
  centers: Float32Array;
  sizes: Float32Array;
  cores: Float32Array;
  edges: Float32Array;
  params: Float32Array; // yoğunluk, tohum, uzama, boşta
  tangents: Float32Array; // damarın yerel yönü; parçacık bu eksende uzar
}

export function buildNebula(share: number): NebulaPuffs {
  const rng = seededRandom(20241106);
  const list: { c: Vector3; size: number; core: Color; edge: Color; tangent: Vector3; p: [number, number, number, number] }[] = [];
  const avoid = Object.values(stars);

  for (const filament of filaments) {
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
        p: [filament.intensity * range(rng, 0.7, 1.25), rng() * 100, range(rng, filament.stretch[0], filament.stretch[1]), 0],
      });
    }
  }

  const count = list.length;
  const centers = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const cores = new Float32Array(count * 3);
  const edges = new Float32Array(count * 3);
  const params = new Float32Array(count * 4);
  const tangents = new Float32Array(count * 3);
  list.forEach((puff, i) => {
    centers.set([puff.c.x, puff.c.y, puff.c.z], i * 3);
    sizes[i] = puff.size;
    cores.set([puff.core.r, puff.core.g, puff.core.b], i * 3);
    edges.set([puff.edge.r, puff.edge.g, puff.edge.b], i * 3);
    params.set(puff.p, i * 4);
    tangents.set([puff.tangent.x, puff.tangent.y, puff.tangent.z], i * 3);
  });
  return { count, centers, sizes, cores, edges, params, tangents };
}
