// Üretim derlemesi: farklı telefon genişliklerinde taşma, dokunma alanı ve ölçüm.
import { launch, BASE } from './cdp.mjs';
const base = `${BASE}/?olcum`;
const b = await launch();
const check = async (tag) => b.eval(`(() => {
  const vw = innerWidth, vh = innerHeight;
  const sel = 'button:not([disabled]), .world-label[data-visible=true]';
  const els = [...document.querySelectorAll('button')].filter(e => e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden' && !e.closest('dialog:not([open])') && !e.classList.contains('world-label'));
  const out = els.filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1; }).map(e => e.textContent.trim().slice(0, 20));
  const small = els.filter(e => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map(e => e.textContent.trim().slice(0, 20) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
  const texts = [...document.querySelectorAll('h1, h2, p, .eyebrow')].filter(e => e.offsetParent !== null && !e.closest('dialog:not([open])')).filter(e => { const r = e.getBoundingClientRect(); return r.right > vw + 1 || r.left < -1; }).map(e => e.textContent.trim().slice(0, 20));
  // Panel ile gezinme çakışıyor mu?
  const a = document.querySelector('.arrival-panel, .intro, .explore-caption')?.getBoundingClientRect();
  const n = document.querySelector('.navigation')?.getBoundingClientRect();
  const overlap = a && n ? a.bottom > n.top + 1 : false;
  return { scrollW: document.documentElement.scrollWidth, vw, out, small, texts, overlap };
})()`);
const run = async (w, h, mobile, tag) => {
  await b.viewport(w, h, mobile, mobile ? 3 : 1);
  await b.go(base);
  await b.wait(4500);
  const r1 = await check(tag);
  await b.shot(`v-${tag}-intro`);
  await b.eval(`document.querySelector('.primary').click()`);
  await b.wait(5200);
  await b.eval('window.__olcum()');
  await b.eval(`document.querySelector('.next-destination').click()`);
  await b.wait(5200);
  const m = await b.eval('window.__olcum()');
  const r2 = await check(tag);
  await b.shot(`v-${tag}-binary`);
  console.log(tag, JSON.stringify({ intro: r1, arrived: r2 }), `uçuş p50 ${m.p50} p95 ${m.p95} p99 ${m.p99} uzun ${m.longFrames}/${m.frames} dpr ${m.dpr}`);
};
await run(360, 740, true, 'phone360');
await run(430, 932, true, 'phone430');
await run(844, 390, true, 'landscape844');
await run(1440, 900, false, 'desk1440');
await run(1920, 1080, false, 'desk1920');
console.log(b.logs.filter(l => !/DevTools|THREE.Clock/.test(l)).join('\n') || '(konsol temiz)');
await b.close();
