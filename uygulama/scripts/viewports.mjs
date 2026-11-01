// Üretim derlemesi: telefon, yatay telefon ve masaüstü görünümlerinde taşma, dokunma alanı,
// yıldız ipucu, yıldıza dokunma, anı geçişi ve Y genel görünümünde etiket çakışması.
// Her rapor alanı boş olmalıdır; aksi hâlde komut sıfırdan farklı kodla biter.
import { launch, BASE } from './cdp.mjs';
import { runChecks } from './check.mjs';
const b = await launch();
await runChecks(async ({ ok, none, consoleClean }) => {
  const check = () => b.eval(`(() => {
    const vw = innerWidth, vh = innerHeight;
    const shown = (e) => e.offsetParent !== null && getComputedStyle(e).visibility !== 'hidden' && !e.closest('dialog:not([open])');
    const els = [...document.querySelectorAll('button')].filter(e => shown(e) && !e.classList.contains('world-label') && e.dataset.visible !== 'false');
    const name = (e) => (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 24);
    const out = els.filter(e => !e.classList.contains('star-target')).filter(e => { const r = e.getBoundingClientRect(); return r.left < -1 || r.right > vw + 1 || r.top < -1 || r.bottom > vh + 1; }).map(name);
    const small = els.filter(e => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map(e => name(e) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
    const texts = [...document.querySelectorAll('h1, h2, p, .eyebrow')].filter(e => shown(e) && !e.classList.contains('star-hint')).filter(e => { const r = e.getBoundingClientRect(); return r.right > vw + 1 || r.left < -1; }).map(e => e.textContent.trim().slice(0, 20));
    const hit = (a, c) => a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
    const a = document.querySelector('.arrival-panel, .intro, .explore-caption, .completion-panel')?.getBoundingClientRect();
    const n = document.querySelector('.navigation')?.getBoundingClientRect();
    const panelNav = a && n && a.bottom > n.top + 1 ? ['panel/gezinme'] : [];
    // Görünür yıldız etiketleri birbiriyle ve metinle çakışmamalı.
    const labels = [...document.querySelectorAll('.world-label[data-visible=true] .world-name')].map(e => [e.closest('.world-label').className.match(/--(\\w+)/)[1], e.getBoundingClientRect()]);
    const blocks = [...document.querySelectorAll('.intro > *, .arrival-panel, .explore-caption, .completion-panel, .header > *')].filter(shown).map(e => e.getBoundingClientRect());
    const labelClash = [];
    labels.forEach(([id, r], i) => { labels.slice(i + 1).forEach(([id2, r2]) => hit(r, r2) && labelClash.push(id + '/' + id2)); if (blocks.some(bk => hit(r, bk))) labelClash.push(id + '/metin'); });
    // Yıldız ipucu: yerleştiyse görünür alanda, metinle ve yıldız yüzeyiyle çakışmasız.
    const h = document.querySelector('.star-hint[data-placed=true][data-show=true]');
    const hintIssues = [];
    if (h) {
      const r = h.getBoundingClientRect();
      if (r.left < 0 || r.right > vw || r.top < 0 || r.bottom > vh) hintIssues.push('ipucu taşıyor');
      if ([...blocks, n].filter(Boolean).some(bk => hit(r, bk))) hintIssues.push('ipucu metinle çakışıyor');
      const t = document.querySelector('.star-target').getBoundingClientRect();
      const cx = t.x + t.width / 2, cy = t.y + t.height / 2, rad = t.width / 2 / 1.08;
      if (Math.hypot(Math.max(r.left, Math.min(cx, r.right)) - cx, Math.max(r.top, Math.min(cy, r.bottom)) - cy) < rad) hintIssues.push('ipucu yüzeyi kapatıyor');
    }
    return { scrollW: document.documentElement.scrollWidth > vw ? [document.documentElement.scrollWidth] : [], out, small, texts, panelNav, labelClash, hintIssues, hint: !!h };
  })()`);
  const report = (tag, r) => {
    for (const key of ['scrollW', 'out', 'small', 'texts', 'panelNav', 'labelClash', 'hintIssues']) none(`${tag}: ${key}`, r[key]);
  };
  const idle = async () => { const t0 = Date.now(); while (Date.now() - t0 < 15000) { if (!(await b.eval(`document.querySelector('.app').className`)).includes('phase-travelling')) return; await b.wait(40); } throw new Error('uçuş bitmedi'); };
  const run = async (w, h, mobile, tag) => {
    await b.viewport(w, h, mobile, mobile ? 3 : 1);
    await b.go(`${BASE}/?olcum`);
    await b.wait(5000);
    report(`${tag} açılış`, await check());
    await b.shot(`v-${tag}-1-acilis`);
    await b.eval(`document.querySelector('.primary').click()`);
    await b.wait(300);
    await idle();
    await b.wait(1400);
    const arrived = await check();
    report(`${tag} varış`, arrived);
    ok(`${tag}: varışta ipucu yerleşti`, arrived.hint);
    await b.shot(`v-${tag}-2-altin-ipucu`);
    // Yıldıza dokunma ve anı geçişi (gerçek fare/dokunma girdisi).
    const t = await b.eval(`(() => { const r = document.querySelector('.star-target').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    if (mobile) {
      await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: t.x, y: t.y, id: 0 }] });
      await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: t.x, y: t.y, button: 'left', buttons: 1, clickCount: 1 });
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: t.x, y: t.y, button: 'left', buttons: 0, clickCount: 1 });
    }
    await b.wait(1100);
    ok(`${tag}: yıldıza dokununca anı açıldı`, await b.eval(`!!document.querySelector('dialog.memory-dialog[open]')`));
    const dialog = await b.eval(`(() => { const d = document.querySelector('dialog[open]').getBoundingClientRect(); return [d.left < 0 || d.right > innerWidth ? 'dialog yatay taşıyor' : null].filter(Boolean); })()`);
    none(`${tag}: anı kartı`, dialog);
    await b.shot(`v-${tag}-3-ani`);
    await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await b.wait(800);
    await b.eval('window.__olcum()');
    await b.eval(`document.querySelector('.next-destination').click()`);
    await b.wait(300);
    await idle();
    const m = await b.eval('window.__olcum()');
    await b.wait(1300);
    report(`${tag} ikili`, await check());
    await b.shot(`v-${tag}-4-ikili`);
    await b.eval(`document.querySelector('.journey-hud button').click()`);
    await b.wait(300);
    await idle();
    await b.wait(1600);
    report(`${tag} genel (Y)`, await check());
    await b.shot(`v-${tag}-5-genel-y`);
    console.log(tag, `uçuş p50 ${m.p50} p95 ${m.p95} p99 ${m.p99} uzun ${m.longFrames}/${m.frames} kademe ${m.tier} dpr ${m.dpr}`);
  };
  await run(360, 740, true, 'phone360');
  await run(430, 932, true, 'phone430');
  await run(844, 390, true, 'landscape844');
  await run(1440, 900, false, 'desk1440');
  await run(1920, 1080, false, 'desk1920');
  consoleClean(b.logs);
}, { close: () => b.close() });
