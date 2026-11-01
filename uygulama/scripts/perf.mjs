// Sabit kalite kademesinde uçuş sırasında frame süreleri. Kullanım:
// BASE=http://localhost:4173 node scripts/perf.mjs <genişlik> <yükseklik> <d|m> <kademe> [kapat=nebula,post]
// Eski sürümde \`kademe\` parametresi yoktur; orada kalite yöneticisinin seçtiği kademe raporlanır.
import { launch, BASE } from './cdp.mjs';
import { runChecks } from './check.mjs';
const [w = '1440', h = '900', mode = 'd', tier = 'high', off = ''] = process.argv.slice(2);
const mobile = mode === 'm';
const b = await launch();
await runChecks(async ({ ok }) => {
  await b.viewport(Number(w), Number(h), mobile, mobile ? 3 : 1);
  await b.go(`${BASE}/?olcum&kademe=${tier}${off ? `&kapat=${off}` : ''}`);
  await b.wait(5500);
  const idle = async () => { const t0 = Date.now(); while (Date.now() - t0 < 15000) { if (!(await b.eval(`document.querySelector('.app').className`)).includes('phase-travelling')) return; await b.wait(40); } throw new Error('uçuş bitmedi'); };
  const rows = [];
  await b.eval('window.__olcum()');
  await b.wait(2000);
  rows.push(['durağan açılış', await b.eval('window.__olcum()')]);
  for (const [label, js] of [
    ['uçuş → altın', `document.querySelector('.primary').click()`],
    ['uçuş → ikili', `document.querySelectorAll('.route-stops button')[1].click()`],
    ['uçuş → şafak', `document.querySelectorAll('.route-stops button')[5].click()`],
    ['uçuş → genel', `document.querySelector('.journey-hud button').click()`],
  ]) {
    await b.eval('window.__olcum()');
    await b.eval(js);
    await b.wait(200);
    await idle();
    rows.push([label, await b.eval('window.__olcum()')]);
  }
  for (const [label, m] of rows) console.log(`${w}x${h} ${label.padEnd(15)} kademe ${m.tier} dpr ${m.dpr} | p50 ${m.p50} p95 ${m.p95} p99 ${m.p99} | uzun ${m.longFrames}/${m.frames} | calls ${m.calls} geo ${m.geometries} tex ${m.textures} prog ${m.programs}`);
  ok('WebGL2', (await b.eval(`document.querySelector('canvas')?.dataset.renderer`)) === 'webgl2');
}, { close: () => b.close() });
