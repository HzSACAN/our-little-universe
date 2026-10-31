import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { baseFov, buildFlightCurve, closestApproach, flightDuration, poseFor, stars, type Layout } from './world';
import { starOrder } from '../content/memories';
import type { Destination } from './state';

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

describe('genel görünüm kadrajı', () => {
  // Ekran oranları: 4:3, 16:10, 21:9 masaüstü; 844×390 yatay telefon; 360×740 ve 430×932 portre.
  const views: [Layout, number][] = [['wide', 4 / 3], ['wide', 1.6], ['wide', 2.3], ['wide', 844 / 390], ['portrait', 360 / 740], ['portrait', 430 / 932]];
  const project = (layout: Layout, aspect: number) => {
    const pose = poseFor('home', layout);
    const camera = new PerspectiveCamera(baseFov(layout), aspect, 0.5, 9000);
    camera.position.copy(pose.position);
    camera.lookAt(pose.target);
    camera.updateMatrixWorld();
    return starOrder.map((id) => stars[id].position.clone().project(camera));
  };
  const side = (p: Vector3, q: Vector3, r: Vector3) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
  const crosses = (a: Vector3, b: Vector3, c: Vector3, d: Vector3) => side(a, b, c) !== side(a, b, d) && side(c, d, a) !== side(c, d, b);

  for (const [layout, aspect] of views) {
    it(`${layout} ${aspect.toFixed(2)}: altı yıldız ekranda ve takımyıldız kendini kesmiyor`, () => {
      const pts = project(layout, aspect);
      for (const p of pts) {
        expect(Math.abs(p.x)).toBeLessThan(0.9);
        expect(Math.abs(p.y)).toBeLessThan(0.9);
        expect(p.z).toBeLessThan(1);
      }
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        for (let j = i + 2; j < n; j++) {
          if (i === 0 && j === n - 1) continue; // kapanış kenarı ilk kenarla uç paylaşır
          expect(crosses(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])).toBe(false);
        }
      }
    });
  }
});
