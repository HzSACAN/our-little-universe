import { Quaternion, Vector3 } from 'three';
import { HOME_EYE } from './world';

// Açılış pilotunun dokulu bulutsu katmanları. Her katman dünya uzayında sabit, saydam
// bir yüzeydir. Konum, Y takımyıldızı gibi genel görünüm göz noktasından yön (u, v) ve
// uzaklıkla tanımlanır (constellationGraph.ts). Böylece yerleşim gerçek projeksiyona göre
// yapılır. Masaüstünde bakış Y'nin soluna dönük (merkez u ≈ −0.29), telefonda aşağıya
// (merkez v ≈ −0.27). Bu yüzden ayrıntı Y'nin arkasına ve sağına, başlığın tarafı ise
// sakin ve koyu kalır.

export type NebulaTextureId = 'veil';

export const nebulaTextures: Record<NebulaTextureId, { file: string; aspect: number }> = {
  'veil': { file: 'assets/nebula/galaxy-veil.png', aspect: 0.5 },
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
  /** Yakın geçitler yalnız bu uzaklığa kadar çizilir; sona doğru yumuşakça söner. */
  farFade?: [number, number];
  /** Kalite önceliği: 1 ana kompozisyon; büyük sayı önce kapanır. */
  priority: 1 | 2 | 3;
}

export const texturedLayers: TexturedLayer[] = [
  // Gaz hacimlerinin ince ışıklı kenarları. Rotalar bu düzeyleri gerçekten geçer;
  // yaklaşırken ayrıntı kenarlardan akar, iç kısım JourneyNebula hacmiyle sürer.
  {
    id: 'gecit-1', texture: 'veil', u: -.4, v: -.3, distance: 300, width: 3.4,
    roll: 18, mirror: false, tilt: [10, -8], opacity: .38, exposure: .9, fade: [12, 100], farFade: [1100, 1600], priority: 1,
  },
  {
    id: 'gecit-2', texture: 'veil', u: .077, v: -.106, distance: 1040, width: 1.2,
    roll: -48, mirror: true, tilt: [-8, 14], opacity: .38, exposure: 1, fade: [15, 130], farFade: [1100, 1600], priority: 1,
  },
  {
    id: 'gecit-3', texture: 'veil', u: .048, v: .048, distance: 1670, width: .85,
    roll: 112, mirror: false, tilt: [12, 8], opacity: .38, exposure: .85, fade: [15, 140], farFade: [1100, 1600], priority: 1,
  },
  {
    id: 'gecit-4', texture: 'veil', u: -.013, v: .124, distance: 2250, width: .7,
    roll: 166, mirror: true, tilt: [-12, -6], opacity: .36, exposure: .95, fade: [15, 140], farFade: [1100, 1600], priority: 1,
  },
  {
    id: 'gecit-5', texture: 'veil', u: -.028, v: .186, distance: 2850, width: .65,
    roll: 65, mirror: false, tilt: [8, -10], opacity: .38, exposure: 1, fade: [15, 150], farFade: [1100, 1600], priority: 1,
  },
  {
    id: 'gecit-6', texture: 'veil', u: .072, v: .222, distance: 3470, width: .55,
    roll: -23, mirror: true, tilt: [-8, 8], opacity: .35, exposure: .9, fade: [15, 150], farFade: [1100, 1600], priority: 1,
  },
  // Restrained world-space wisps; the distant sky carries the composition.
  {
    id: 'yakin-mavi-tul', texture: 'veil', u: 0.45, v: -0.35, distance: 1600, width: 1.6,
    roll: -12, mirror: false, tilt: [8, -12], opacity: 0.22, exposure: 0.48, fade: [200, 850], priority: 1,
  },
  {
    id: 'uzak-mor-tul', texture: 'veil', u: -0.65, v: 0.55, distance: 4200, width: 1.5,
    roll: 42, mirror: true, tilt: [-15, 8], opacity: 0.16, exposure: 0.5, fade: [450, 1500], priority: 2,
  },
  {
    id: 'yan-gaz', texture: 'veil', u: 0.95, v: 0.25, distance: 2700, width: 1.15,
    roll: 110, mirror: false, tilt: [-5, 20], opacity: 0.12, exposure: 0.45, fade: [350, 1200], priority: 3,
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

/** Local moving gas stays restrained throughout every route. */
export function proceduralDim(cameraZ: number) {
  const t = Math.min(1, Math.max(0, (-350 - cameraZ) / 750));
  return 0.055 + 0.065 * t * t * (3 - 2 * t);
}
