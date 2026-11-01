import { CubicBezierCurve3, Vector3 } from 'three';
import type { StarId } from '../content/memories';
import type { Layout } from './layout';
import { yLayout } from './constellationGraph';
export { layoutFor, type Layout } from './layout';

// Dünya koordinatları sabittir. Ekran oranı değiştiğinde yıldızlar yer değiştirmez;
// yalnızca kameranın duruşu ve varış kadrajı uyarlanır.

export interface StarBody {
  id: StarId;
  position: Vector3;
  radius: number;
  /** Uçuş yolunun yıldıza yaklaşabileceği en kısa mesafe (korona ve eş yıldız dahil). */
  clearance: number;
}

/** Genel görünüm kamerasının göz noktası; Y takımyıldızı buradan okunur (constellationGraph.ts). */
export const HOME_EYE = new Vector3(0, 20, 420);

const radii: Record<StarId, [number, number]> = {
  // [yarıçap, uçuş yolunun yaklaşabileceği en kısa mesafe]
  gold: [14, 36],
  binary: [11, 40],
  rose: [13, 36],
  azure: [15, 40],
  violet: [13, 38],
  dawn: [17, 46],
};

function bodyFor(id: StarId): StarBody {
  const { u, v, distance } = yLayout[id];
  const [radius, clearance] = radii[id];
  return { id, position: new Vector3(u * distance, v * distance, -distance).add(HOME_EYE), radius, clearance };
}

// Konumlar, genel görünüm kamerasından bakınca Yağmur'un baş harfi Y'yi
// oluşturacak biçimde Y düzeninden türetilir. Her yıldız farklı derinliktedir;
// telefon kadrajı aynı göz noktasından, yalnız farklı yöne ve açıyla bakar.
export const stars = Object.fromEntries(
  (Object.keys(yLayout) as StarId[]).map((id) => [id, bodyFor(id)]),
) as Record<StarId, StarBody>;

/** Eş yıldızın ana yıldıza göre yörünge yarıçapı (ana yarıçap biriminde). */
export const COMPANION_ORBIT = 2.7;
export const COMPANION_RADIUS = 0.34;

export interface CameraPose {
  position: Vector3;
  target: Vector3;
}

export const baseFov = (layout: Layout) => (layout === 'portrait' ? 60 : 50);

/**
 * Bir duruştaki görüş açısı. Telefonun genel görünümü aynı göz noktasından biraz
 * daha geniş bakar: Y biçimi değişmeden başlık ile metin arasına sığar.
 */
export const fovFor = (target: StarId | 'home', layout: Layout) =>
  target === 'home' && layout === 'portrait' ? 75 : baseFov(layout);

export function homePose(layout: Layout): CameraPose {
  // Aynı göz noktası: Y biçimi iki düzende de aynı kalır. Masaüstünde metin
  // solda olduğundan bakış Y'nin soluna, telefonda metin altta olduğundan aşağı döner.
  return layout === 'portrait'
    ? { position: HOME_EYE.clone(), target: HOME_EYE.clone().add(new Vector3(0, -270, -1000)) }
    : { position: HOME_EYE.clone(), target: HOME_EYE.clone().add(new Vector3(-285, -12, -1000)) };
}

/**
 * Varış kadrajı. Masaüstünde yıldız sağda kalır ve metne solda yer açılır;
 * telefonda yıldız üst bölgeye yerleşir, panel ve gezinme alta iner.
 */
export function arrivalPose(id: StarId, layout: Layout): CameraPose {
  const s = stars[id];
  const r = s.radius;
  const p = s.position;
  const reach = id === 'binary' ? 1.25 : 1;
  if (layout === 'portrait') {
    // İkili yıldızda eş yıldızın yörüngesi de kadraja sığmalı: biraz daha geriden bakılır.
    const back = id === 'binary' ? 1.45 : 1;
    return {
      position: p.clone().add(new Vector3(0.6 * r, -0.9 * r, 8 * r * back)),
      target: p.clone().add(new Vector3(0.2 * r, -2.1 * r * back, 0)),
    };
  }
  return {
    position: p.clone().add(new Vector3(-2.1 * r * reach, 0.5 * r, 6.4 * r * reach)),
    target: p.clone().add(new Vector3(-1.75 * r * reach, 0.1 * r, 0)),
  };
}

export function poseFor(target: StarId | 'home', layout: Layout): CameraPose {
  return target === 'home' ? homePose(layout) : arrivalPose(target, layout);
}

/** En yakın mesafe: eğri üzerindeki örneklerle her yıldız merkezi arasında. */
export function closestApproach(curve: CubicBezierCurve3, body: StarBody, samples = 120) {
  let min = Infinity;
  const point = new Vector3();
  for (let i = 0; i <= samples; i++) {
    curve.getPoint(i / samples, point);
    min = Math.min(min, point.distanceTo(body.position));
  }
  return min;
}

/**
 * Üç boyutlu yolculuk eğrisi. Hedefe, varış noktasının yıldızdan dışarı bakan
 * yönünden yaklaşılır; böylece son metrelerde yıldız kadraja oturur.
 * Yol bir yıldızın korona/yörünge alanına girerse kontrol noktaları dışarı itilir.
 */
export function buildFlightCurve(from: Vector3, to: Vector3, destination: StarId | 'home'): CubicBezierCurve3 {
  const diff = to.clone().sub(from);
  const length = Math.max(diff.length(), 1);
  const lift = new Vector3(length * 0.03, Math.min(70, length * 0.06), 0);

  const c1 = from.clone().addScaledVector(diff, 0.3).add(lift);
  let approach: Vector3;
  if (destination === 'home') {
    approach = new Vector3(0.1, 0.12, 1).normalize();
  } else {
    approach = to.clone().sub(stars[destination].position).normalize();
  }
  const c2 = to.clone().addScaledVector(approach, Math.max(length * 0.28, 70)).add(new Vector3(0, length * 0.025, 0));

  const curve = new CubicBezierCurve3(from.clone(), c1, c2, to.clone());
  const bodies = Object.values(stars);
  const point = new Vector3();
  const nearest = new Vector3();
  for (let iteration = 0; iteration < 32; iteration++) {
    let adjusted = false;
    for (const body of bodies) {
      let min = Infinity, at = 0;
      for (let sample = 0; sample <= 320; sample++) {
        const t = sample / 320;
        curve.getPoint(t, point);
        const distance = point.distanceTo(body.position);
        if (distance < min) { min = distance; at = t; nearest.copy(point); }
      }
      const safe = body.clearance + 6;
      if (min >= safe) continue;
      // Bezier kontrol noktaları, en yakın noktayı dışarı itecek ağırlıklarla
      // güncellenir. Yalnız kontrol merkezini itmek başlangıç yıldızına geri dönebiliyordu.
      const w1 = 3 * (1 - at) ** 2 * at;
      const w2 = 3 * (1 - at) * at ** 2;
      const weight = w1 * w1 + w2 * w2;
      if (weight < 1e-6) continue; // Hedefler yıldızların dışında seçilir.
      const away = nearest.clone().sub(body.position);
      if (away.lengthSq() < 1e-6) away.crossVectors(diff, new Vector3(0, 1, 0));
      if (away.lengthSq() < 1e-6) away.set(1, 0, 0);
      away.normalize().multiplyScalar(safe - min + 2);
      curve.v1.addScaledVector(away, w1 / weight);
      curve.v2.addScaledVector(away, w2 / weight);
      adjusted = true;
    }
    if (!adjusted) break;
  }
  return curve;
}

/** Mesafeye göre uçuş süresi (sn): normal uçuş 3–5 sn aralığında kalır. */
export function flightDuration(from: Vector3, to: Vector3) {
  const distance = from.distanceTo(to);
  return Math.min(4.9, Math.max(3.1, 2.4 + distance * 0.0023));
}

/** Yumuşak hızlanma/frenleme (quintic smootherstep). */
export const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
