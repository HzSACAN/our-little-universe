// Açılış sahnesi pilotu: açılış, sürükleyerek bakınma (sol/sağ), ilk yıldıza uçuş ve eve
// dönüş. Her adımda ekran görüntüsü, frame süresi ve çizim/kaynak sayıları; doku yükleme
// hatası, konsol hatası ve eve dönüşte kaynak artışı başarısızlıktır.
// Kullanım: BASE=http://localhost:4173 node scripts/pilot.mjs <etiket> [masaustu,telefon]
import { launch, BASE } from './cdp.mjs';
import { runChecks } from './check.mjs';

const tag = process.argv[2] ?? 'pilot';
const only = (process.argv[3] ?? 'masaustu,telefon').split(',');
const views = [
  { name: 'masaustu', w: 1920, h: 1080, mobile: false, dpr: 1, tier: 'high' },
  { name: 'telefon', w: 390, h: 844, mobile: true, dpr: 3, tier: 'medium' },
].filter((v) => only.includes(v.name));

const b = await launch();
await runChecks(async ({ ok, none, consoleClean }) => {
  await b.send('Network.enable');
  const requests = [];
  const failed = [];
  b.listen((m) => {
    if (m.method === 'Network.requestWillBeSent' && /assets\/nebula\//.test(m.params.request.url)) requests.push(m.params.request.url.split('/').pop());
    if (m.method === 'Network.loadingFailed') failed.push(m.params.errorText);
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400 && !/favicon/.test(m.params.response.url)) failed.push(`${m.params.response.status} ${m.params.response.url}`);
  });
  const rows = [];
  for (const v of views) {
    requests.length = 0;
    await b.viewport(v.w, v.h, v.mobile, v.dpr);
    await b.go(`${BASE}/?olcum&kademe=${v.tier}`);
    await b.wait(6000);
    const phase = () => b.eval(`document.querySelector('.app').className`);
    const idle = async () => { const t0 = Date.now(); while (Date.now() - t0 < 15000) { if (!(await phase()).includes('phase-travelling')) return; await b.wait(40); } throw new Error('uçuş bitmedi'); };
    const measure = async (label) => { const m = await b.eval('window.__olcum()'); rows.push({ view: v.name, label, ...m }); return m; };
    ok(`${v.name}: WebGL2 sahnesi`, (await b.eval(`document.querySelector('canvas')?.dataset.renderer`)) === 'webgl2');
    await b.eval('window.__olcum()');
    await b.wait(2000);
    const open = await measure('açılış');
    await b.shot(`${tag}-${v.name}-1-acilis`);
    const labels = await b.eval(`[...document.querySelectorAll('.world-label')].filter((e) => e.dataset.visible === 'true').length`);
    ok(`${v.name}: açılışta altı yıldız etiketi görünür`, labels === 6, String(labels));

    // Sürükleyerek bakınma: fare ya da tek parmak, sahnenin boş bir yerinden.
    const sx = Math.round(v.w * (v.mobile ? 0.5 : 0.72)), sy = Math.round(v.h * (v.mobile ? 0.12 : 0.5));
    const drag = async (dx, dy) => {
      if (v.mobile) {
        await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: sx, y: sy, id: 1 }] });
        for (let i = 1; i <= 10; i++) await b.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: sx + (dx * i) / 10, y: sy + (dy * i) / 10, id: 1 }] });
        await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      } else {
        await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: sx, y: sy, button: 'left', buttons: 1, clickCount: 1 });
        for (let i = 1; i <= 10; i++) await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: sx + (dx * i) / 10, y: sy + (dy * i) / 10, button: 'left', buttons: 1 });
        await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: sx + dx, y: sy + dy, button: 'left', buttons: 0, clickCount: 1 });
      }
      await b.wait(1400);
    };
    const goldAt = async () => b.eval(`(() => { const r = document.querySelector('.world-label--gold').getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; })()`);
    const g0 = await goldAt();
    await drag(-v.w * 0.22, v.h * 0.04);
    await b.shot(`${tag}-${v.name}-2-bakis-sol`);
    const g1 = await goldAt();
    await drag(v.w * 0.44, -v.h * 0.08);
    await b.shot(`${tag}-${v.name}-3-bakis-sag`);
    await measure('bakınma');
    ok(`${v.name}: sürükleme bakışı değiştirir (etiket projeksiyonla kayar)`, Math.abs(g1[0] - g0[0]) > 20, `${g0} → ${g1}`);
    ok(`${v.name}: sürükleme anı ya da dialog açmaz`, !(await b.eval(`!!document.querySelector('dialog[open]')`)));
    await drag(-v.w * 0.22, v.h * 0.04);

    // İlk yıldıza uçuş ve eve dönüş.
    await b.eval('window.__olcum()');
    await b.eval(`document.querySelector('.primary').click()`);
    await b.wait(1500);
    await b.shot(`${tag}-${v.name}-4-ucus-altin`);
    await idle();
    await measure('uçuş → altın');
    await b.wait(1200);
    await b.shot(`${tag}-${v.name}-5-altin`);
    ok(`${v.name}: ilk yıldıza varış`, (await phase()).includes('phase-arrived'));
    await b.eval('window.__olcum()');
    await b.eval(`document.querySelector('.journey-hud button').click()`);
    await b.wait(1500);
    await b.shot(`${tag}-${v.name}-6-donus`);
    await idle();
    const back = await measure('dönüş → genel');
    await b.wait(1800);
    await b.shot(`${tag}-${v.name}-7-genel`);
    ok(`${v.name}: eve dönüş genel görünümde biter`, (await phase()).includes('phase-overview'));
    ok(`${v.name}: dönüşte GPU kaynakları artmadı`, back.textures <= open.textures && back.geometries <= open.geometries + 1, `doku ${open.textures}→${back.textures}, geometri ${open.geometries}→${back.geometries}`);
    const dup = requests.filter((r, i) => requests.indexOf(r) !== i);
    none(`${v.name}: aynı doku birden çok kez indirilmedi`, dup, requests.join(', '));
  }
  none('ağ hatası yok', failed);
  for (const r of rows) console.log(`${r.view.padEnd(9)} ${r.label.padEnd(14)} kademe ${r.tier} dpr ${r.dpr} | p50 ${r.p50} p95 ${r.p95} | çağrı ${r.calls} üçgen ${r.triangles} geo ${r.geometries} doku ${r.textures} program ${r.programs}`);
  consoleClean(b.logs);
}, { close: () => b.close() });
