import { Quaternion, Vector3 } from 'three';
import { HOME_EYE } from './world';

// Açılış pilotunun dokulu bulutsu katmanları. Her katman dünya uzayında sabit, saydam
// bir yüzeydir. Konum, Y takımyıldızı gibi genel görünüm göz noktasından yön (u, v) ve
// uzaklıkla tanımlanır (constellationGraph.ts). Böylece yerleşim gerçek projeksiyona göre
// yapılır. Masaüstünde bakış Y'nin soluna dönük (merkez u ≈ −0.29), telefonda aşağıya
// (merkez v ≈ −0.27). Bu yüzden ayrıntı Y'nin arkasına ve sağına, başlığın tarafı ise
// sakin ve koyu kalır.

export type NebulaTextureId = 'cyan-gold' | 'rose-violet';

export const nebulaTextures: Record<NebulaTextureId, { file: string; aspect: number }> = {
  // Kaynak PNG'ler 1672×941, düz (premultiplied olmayan) alfa.
  'cyan-gold': { file: 'assets/nebula/nebula-cyan-gold.png', aspect: 941 / 1672 },
  'rose-violet': { file: 'assets/nebula/nebula-rose-violet.png', aspect: 941 / 1672 },
};

export interface TexturedLayer {
  id: string;
  texture: NebulaTextureId;
  /** Genel görünüm göz noktasından yön (tanjant birimi) ve uzaklık. */
  u: number;
  v: number;
  distance: number;
  /** Görüş açısı biriminde genişlik: dünya genişliği = width × distance. En-boy oranı dokudan gelir. */
  width: number;
  /** Bakış ekseni etrafında dönüş (derece) ve aynalama: aynı doku iki yerde aynı damga gibi görünmez. */
  roll: number;
  mirror: boolean;
  /** Yüzeyin göz noktasına tam dönük olmaması için küçük eğim (derece). */
  tilt: [number, number];
  opacity: number;
  /** Renk çarpanı: uzak/ön plan katmanları daha koyu, tozlu okunur. */
  exposure: number;
  /** Düzleme uzaklığa göre sönümleme: bu aralıkta tamamen görünmezden tam görünüre geçer. */
  fade: [number, number];
  /** Kalite önceliği: 1 ana kompozisyon; büyük sayı önce kapanır. */
  priority: 1 | 2 | 3;
}

export const texturedLayers: TexturedLayer[] = [
  // Ana ışık kütlesi: Y'nin arkasında, sağa doğru iniyor. Şampanya çekirdek, turkuaz akış.
  {
    id: 'cekirdek', texture: 'cyan-gold', u: 0.15, v: -0.04, distance: 5200, width: 0.86,
    roll: -26, mirror: false, tilt: [6, -4], opacity: 1, exposure: 1, fade: [500, 1400], priority: 1,
  },
  // Sağ üstte pembe-mor yay; referanstaki üst bölge.
  {
    id: 'ust-mor', texture: 'rose-violet', u: 0.36, v: 0.34, distance: 6400, width: 0.74,
    roll: -14, mirror: false, tilt: [-5, 8], opacity: 0.72, exposure: 0.9, fade: [600, 1600], priority: 1,
  },
  // Sağ altta daha yakın turkuaz kütle: uçuşta ve bakınmada ana katmandan ayrışır.
  {
    id: 'alt-turkuaz', texture: 'cyan-gold', u: 0.3, v: -0.31, distance: 3000, width: 0.6,
    roll: 32, mirror: true, tilt: [-8, 10], opacity: 0.6, exposure: 0.75, fade: [300, 900], priority: 2,
  },
  // En arkada, Y'nin çevresinde sönük, geniş mor gaz: yıldızlar koyu boşlukta asılı kalmaz.
  {
    id: 'derin-mor', texture: 'rose-violet', u: 0.02, v: 0.1, distance: 7600, width: 1,
    roll: 152, mirror: true, tilt: [4, -6], opacity: 0.5, exposure: 0.6, fade: [700, 1800], priority: 2,
  },
  // Sağ alt ön planda koyu, tozlu kütle: ışıklı kenarlı karanlık bulut (referansın ön planı).
  {
    id: 'on-toz', texture: 'rose-violet', u: 0.34, v: -0.4, distance: 1800, width: 0.5,
    roll: 196, mirror: false, tilt: [6, 14], opacity: 0.75, exposure: 0.38, fade: [200, 600], priority: 3,
  },
  // Kameraya yakın, sağ üstte ince tül: ilk yıldıza uçuşta en güçlü paralaks katmanı.
  {
    id: 'yakin-tul', texture: 'rose-violet', u: 0.42, v: 0.3, distance: 950, width: 0.45,
    roll: -38, mirror: true, tilt: [10, -12], opacity: 0.3, exposure: 0.8, fade: [120, 420], priority: 3,
  },
];

/** Kademeye göre çizilen en yüksek öncelik: düşük katkılı katmanlar önce kapanır. */
export const layerBudget = { high: 3, medium: 2, low: 1 } as const;

export interface PlacedLayer extends TexturedLayer {
  center: Vector3;
  normal: Vector3;
  quaternion: Quaternion;
  size: [number, number];
}

const forward = new Vector3(0, 0, 1);
const D2R = Math.PI / 180;

export function placeLayer(layer: TexturedLayer): PlacedLayer {
  const center = new Vector3(layer.u * layer.distance, layer.v * layer.distance, -layer.distance).add(HOME_EYE);
  // Yüzey göz noktasına döner, ardından küçük bir eğim ve bakış ekseni etrafında dönüş alır.
  const toEye = HOME_EYE.clone().sub(center).normalize();
  const quaternion = new Quaternion().setFromUnitVectors(forward, toEye);
  const tilt = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), layer.tilt[0] * D2R)
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), layer.tilt[1] * D2R));
  quaternion.multiply(tilt).multiply(new Quaternion().setFromAxisAngle(forward, layer.roll * D2R));
  const normal = forward.clone().applyQuaternion(quaternion);
  const w = layer.width * layer.distance;
  return { ...layer, center, normal, quaternion, size: [w, w * nebulaTextures[layer.texture].aspect] };
}

export const placedLayers = texturedLayers.map(placeLayer);

/**
 * Bir noktanın, genel görünüm göz noktasından bakınca ana dokulu katmanların önünde ya da
 * içinde kalma ağırlığı (0–1). Prosedürel bulutsu bu bölgede yerel olarak azaltılır:
 * ayrıntılı dokuların üstüne aynı güçte parlak sis binmez.
 */
export function texturedCover(point: Vector3): number {
  const depth = HOME_EYE.z - point.z;
  if (depth <= 0) return 0;
  const u = (point.x - HOME_EYE.x) / depth;
  const v = (point.y - HOME_EYE.y) / depth;
  let cover = 0;
  for (const layer of texturedLayers) {
    if (layer.priority > 2 || depth > layer.distance + 400) continue;
    const a = layer.roll * D2R;
    const du = u - layer.u, dv = v - layer.v;
    // Katmanın kendi eksenlerinde, gaz gövdesinin kapladığı elips (dokunun ~%75'i).
    const x = (du * Math.cos(a) + dv * Math.sin(a)) / (layer.width * 0.38);
    const y = (-du * Math.sin(a) + dv * Math.cos(a)) / (layer.width * nebulaTextures[layer.texture].aspect * 0.34);
    const r = Math.hypot(x, y);
    const t = Math.min(1, Math.max(0, (r - 0.55) / 0.45));
    cover = Math.max(cover, (1 - t * t * (3 - 2 * t)) * Math.max(0.7, layer.opacity));
  }
  return cover;
}

/**
 * Prosedürel bulutsunun kameraya bağlı gücü. Açılışta ve ilk yıldız rotasında (kamera
 * z > −350) %40'ta kalır: referanstaki koyu lacivert boşluklar ve ayrıntılı dokular okunur.
 * Kamera derine ilerledikçe (z −350 → −1100, ikili yıldıza doğru) yumuşakça tam güce döner;
 * diğer rotalarda stil ani değişmez.
 */
export function proceduralDim(cameraZ: number) {
  const t = Math.min(1, Math.max(0, (-350 - cameraZ) / 750));
  return 0.4 + 0.6 * t * t * (3 - 2 * t);
}
