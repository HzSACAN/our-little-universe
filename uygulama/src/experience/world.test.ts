import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { buildFlightCurve, fovFor, closestApproach, flightDuration, poseFor, stars, type Layout } from './world';
import { starOrder } from '../content/memories';
import type { Destination } from './state';
import { constellationEdges } from './constellationGraph';
import type { StarId } from '../content/memories';

type P = { x: number; y: number };

const places: Destination[] = ['home', ...starOrder];
const layouts: Layout[] = ['wide', 'portrait'];

describe('uçuş geometrisi', () => {
  it('iki yıldız belirgin biçimde farklı derinlikte', () => {
    expect(Math.abs(stars.gold.position.z - stars.binary.position.z)).toBeGreaterThan(500);
  });

  for (const layout of layouts) {
    for (const from of places) {
      for (const to of places) {
        if (from === to) continue;
        it(`${layout}: ${from} → ${to} yolu hiçbir yıldızın korona alanına girmez`, () => {
          const a = poseFor(from, layout).position;
          const b = poseFor(to, layout).position;
          const curve = buildFlightCurve(a, b, to);
          for (const body of Object.values(stars)) {
            expect(closestApproach(curve, body, 400)).toBeGreaterThanOrEqual(body.clearance * 0.98);
          }
          expect(curve.getPoint(0).distanceTo(a)).toBeLessThan(1e-6);
          expect(curve.getPoint(1).distanceTo(b)).toBeLessThan(1e-6);
        });
      }
    }
  }

  it('normal uçuş süresi 3–5 saniye aralığında', () => {
    for (const layout of layouts) {
      for (const from of places) {
        for (const to of places) {
          if (from === to) continue;
          const d = flightDuration(poseFor(from, layout).position, poseFor(to, layout).position);
          expect(d).toBeGreaterThanOrEqual(3);
          expect(d).toBeLessThanOrEqual(5);
        }
      }
    }
  });

  it('varış noktası yıldızın dışında', () => {
    for (const layout of layouts) {
      for (const id of starOrder) {
        const d = poseFor(id, layout).position.distanceTo(stars[id].position);
        expect(d).toBeGreaterThan(stars[id].clearance);
      }
    }
  });

  it('başlangıç yanlış yerde olsa da (ör. yeniden hedefleme) yol güvenli kalır', () => {
    const start = stars.gold.position.clone().add(new Vector3(0, 0, stars.gold.clearance + 2));
    const curve = buildFlightCurve(start, poseFor('binary', 'wide').position, 'binary');
    expect(closestApproach(curve, stars.binary, 400)).toBeGreaterThanOrEqual(stars.binary.clearance * 0.98);
  });
});

describe('genel görünüm kadrajı: Y takımyıldızı', () => {
  // Ekran oranları: 4:3, 16:10, 21:9 masaüstü; 844×390 yatay telefon; 360×740 ve 430×932 portre.
  const views: [Layout, number][] = [['wide', 4 / 3], ['wide', 1.6], ['wide', 2.3], ['wide', 844 / 390], ['portrait', 360 / 740], ['portrait', 430 / 932]];
  const project = (layout: Layout, aspect: number) => {
    const pose = poseFor('home', layout);
    const camera = new PerspectiveCamera(fovFor('home', layout), aspect, 0.5, 9000);
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.updateMatrixWorld();
    // Ekran pikseline orantılı koordinat: x en-boy oranıyla ölçeklenir, açılar gerçek kalır.
    return Object.fromEntries(starOrder.map((id) => {
      const p = stars[id].position.clone().project(camera);
      return [id, { x: p.x * aspect, y: p.y, z: p.z, ndc: p }];
    })) as Record<StarId, { x: number; y: number; z: number; ndc: Vector3 }>;
  };
  const side = (p: P, q: P, r: P) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const crosses = (a: P, b: P, c: P, d: P) => side(a, b, c) !== side(a, b, d) && side(c, d, a) !== side(c, d, b);
  const angle = (from: P, to: P) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

  for (const [layout, aspect] of views) {
    it(`${layout} ${aspect.toFixed(2)}: altı yıldız ekranda ve okunabilir bir Y oluşturuyor`, () => {
      const pts = project(layout, aspect);
      for (const id of starOrder) {
        const p = pts[id].ndc;
        expect(Math.abs(p.x)).toBeLessThan(0.86);
        expect(Math.abs(p.y)).toBeLessThan(0.84);
        expect(p.z).toBeLessThan(1);
      }
      // Kenarlar birbirini kesmez (uç paylaşan kenarlar hariç).
      for (let i = 0; i < constellationEdges.length; i++) {
        for (let j = i + 1; j < constellationEdges.length; j++) {
          const [a, b] = constellationEdges[i];
          const [c, d] = constellationEdges[j];
          if (a === c || a === d || b === c || b === d) continue;
          expect(crosses(pts[a], pts[b], pts[c], pts[d])).toBe(false);
        }
      }
      const fork = pts.rose;
      // Gövde çataldan aşağı iner ve yaklaşık dikeydir.
      expect(pts.binary.y).toBeLessThan(fork.y);
      expect(pts.gold.y).toBeLessThan(pts.binary.y);
      expect(Math.abs(angle(fork, pts.gold) + 90)).toBeLessThan(14);
      // İki kol yukarı ve iki yana açılır; sol kolun ara yıldızı kolun üzerindedir.
      const left = angle(fork, pts.violet);
      const right = angle(fork, pts.dawn);
      expect(left).toBeGreaterThan(100);
      expect(left).toBeLessThan(150);
      expect(right).toBeGreaterThan(30);
      expect(right).toBeLessThan(80);
      expect(left - right).toBeGreaterThan(55);
      expect(left - right).toBeLessThan(110);
      expect(Math.abs(angle(fork, pts.azure) - left)).toBeLessThan(12);
      // Kollar ve gövde benzer boyda: harf dengesiz görünmez.
      const len = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);
      const stem = len(fork, pts.gold);
      for (const tip of [pts.violet, pts.dawn]) {
        expect(len(fork, tip) / stem).toBeGreaterThan(0.7);
        expect(len(fork, tip) / stem).toBeLessThan(1.4);
      }
      // Yıldızlar en az birkaç düzine piksel aralıklı (etiketler ve dokunma hedefleri için).
      const minGap = Math.min(...starOrder.flatMap((a, i) => starOrder.slice(i + 1).map((b) => len(pts[a], pts[b]))));
      expect(minGap).toBeGreaterThan(0.15); // 740 px yükseklikte ≈ 55 px: 44 px hedefler çakışmaz
      if (layout === 'wide') {
        // Masaüstünde metin solda: Y ekranın sağ yarısında durur.
        expect(Math.min(...starOrder.map((id) => pts[id].ndc.x))).toBeGreaterThan(-0.05);
      } else {
        // Telefonda metin altta, başlık üstte: Y ikisinin arasında durur.
        expect(Math.min(...starOrder.map((id) => pts[id].ndc.y))).toBeGreaterThan(-0.02);
        expect(Math.max(...starOrder.map((id) => pts[id].ndc.y))).toBeLessThan(0.72);
      }
    });
  }

  it('yıldızlar belirgin biçimde farklı derinliklerde', () => {
    const depths = starOrder.map((id) => stars[id].position.z).sort((a, b) => a - b);
    for (let i = 1; i < depths.length; i++) expect(depths[i] - depths[i - 1]).toBeGreaterThan(300);
  });
});
