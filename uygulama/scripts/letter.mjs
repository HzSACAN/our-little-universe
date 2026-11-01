// Altı yıldız + mektup: kilit, tekrar ziyaret, anıdan mektuba geçiş, Escape/odak,
// klavye; WebGL kaybı ve yeniden deneme; WebGL yokken mektuba kadar okuma akışı.
import { launch, BASE } from './cdp.mjs';
import { runChecks } from './check.mjs';
const b = await launch();
await runChecks(async ({ ok, consoleClean }) => {
const press = async (key, code, kc, text) => {
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: kc, text });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: kc });
};
const st = () => b.eval(`({ cls: document.querySelector('.app')?.className ?? '', title: document.querySelector('.arrival-panel h2')?.textContent, count: document.querySelector('.journey-hud [role=status], .fallback-progress')?.textContent, dialogs: document.querySelectorAll('dialog[open]').length, letter: !!document.querySelector('dialog.letter-dialog[open]'), memory: !!document.querySelector('dialog.memory-dialog[open]'), focus: (document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent || '').trim().slice(0, 30), headerLetter: document.querySelector('.letter-trigger')?.disabled })`);
const idle = async () => { const t0 = Date.now(); while (Date.now() - t0 < 15000) { const s = await st(); if (!s.cls.includes('phase-travelling')) return s; await b.wait(40); } throw new Error('uçuş bitmedi'); };
const go = async (n) => { await b.eval(`document.querySelectorAll('.route-stops button')[${n - 1}].click()`); await b.wait(120); return idle(); };

await b.viewport(1440, 900);
await b.go(`${BASE}/`);
await b.wait(4500);
// Hızlı geçiş için hareket azaltma (kısa durağan geçiş); normal uçuşlar ayrıca tur betiğiyle ölçüldü.
await b.eval(`document.querySelector('.header .icon-button[aria-pressed]').click()`);
await b.eval(`document.querySelector('.primary').click()`); await b.wait(150); await idle();
let s;
for (const n of [5, 2, 6, 3]) s = await go(n);
ok('beş keşifte sayaç 5/6', s.count?.startsWith('5 /'), s.count);
ok('beş keşifte başlık mektup düğmesi kilitli', s.headerLetter === true);
await b.eval(`document.querySelector('.letter-trigger').click()`); await b.wait(300);
ok('kilitli mektup açılmıyor', !(await st()).letter);
s = await go(2);
ok('tekrar ziyaret sayacı artırmıyor', s.count?.startsWith('5 /'), s.count);
s = await go(4);
ok('altıncı farklı keşifte 6/6', s.count?.startsWith('6 /'), s.count);
ok('altıncıda mektup düğmesi açık', s.headerLetter === false);

// Anıdan mektuba geçiş: tek dialog, Escape, odak.
// Anı, yıldızın erişilebilir hedefinden açılır.
await b.wait(400); // hedef ilk karede konumlanır
await b.eval(`document.querySelector('.star-target').focus()`);
await press('Enter', 'Enter', 13, '\r'); await b.wait(900);
ok('anı dialogu açık', (await st()).memory);
const toLetter = await b.eval(`(() => { const btn = [...document.querySelectorAll('dialog.memory-dialog[open] button')].find(x => /mektu/i.test(x.textContent)); if (!btn) return null; btn.focus(); return btn.textContent.trim(); })()`);
ok('anı kartında mektup düğmesi', !!toLetter, toLetter ?? '');
await press('Enter', 'Enter', 13, '\r'); await b.wait(600);
s = await st();
ok('anıdan mektuba geçiş: tek açık dialog', s.letter && s.dialogs === 1, `açık dialog: ${s.dialogs}`);
ok('odak mektup içinde', await b.eval(`!!document.activeElement?.closest('dialog.letter-dialog')`));
await b.shot('m-mektup-desk');
await press('Escape', 'Escape', 27); await b.wait(400);
s = await st();
ok('Escape mektubu kapattı', s.dialogs === 0);
ok('odak sayfada anlamlı bir düğmede', s.focus.length > 0 && s.focus !== 'body', `odak: ${s.focus}`);

// Klavye: başlıktaki mektup düğmesi.
await b.eval(`document.querySelector('.letter-trigger').focus()`);
await press('Enter', 'Enter', 13, '\r'); await b.wait(500);
ok('klavyeyle başlıktan mektup', (await st()).letter);
await press('Escape', 'Escape', 27); await b.wait(400);
s = await st();
ok('Escape sonrası odak başlık mektup düğmesinde', /mektu/i.test(s.focus), s.focus);

// Genel görünüm ve tamamlanma paneli.
await b.eval(`document.querySelector('.journey-hud button').click()`); await b.wait(150); s = await idle();
ok('tamamlanınca genel görünüm paneli', await b.eval(`!!document.querySelector('.completion-panel')`));
await b.eval(`document.querySelector('.header .icon-button[aria-pressed]').click()`);

// WebGL bağlam kaybı: ziyaretler korunur, yedek okuma akışı görünür, yeniden deneme sahneyi kurar.
const lost = await b.eval(`(() => { const c = document.querySelector('canvas'); const gl = c?.getContext('webgl2'); const ext = gl?.getExtension('WEBGL_lose_context'); if (!ext) return false; ext.loseContext(); window.__ext = ext; return true; })()`);
await b.wait(800);
s = await st();
ok('bağlam kaybında yedek görünüm', lost && (await b.eval(`!!document.querySelector('.fallback')`)), String(lost));
ok('bağlam kaybında ziyaretler korunuyor', s.count?.startsWith('6 /'), s.count);
await b.eval(`window.__ext.restoreContext()`);
const retried = await b.eval(`(() => { const btn = [...document.querySelectorAll('.fallback button')].find(x => /yeniden/i.test(x.textContent)); btn?.click(); return !!btn; })()`);
await b.wait(4000);
ok('yeniden dene ile WebGL2 sahnesi geri geldi', retried && (await b.eval(`document.querySelector('canvas')?.dataset.renderer === 'webgl2' && !document.querySelector('.fallback')`)));
ok('yeniden denemeden sonra 6/6 korunuyor', (await st()).count?.startsWith('6 /'), (await st()).count);

// WebGL yok: altı anıyı okuyarak mektuba ulaşma.
const script = await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/.test(t) ? null : g.call(this, t, ...a); };` });
await b.go(`${BASE}/`); await b.wait(2500);
ok('WebGL yokken yedek ve 0/6', (await st()).count?.startsWith('0 /'), (await st()).count);
const order = [3, 6, 1, 5, 2];
for (const n of order) await b.eval(`document.querySelectorAll('.fallback-list article button')[${n - 1}].click()`);
await b.wait(200);
s = await st();
ok('yedekte beş keşif 5/6, mektup kilitli', s.count?.startsWith('5 /') && (await b.eval(`document.querySelector('.fallback-ending .primary').disabled`)), s.count);
await b.eval(`document.querySelectorAll('.fallback-list article button')[2].click()`);
ok('yedekte aynı anı tekrar sayılmıyor', (await st()).count?.startsWith('5 /'));
await b.eval(`document.querySelectorAll('.fallback-list article button')[3].click()`); await b.wait(200);
ok('yedekte altıncı keşifte mektup açılabilir', !(await b.eval(`document.querySelector('.fallback-ending .primary').disabled`)));
await b.eval(`document.querySelector('.fallback-ending .primary').focus()`);
await press('Enter', 'Enter', 13, '\r'); await b.wait(500);
ok('yedekte mektup açıldı', (await st()).letter);
await b.shot('m-mektup-yedek');
await press('Escape', 'Escape', 27); await b.wait(400);
s = await st();
ok('yedekte Escape ve odak mektup düğmesine döndü', !s.letter && /mektup/i.test(s.focus), s.focus);
await b.shot('m-yedek-tamam');
await b.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: script.identifier });
consoleClean(b.logs);
}, { close: () => b.close() });
