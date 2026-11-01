// Yıldıza dokunarak anı açma: gerçek fare ve dokunma girdisiyle. Uzak yıldıza dokunma
// yolculuk başlatır; varıştan sonra yıldıza dokunma anıyı açar. Sürükleme, çoklu dokunma,
// touchcancel ve varıştan önce başlayan basış anı açmaz. İkili yıldızın eşi de aynı anıyı açar.
import { launch, BASE } from './cdp.mjs';
import { runChecks } from './check.mjs';

const b = await launch();
await runChecks(async ({ ok, consoleClean }) => {
  const st = () => b.eval(`({ cls: document.querySelector('.app').className, title: document.querySelector('.arrival-panel h2')?.textContent, dialogs: document.querySelectorAll('dialog[open]').length, memory: !!document.querySelector('dialog.memory-dialog[open]'), focus: document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent?.trim().slice(0, 30) })`);
  const idle = async () => { const t0 = Date.now(); while (Date.now() - t0 < 15000) { const s = await st(); if (!s.cls.includes('phase-travelling')) return s; await b.wait(40); } throw new Error('uçuş bitmedi'); };
  const target = () => b.eval(`(() => { const t = document.querySelector('.star-target'); if (!t || t.dataset.visible !== 'true') return null; const r = t.getBoundingClientRect(); const c = t.querySelector('.star-target-companion')?.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height, companion: c && { x: c.x + c.width / 2, y: c.y + c.height / 2, w: c.width } }; })()`);
  const mouse = (type, x, y) => b.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseMoved' ? 1 : type === 'mousePressed' ? 1 : 0, clickCount: 1 });
  const click = async (x, y) => { await mouse('mousePressed', x, y); await mouse('mouseReleased', x, y); };
  const touch = (type, points) => b.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });
  const key = async (k, code, kc, text) => { await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: kc, text }); await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: kc }); };
  const closeMemory = async () => { await key('Escape', 'Escape', 27); await b.wait(700); };
  const labelCenter = (id) => b.eval(`(() => { const e = document.querySelector('.world-label--${id}'); if (e?.dataset.visible !== 'true') return null; const r = e.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);

  // --- Masaüstü, fare ---
  await b.viewport(1440, 900);
  await b.go(`${BASE}/`);
  await b.wait(5000);
  const gold = await labelCenter('gold');
  ok('açılışta altın yıldızın hedefi görünür', !!gold);
  await click(gold.x, gold.y);
  await b.wait(150);
  ok('uzak yıldıza dokunmak yolculuk başlatır', (await st()).cls.includes('phase-travelling'));
  ok('uçuş sırasında yıldız hedefi yok (etkileşim kilidi)', (await target()) === null);
  let s = await idle();
  await b.wait(1200);
  ok('varışta anı kendiliğinden açılmaz', !s.memory && (await st()).dialogs === 0);
  const hint = await b.eval(`(() => { const h = document.querySelector('.star-hint'); return { show: h?.dataset.show, placed: h?.dataset.placed, opacity: getComputedStyle(h).opacity, text: h?.textContent.trim() }; })()`);
  ok('varışta yıldızın yanında kısa ipucu', hint.show === 'true' && hint.placed === 'true' && Number(hint.opacity) > 0.9, hint.text);
  const t = await target();
  ok('yıldız hedefi en az 44 px', t && t.w >= 44 && t.h >= 44, t && `${Math.round(t.w)}px`);
  const hintBox = await b.eval(`(() => { const h = document.querySelector('.star-hint').getBoundingClientRect(); const t = document.querySelector('.star-target').getBoundingClientRect(); const p = document.querySelector('.arrival-panel').getBoundingClientRect(); const cx = t.x + t.width / 2, cy = t.y + t.height / 2, r = t.width / 2 / 1.08; const nearX = Math.max(h.left, Math.min(cx, h.right)), nearY = Math.max(h.top, Math.min(cy, h.bottom)); const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom; return { surface: Math.hypot(nearX - cx, nearY - cy) > r, panel: !hit(h, p) }; })()`);
  ok('ipucu yıldız yüzeyini kapatmaz', hintBox.surface);
  ok('ipucu metin paneliyle çakışmaz', hintBox.panel);

  // Sürükleme anı açmaz (ve bakınmayı yıldızın üzerinden de başlatır).
  await mouse('mousePressed', t.x, t.y);
  for (let i = 1; i <= 8; i++) await mouse('mouseMoved', t.x + i * 9, t.y + i * 3);
  await mouse('mouseReleased', t.x + 72, t.y + 24);
  await b.wait(800);
  ok('yıldızda başlayan sürükleme anı açmaz', (await st()).dialogs === 0);
  await b.wait(1200);

  // Hover halkası
  const t2 = await target();
  await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: t2.x, y: t2.y, buttons: 0 });
  await b.wait(400);
  ok('hover yıldızın etkileşimli olduğunu belli eder', await b.eval(`document.querySelector('.star-target').matches(':hover') && getComputedStyle(document.querySelector('.star-target-ring')).borderTopColor !== 'rgba(244, 240, 232, 0)'`));

  // Dokunma: anı açılır; hızlı ikinci dokunma ikinci bir geçiş/dialog oluşturmaz.
  await click(t2.x, t2.y);
  await b.wait(90);
  await click(t2.x, t2.y);
  await b.wait(150);
  s = await st();
  ok('açılış başlarken arka plan geri çekiliyor', s.cls.includes('memory-open'));
  await b.wait(900);
  s = await st();
  ok('yıldıza dokunmak anıyı açar (tek dialog)', s.memory && s.dialogs === 1, `dialog: ${s.dialogs}`);
  ok('anı kartı yıldızdan doğar', await b.eval(`document.querySelector('dialog.memory-dialog').classList.contains('from-star')`));
  await b.shot('s-ani-acik');
  // ✕ ile kapanış: kart yıldıza döner, odak yıldız hedefine.
  await b.eval(`document.querySelector('dialog.memory-dialog .close').click()`);
  await b.wait(120);
  ok('kapanış animasyonu oynuyor', await b.eval(`document.querySelector('dialog.memory-dialog').classList.contains('closing')`));
  await b.wait(700);
  s = await st();
  ok('kapanınca dialog kalmaz, aynı yıldızda', s.dialogs === 0 && s.cls.includes('phase-arrived') && s.title === 'Başladığımız yer');
  ok('kapanınca odak yıldızın erişilebilir hedefinde', /^Anıyı aç/.test(s.focus ?? ''), s.focus);
  ok('anı açıldıktan sonra ipucu tekrarlanmaz', (await b.eval(`document.querySelector('.star-hint').dataset.show`)) === 'false');

  // Klavye: Space ve Enter yıldız hedefinden anıyı açar.
  await b.eval(`document.querySelector('.star-target').focus()`);
  await key(' ', 'Space', 32, ' ');
  await b.wait(900);
  ok('Space ile anı açılır', (await st()).memory);
  await closeMemory();
  ok('Escape sonrası odak yıldız hedefinde', /^Anıyı aç/.test((await st()).focus ?? ''));
  await key('Enter', 'Enter', 13, '\r');
  await b.wait(900);
  ok('Enter ile anı açılır', (await st()).memory);
  await closeMemory();

  // İkili yıldız: ana gövde ve eş yıldız aynı anıya erişir.
  await b.eval(`document.querySelectorAll('.route-stops button')[1].click()`);
  await b.wait(200);
  await idle();
  await b.wait(1300);
  let tb = await target();
  ok('ikili yıldızda eş yıldız için ikinci dokunma alanı (≥44 px)', !!tb?.companion && tb.companion.w >= 44, tb?.companion && `${Math.round(tb.companion.w)}px`);
  await click(tb.companion.x, tb.companion.y);
  await b.wait(1000);
  s = await st();
  ok('eş yıldıza dokunmak aynı anıyı açar', s.memory && (await b.eval(`document.querySelector('#memory-title')?.textContent`)) === 'İkimizin ışığı');
  await closeMemory();
  tb = await target();
  await click(tb.x, tb.y);
  await b.wait(1000);
  ok('ana gövdeye dokunmak da aynı anıyı açar', (await st()).memory && (await b.eval(`document.querySelector('#memory-title')?.textContent`)) === 'İkimizin ışığı');
  await closeMemory();

  // Varıştan önce başlayan basış: altına dönüş uçuşu sırasında basılı tutup varışta bırakmak anı açmaz.
  await b.eval(`document.querySelectorAll('.route-stops button')[0].click()`);
  await b.wait(1500);
  await mouse('mousePressed', t.x, t.y);
  await idle();
  await b.wait(400);
  await mouse('mouseReleased', t.x, t.y);
  await b.wait(900);
  ok('varıştan önce başlayan basış anı açmaz', (await st()).dialogs === 0);

  // Genel görünümde uzak yıldıza dokunma yolculuk başlatır.
  await b.eval(`document.querySelector('.journey-hud button').click()`);
  await b.wait(200);
  await idle();
  await b.wait(900);
  const rose = await labelCenter('rose');
  if (rose) {
    await click(rose.x, rose.y);
    await b.wait(150);
    ok('genel görünümde uzak yıldıza dokunma yolculuk başlatır', (await st()).cls.includes('phase-travelling'));
    s = await idle();
    ok('yolculuk dokunulan yıldıza varır', s.title === 'Bir kahkaha kadar yakın', s.title);
  } else ok('genel görünümde pembe yıldız etiketi görünür', false);

  // Hareket azaltma: sade solma.
  await b.eval(`document.querySelector('.icon-button[aria-pressed]').click()`);
  await b.wait(300);
  const tr = await target();
  await click(tr.x, tr.y);
  await b.wait(120);
  ok('hareket azaltmada anı hemen ve solarak açılır', await b.eval(`(() => { const d = document.querySelector('dialog.memory-dialog[open]'); return !!d && getComputedStyle(d).animationName === 'fade'; })()`));
  await closeMemory();
  await b.eval(`document.querySelector('.icon-button[aria-pressed]').click()`);

  // --- Telefon, dokunma ---
  await b.viewport(390, 844, true, 3);
  await b.go(`${BASE}/`);
  await b.wait(5000);
  await b.eval(`document.querySelector('.primary').click()`);
  await b.wait(200);
  await idle();
  await b.wait(1300);
  ok('telefonda dokunmatik ipucu metni', /Dokun\.$/.test(await b.eval(`document.querySelector('.star-hint').textContent.trim()`)));
  const p = await target();
  await touch('touchStart', [[p.x, p.y], [p.x + 80, p.y + 60]]);
  await touch('touchEnd', []);
  await b.wait(900);
  ok('iki parmakla dokunma anı açmaz', (await st()).dialogs === 0);
  await touch('touchStart', [[p.x, p.y]]);
  await touch('touchMove', [[p.x + 40, p.y + 30]]);
  await touch('touchEnd', []);
  await b.wait(900);
  ok('dokunarak sürükleme anı açmaz', (await st()).dialogs === 0);
  await touch('touchStart', [[p.x, p.y]]);
  await touch('touchCancel', []);
  await b.wait(900);
  ok('touchcancel anı açmaz', (await st()).dialogs === 0);
  await b.wait(800);
  const p2 = await target();
  await touch('touchStart', [[p2.x, p2.y]]);
  await touch('touchEnd', []);
  await b.wait(1100);
  ok('telefonda yıldıza dokunmak anıyı açar', (await st()).memory);
  await b.shot('s-telefon-ani');
  await closeMemory();
  ok('telefonda kapanınca odak yıldız hedefinde', /^Anıyı aç/.test((await st()).focus ?? ''));

  consoleClean(b.logs);
}, { close: () => b.close() });
