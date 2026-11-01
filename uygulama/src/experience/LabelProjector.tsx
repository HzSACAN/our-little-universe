import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { starOrder } from '../content/memories';
import { stars } from './world';
import type { SceneBridge } from './bridge';

const projected = new Vector3();
type Rect = [number, number, number, number];
const overlaps = (a: Rect, b: Rect) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const activeProjected = new Vector3();
const companionProjected = new Vector3();
const hintSize = new WeakMap<HTMLElement, { w: number; h: number; at: number }>();
// Etiket boyutları her frame ölçülmez (zorunlu yerleşim hesabını önler); arada bir yenilenir.
const labelSize = new WeakMap<HTMLElement, { w: number; h: number; at: number }>();
let frameCount = 0;
let obstacles: Rect[] = [];
// Başlık araçları ve alt gezinme de etiketlerin yerleşebileceği alanı kısıtlar.
function measureObstacles() {
  obstacles = [...document.querySelectorAll<HTMLElement>('.header > *, .nav-row, .journey-hud, .navigation .route-stops, .arrival-panel, .completion-panel, .intro > *, .explore-caption')]
    .map((e) => e.getBoundingClientRect())
    .filter((r) => r.width > 0)
    .map((r) => [r.left - 6, r.top - 6, r.right + 6, r.bottom + 6] as Rect);
}

/**
 * Yıldız etiketlerini gerçek projeksiyondan konumlandırır. Ekran dışında,
 * kameranın arkasında ya da öndeki parlak yıldızın arkasında kalan etiketler gizlenir.
 * Bir etiket öncekilerle (veya başka bir yıldızın halkasıyla) çakışırsa yıldızın
 * üstüne geçer. DOM'a doğrudan yazar; React state güncellenmez.
 */
export function LabelProjector({ bridge }: { bridge: SceneBridge }) {
  const size = useThree((s) => s.size);
  useFrame(({ camera }) => {
    frameCount++;
    if (frameCount % 45 === 1) measureObstacles();
    const cam = camera as PerspectiveCamera;
    const focal = size.height / (2 * Math.tan(MathUtils.degToRad(cam.fov / 2)));
    let active: { x: number; y: number; r: number; d: number } | null = null;
    if (bridge.current) {
      const body = stars[bridge.current];
      activeProjected.copy(body.position).project(cam);
      const d = cam.position.distanceTo(body.position);
      active = {
        x: (activeProjected.x * 0.5 + 0.5) * size.width,
        y: (-activeProjected.y * 0.5 + 0.5) * size.height,
        r: (body.radius * 3 * focal) / d,
        d,
      };
    }
    placeStarTarget(bridge, cam, focal, size.width, size.height);
    const placed: Rect[] = [];
    const rings: Rect[] = [];
    const pending: { el: HTMLElement; x: number; y: number; ring: number }[] = [];
    for (const id of starOrder) {
      const el = bridge.labels[id];
      if (!el) continue;
      const body = stars[id];
      projected.copy(body.position).project(cam);
      const x = (projected.x * 0.5 + 0.5) * size.width;
      const y = (-projected.y * 0.5 + 0.5) * size.height;
      const d = cam.position.distanceTo(body.position);
      const ringRadius = Math.max(22, Math.min(80, (body.radius * 1.6 * focal) / d));
      let visible =
        !bridge.flying &&
        id !== bridge.current &&
        projected.z > -1 &&
        projected.z < 1 &&
        x > 24 &&
        x < size.width - 24 &&
        y > 70 &&
        y < size.height - 70;
      if (visible && active && d > active.d && Math.hypot(x - active.x, y - active.y) < active.r + 40) visible = false;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.setProperty('--ring', `${ringRadius.toFixed(1)}px`);
      if (visible) {
        rings.push([x - ringRadius, y - ringRadius, x + ringRadius, y + ringRadius]);
        pending.push({ el, x, y, ring: ringRadius });
      }
      if (el.dataset.visible !== String(visible)) {
        el.dataset.visible = String(visible);
        el.tabIndex = visible ? 0 : -1;
        el.setAttribute('aria-hidden', String(!visible));
      }
    }
    for (const { el, x, y, ring } of pending) {
      let measured = labelSize.get(el);
      if (!measured || frameCount - measured.at > 45) {
        const name = el.querySelector<HTMLElement>('.world-name');
        measured = { w: name?.offsetWidth ?? 100, h: name?.offsetHeight ?? 26, at: frameCount };
        labelSize.set(el, measured);
      }
      const w = measured.w / 2 + 4;
      const h = measured.h + 6;
      const own: Rect = [x - ring, y - ring, x + ring, y + ring];
      const options: [string, Rect][] = [
        ['bottom', [x - w, y + ring, x + w, y + ring + h]],
        ['top', [x - w, y - ring - h, x + w, y - ring]],
        ['right', [x + ring, y - h / 2, x + ring + w * 2, y + h / 2]],
        ['left', [x - ring - w * 2, y - h / 2, x - ring, y + h / 2]],
      ];
      const clash = (r: Rect) =>
        r[0] < 8 || r[2] > size.width - 8 || r[1] < 8 || r[3] > size.height - 8 ||
        placed.some((p) => overlaps(p, r)) || obstacles.some((o) => overlaps(o, r)) ||
        rings.some((q) => q[0] !== own[0] && overlaps(q, r));
      const [side, rect] = options.find(([, r]) => !clash(r)) ?? options[0];
      placed.push(rect);
      if (el.dataset.side !== side) el.dataset.side = side;
    }
  });
  return null;
}

/**
 * Bulunulan yıldızın erişilebilir dokunma hedefini yıldızın ekrandaki diskine
 * oturtur (en az 44 px). İkili yıldızda eş yıldız için ikinci bir dokunma alanı
 * konumlanır. İpucu, yüzeyi ve metni kapatmayacak bir yana yerleşir.
 */
function placeStarTarget(bridge: SceneBridge, cam: PerspectiveCamera, focal: number, width: number, height: number) {
  const target = bridge.starTarget;
  if (!target) return;
  let visible = false;
  let x = 0, y = 0, surface = 0;
  if (bridge.current && !bridge.flying) {
    const body = stars[bridge.current];
    activeProjected.copy(body.position).project(cam);
    const d = cam.position.distanceTo(body.position);
    x = (activeProjected.x * 0.5 + 0.5) * width;
    y = (-activeProjected.y * 0.5 + 0.5) * height;
    surface = (body.radius * focal) / d;
    visible = activeProjected.z < 1 && x > -surface && x < width + surface && y > -surface && y < height + surface;
  }
  if (target.dataset.visible !== String(visible)) target.dataset.visible = String(visible);
  if (!visible) {
    if (bridge.starHint) bridge.starHint.dataset.placed = 'false';
    return;
  }
  target.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  target.style.setProperty('--r', `${Math.max(22, surface * 1.08).toFixed(1)}px`);
  if (bridge.current === 'binary') {
    const c = bridge.companion;
    const cd = Math.max(1, cam.position.distanceTo(companionProjected.set(c.x, c.y, c.z)));
    companionProjected.project(cam);
    const cx = (companionProjected.x * 0.5 + 0.5) * width - x;
    const cy = (-companionProjected.y * 0.5 + 0.5) * height - y;
    target.style.setProperty('--cx', `${cx.toFixed(1)}px`);
    target.style.setProperty('--cy', `${cy.toFixed(1)}px`);
    target.style.setProperty('--cr', `${Math.max(22, ((c.r * focal) / cd) * 1.8).toFixed(1)}px`);
  }

  const hint = bridge.starHint;
  if (!hint) return;
  let measured = hintSize.get(hint);
  if (!measured || frameCount - measured.at > 45) {
    measured = { w: hint.offsetWidth || 220, h: hint.offsetHeight || 40, at: frameCount };
    hintSize.set(hint, measured);
  }
  const { w, h } = measured;
  // Korona iç halkasının dışında, yüzeye değmeden.
  const gap = Math.max(26, surface * 0.55);
  const R = surface + gap;
  const options: [string, Rect][] = [
    ['bottom', [x - w / 2, y + R, x + w / 2, y + R + h]],
    ['top', [x - w / 2, y - R - h, x + w / 2, y - R]],
    ['left', [x - R - w, y - h / 2, x - R, y + h / 2]],
    ['right', [x + R, y - h / 2, x + R + w, y + h / 2]],
  ];
  const fits = (r: Rect) => r[0] >= 12 && r[2] <= width - 12 && r[1] >= 12 && r[3] <= height - 12 && !obstacles.some((o) => overlaps(o, r));
  const found = options.find(([, r]) => fits(r));
  hint.dataset.placed = String(!!found);
  if (!found) return;
  const [side, rect] = found;
  hint.style.transform = `translate3d(${rect[0].toFixed(1)}px, ${rect[1].toFixed(1)}px, 0)`;
  if (hint.dataset.side !== side) hint.dataset.side = side;
}
