// Çakışan dialog istekleri: yıldıza dokunduktan hemen sonra (anı kartı 320 ms gecikmeyle
// açılmayı beklerken) liste, ana sayfa, başka bir yıldız, Escape ya da hızlı tekrarlı
// girişler gelirse her anda en fazla bir dialog açık kalmalı ve bekleyen anı açılışı iptal
// edilmeli. Hareket azaltıldığında da klavye, Escape ve odak dönüşü aynı kalmalı.
import { launch, BASE } from './cdp.mjs';
import { runChecks } from './check.mjs';

const b = await launch();
await runChecks(async ({ ok, consoleClean }) => {
  // Her karede açık dialog sayısını izler; kontrol, aradaki en büyük değeri de okur.
  const watch = () => b.eval(`(() => { window.__maxOpen = 0; const tick = () => { window.__maxOpen = Math.max(window.__maxOpen, document.querySelectorAll('dialog[open]').length); window.__raf = requestAnimationFrame(tick); }; cancelAnimationFrame(window.__raf); tick(); })()`);
  const st = () => b.eval(`({ cls: document.querySelector('.app').className, open: [...document.querySelectorAll('dialog[open]')].map((d) => d.className.split(' ')[0]), max: window.__maxOpen ?? 0, focus: document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent?.trim().slice(0, 30) })`);
  const idle = async () => { const t0 = Date.now(); while (Date.now() - t0 < 15000) { const s = await st(); if (!s.cls.includes('phase-travelling')) return s; await b.wait(40); } throw new Error('uçuş bitmedi'); };
  const key = async (k, code, kc, text) => { await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: kc, text }); await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: kc }); };
  const mouse = (type, x, y) => b.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mousePressed' ? 1 : 0, clickCount: 1 });
  const clickAt = async (sel) => {
    const p = await b.eval(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    await mouse('mouseMoved', p.x, p.y); await mouse('mousePressed', p.x, p.y); await mouse('mouseReleased', p.x, p.y);
  };
  const tapStar = async () => { await b.wait(400); await clickAt('.star-target'); };
  const fly = async (sel) => { await clickAt(sel); await b.wait(200); await idle(); await b.wait(900); };
  const settle = async () => { await b.wait(1100); return st(); };

  await b.viewport(1440, 900);
  await b.go(`${BASE}/`);
  await b.wait(5000);
  await watch();
  await fly('.intro .primary');

  // 1) Yıldız → hemen "Anılarımız": yalnız liste açık kalır, gecikmeli anı açılmaz.
  await tapStar();
  await b.wait(60);
  await clickAt('.header .nav-link');
  let s = await settle();
  ok('dokunuş + hemen liste: tek dialog, o da liste', s.open.length === 1 && s.open[0] === 'list-dialog', JSON.stringify(s.open));
  ok('dokunuş + hemen liste: hiçbir karede iki dialog yok', s.max <= 1, `en çok ${s.max}`);
  ok('liste açıkken arka plan anı açılışı için geri çekilmiyor', !s.cls.includes('memory-open'));
  await b.wait(800);
  ok('bekleyen anı zamanlayıcısı sonradan da açmıyor', (await st()).open.join() === 'list-dialog');
  await key('Escape', 'Escape', 27);
  await b.wait(700);
  s = await st();
  ok('Escape listeyi kapatır', s.open.length === 0, JSON.stringify(s.open));
  ok('liste kapanınca odak liste düğmesine döner', /^Anılarımız/.test(s.focus ?? ''), s.focus);

  // 2) Liste açıkken yıldız dokunuşu / klavye anı açmaz.
  await clickAt('.header .nav-link');
  await b.wait(500);
  await b.eval(`document.querySelector('.star-target')?.click()`);
  s = await settle();
  ok('liste açıkken yıldız hedefi anı açmaz', s.open.join() === 'list-dialog', JSON.stringify(s.open));
  await key('Escape', 'Escape', 27);
  await b.wait(700);

  // 3) Yıldız → hemen başka bir yıldıza yolculuk: anı açılmaz, uçuş başlar.
  await watch();
  await tapStar();
  await b.wait(60);
  await b.eval(`document.querySelectorAll('.route-stops button')[1].click()`);
  await b.wait(150);
  s = await st();
  ok('dokunuş + hemen yolculuk: uçuş başlar', s.cls.includes('phase-travelling'));
  await b.wait(600);
  s = await st();
  ok('dokunuş + hemen yolculuk: bekleyen anı açılmaz', s.open.length === 0 && s.max === 0, JSON.stringify(s));
  await idle();
  await b.wait(900);

  // 4) Yıldız → hemen ana sayfa (logo).
  await tapStar();
  await b.wait(60);
  await clickAt('.header .brand');
  s = await settle();
  ok('dokunuş + hemen genel görünüm: anı açılmaz', s.open.length === 0 && s.max === 0, JSON.stringify(s.open));
  await idle();
  await b.wait(600);
  await fly('.route-stops button:nth-child(1)');

  // 5) Yıldız → bekleme sırasında Escape: bekleyen açılış iptal edilir.
  await tapStar();
  await b.wait(60);
  await key('Escape', 'Escape', 27);
  s = await settle();
  ok('bekleme sırasında Escape anı açılışını iptal eder', s.open.length === 0 && !s.cls.includes('memory-open'), JSON.stringify(s.open));

  // 6) Hızlı tekrar: dokun, liste, kapat, dokun — sonunda yalnız anı açık ve tek.
  await watch();
  await tapStar();
  await clickAt('.header .nav-link');
  await b.wait(120);
  await key('Escape', 'Escape', 27);
  await b.wait(650);
  await tapStar();
  s = await settle();
  ok('hızlı giriş dizisi sonunda yalnız anı açık', s.open.join() === 'memory-dialog', JSON.stringify(s.open));
  ok('hızlı giriş dizisinde hiçbir karede iki dialog yok', s.max <= 1, `en çok ${s.max}`);
  await key('Escape', 'Escape', 27);
  await b.wait(800);
  s = await st();
  ok('anı Escape ile kapanır, odak yıldız hedefinde', s.open.length === 0 && /^Anıyı aç/.test(s.focus ?? ''), s.focus);

  // 7) Hareket azaltıldığında: klavyeyle anında açılır, Escape kapatır, odak geri döner.
  await clickAt('.header .icon-button[aria-pressed]');
  await b.wait(300);
  await b.eval(`document.querySelector('.star-target').focus()`);
  await key('Enter', 'Enter', 13, '\r');
  await b.wait(120);
  s = await st();
  ok('hareket azaltılmışken Enter anıyı gecikmesiz açar', s.open.join() === 'memory-dialog', JSON.stringify(s.open));
  await key('Escape', 'Escape', 27);
  await b.wait(300);
  s = await st();
  ok('hareket azaltılmışken Escape kapatır, odak yıldız hedefinde', s.open.length === 0 && /^Anıyı aç/.test(s.focus ?? ''), s.focus);
  await clickAt('.header .icon-button[aria-pressed]');
  await b.wait(300);

  consoleClean(b.logs);
}, { close: () => b.close() });
