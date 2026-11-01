import { launch, BASE } from './cdp.mjs';
import { runChecks } from './check.mjs';
const b = await launch();
await runChecks(async ({ ok, none, consoleClean }) => {
const st = () => b.eval(`({ cls: document.querySelector('.app')?.className, title: document.querySelector('.arrival-panel h2')?.textContent, count: document.querySelector('.journey-hud span')?.textContent, dialog: !!document.querySelector('dialog[open]'), focus: (document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent ?? '').trim().slice(0,30), bar: document.querySelector('.flight-line i')?.style.transform })`);
const waitFor = async (pred, ms = 15000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const s = await st(); if (pred(s)) return { s, t: Date.now() - t0 }; await b.wait(40); } return { s: await st(), t: -1 }; };
const mouse = async (type, x, y, buttons = 1) => b.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseMoved' ? buttons : 1, clickCount: 1 });
const key = async (k, code, kc, text) => { await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: kc, text }); await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: kc }); };
const center = (sel) => b.eval(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);

await b.viewport(1440, 900);
await b.go(`${BASE}/`);
await b.wait(4500);

// 1) Hızlı tekrar tıklama: tek uçuş, hedef değişmez.
const p = await center('.primary');
for (let i = 0; i < 4; i++) { await mouse('mousePressed', p.x, p.y); await mouse('mouseReleased', p.x, p.y); }
await b.wait(400);
ok('uçuş sırasında gezinme kilitli', await b.eval(`[...document.querySelectorAll('.navigation button')].every(x => x.disabled)`));
await b.eval(`document.querySelectorAll('.route-stops button')[1].click()`);
let r = await waitFor(s => s.cls.includes('phase-arrived'));
ok('hızlı tıklamada tek hedef (altın)', r.s.title === 'Başladığımız yer', `${r.s.title} ${r.t}ms`);
ok('varışta keşif sayacı 1', r.s.count?.startsWith('1 /'), r.s.count);

// 2) Kanvas üzerinde sürükleme uçuş başlatmaz.
await mouse('mousePressed', 1000, 300);
for (let i = 1; i <= 10; i++) await mouse('mouseMoved', 1000 + i * 25, 300 + i * 8);
await mouse('mouseReleased', 1250, 380);
await b.wait(500);
ok('sürükle-bırak uçuş başlatmaz', (await st()).cls.includes('phase-arrived'));
const lbl = await b.eval(`(() => { const e = document.querySelector('.world-label[data-visible=true]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; })()`);
if (lbl) {
  await mouse('mousePressed', lbl.x, lbl.y);
  for (let i = 1; i <= 6; i++) await mouse('mouseMoved', lbl.x + i * 10, lbl.y, 1);
  await mouse('mouseReleased', lbl.x + 60, lbl.y);
  await b.wait(400);
  ok('etikette başlayan sürükleme uçuş başlatmaz', (await st()).cls.includes('phase-arrived'));
} else ok('görünür bir yıldız etiketi var', false);
await b.shot('i-after-drag');

// 3) Anı dialogu: aç, Escape ile kapat, odak geri gelir, kamera yerinde kalır.
await b.eval(`document.querySelector('.star-target').focus()`);
await key('Enter', 'Enter', 13, String.fromCharCode(13));
await b.wait(900);
ok('anı dialogu açıldı', (await st()).dialog);
await b.shot('i-dialog-desk');
await key('Escape', 'Escape', 27);
await b.wait(700);
r = { s: await st() };
ok('Escape ile kapandı, odak geri döndü', !r.s.dialog && r.s.focus?.startsWith('Anıyı aç'), r.s.focus);
ok('kapatınca aynı yıldızda', r.s.cls.includes('phase-arrived') && r.s.title === 'Başladığımız yer');

// 4) Uçuş ortasında ekran değişimi: yolculuk yeni kadraja yeniden hedeflenir.
await b.eval(`document.querySelector('.next-destination').click()`);
await b.wait(1300);
await b.viewport(390, 844, true, 2);
r = await waitFor(s => s.cls.includes('phase-arrived') && s.title === 'İkimizin ışığı');
ok('resize sonrası ikinci yıldıza varış', r.t >= 0, `${r.t}ms sonra`);
ok('ziyaretler korunuyor (2/2)', r.s.count?.startsWith('2 /'), r.s.count);
await b.wait(800); await b.shot('i-resize-phone-binary');
await b.eval(`document.querySelector('.star-target').click()`);
await b.wait(700); await b.shot('i-dialog-phone');
await key('Escape', 'Escape', 27); await b.wait(300);
await b.viewport(1440, 900); await b.wait(800); await b.shot('i-resize-back-desk');
ok('masaüstüne dönünce panel duruyor', (await st()).cls.includes('phase-arrived'));

// 5) Gizli sekme: uçuş süresi askıda kalır, dönüşte sıçrama yok.
await b.eval(`document.querySelector('.round-button').click()`);
await b.wait(1200);
const before = (await st()).bar;
const tab = await b.send('Target.createTarget', { url: 'about:blank' });
await b.wait(2500);
const hiddenNow = await b.eval('document.hidden');
const during = (await st()).bar;
await b.send('Target.closeTarget', { targetId: tab.targetId });
await b.send('Page.bringToFront');
await b.wait(150);
const after = (await st()).bar;
ok('arka planda sekme gizli', hiddenNow === true, String(hiddenNow));
const scale = (t) => Number(/scaleX\(([\d.]+)\)/.exec(t ?? '')?.[1] ?? NaN);
// Gizlenme anına kadar bir-iki kare ilerleyebilir; 2,5 sn boyunca ilerleme olmamalı.
ok('gizliyken uçuş ilerlemedi (≤%2)', scale(during) - scale(before) <= 0.02, `${before} → ${during} → ${after}`);
r = await waitFor(s => s.cls.includes('phase-arrived'));
ok('dönüşte uçuş tamamlandı', r.s.title === 'Başladığımız yer', `${r.t}ms`);

// 6) Hareket azaltma düğmesi: kısa, durağan geçiş.
await b.eval(`document.querySelector('.icon-button[aria-pressed]').click()`);
await b.eval(`document.querySelector('.next-destination').click()`);
r = await waitFor(s => s.cls.includes('phase-arrived') && s.title === 'Bir kahkaha kadar yakın');
ok('hareket azaltmada geçiş < 1.2 sn', r.t >= 0 && r.t < 1200, `${r.t}ms`);
ok('body.motion-reduced', await b.eval(`document.body.classList.contains('motion-reduced')`));
await b.eval(`document.querySelector('.icon-button[aria-pressed]').click()`);
ok('düğmeyle hareket geri açıldı', !(await b.eval(`document.body.classList.contains('motion-reduced')`)));

// 7) Liste dialogu ile gezinme ve genel görünüm.
await b.eval(`document.querySelector('.header .nav-link').click()`); await b.wait(400);
await b.eval(`document.querySelectorAll('.memory-list button')[0].click()`);
r = await waitFor(s => s.cls.includes('phase-arrived') && s.title === 'Başladığımız yer');
ok('listeden yıldıza yolculuk', r.t >= 0, `${r.t}ms`);
await b.eval(`document.querySelector('.journey-hud button').click()`);
r = await waitFor(s => s.cls.includes('phase-overview'));
ok('genel görünüme dönüş', r.t >= 0, `${r.t}ms`);
await b.wait(600); await b.shot('i-overview-desk');

// 8) Sistem hareket azaltma tercihi ilk açılışta.
await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await b.go(`${BASE}/`); await b.wait(3000);
ok('sistem tercihi ilk açılışta uygulanır', await b.eval(`document.body.classList.contains('motion-reduced') && document.querySelector('.icon-button[aria-pressed]').getAttribute('aria-pressed') === 'true'`));
await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
await b.wait(300);
ok('sistem tercihi değişince takip eder', !(await b.eval(`document.body.classList.contains('motion-reduced')`)));

// 9) WebGL yok: boş ekran yerine anı listesi.
const script = await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); };` });
await b.go(`${BASE}/`); await b.wait(2500);
ok('WebGL yokken yedek liste', await b.eval(`!!document.querySelector('.fallback') && document.querySelectorAll('.fallback-list article').length === 6 && !document.querySelector('canvas')`));
await b.shot('i-fallback-desk');
await b.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: script.identifier });

consoleClean(b.logs);
}, { close: () => b.close() });
