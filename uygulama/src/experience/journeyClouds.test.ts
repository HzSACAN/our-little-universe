import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { journeyClouds } from './journeyClouds';
import { buildFlightCurve, poseFor, type Layout } from './world';
import { starOrder } from '../content/memories';
import type { Destination } from './state';

// Geometric regression: attractive cloud art is insufficient if every camera
// route remains in front of it. Check actual flight paths through finite volumes.
function crossedClouds(from: Destination, to: Destination, layout: Layout) {
  const curve = buildFlightCurve(poseFor(from, layout).position, poseFor(to, layout).position, to);
  const p = new Vector3();
  const entered = new Set<number>();
  for (let i = 0; i <= 200; i++) {
    curve.getPoint(i / 200, p);
    journeyClouds.forEach((cloud, index) => {
      const q = p.clone().sub(new Vector3(...cloud.center)).divide(new Vector3(...cloud.radius));
      if (q.lengthSq() < .8) entered.add(index);
    });
  }
  return entered.size;
}

describe('camera passes through nebula volumes', () => {
  it('cloud Z intervals do not overlap (early-exit renderer assumption)', () => {
    for (let i = 1; i < journeyClouds.length; i++) {
      const front = journeyClouds[i - 1], back = journeyClouds[i];
      expect(back.center[2] + back.radius[2]).toBeLessThan(front.center[2] - front.radius[2]);
    }
  });
  for (const layout of ['wide', 'portrait'] as const) {
    it(`${layout}: the deepest direct flight enters at least four clouds`, () => {
      expect(crossedClouds('home', 'dawn', layout)).toBeGreaterThanOrEqual(4);
      expect(crossedClouds('dawn', 'home', layout)).toBeGreaterThanOrEqual(4);
    });
    starOrder.forEach((to, index) => {
      const from = index === 0 ? 'home' : starOrder[index - 1];
      it(`${layout}: ${from} → ${to} enters a cloud`, () => {
        expect(crossedClouds(from, to, layout)).toBeGreaterThan(0);
      });
    });
  }
});
