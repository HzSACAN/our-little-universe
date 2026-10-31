import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { buildFlightCurve, closestApproach, flightDuration, poseFor, stars, type Layout } from './world';
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
