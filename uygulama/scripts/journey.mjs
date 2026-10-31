// Tam yolculuk: açılış → altın → ikili → geri → genel görünüm; ara kareler ve ölçüm.
import { launch, BASE } from './cdp.mjs';
const [w, h, mobile, tag] = [Number(process.argv[2] ?? 1440), Number(process.argv[3] ?? 900), process.argv[4] === 'm', process.argv[5] ?? 'desk'];
const b = await launch();
await b.viewport(w, h, mobile, mobile ? 2 : 1);
await b.go(`${BASE}/?olcum`);
await b.wait(5000);
await b.shot(`${tag}-1-intro`);
const phase = () => b.eval(`document.querySelector('.app').className`);
const waitArrive = async (label) => { const t0 = Date.now(); while (!(await phase()).includes('phase-arrived') && !(await phase()).includes('phase-overview')) { if (Date.now() - t0 > 15000) throw new Error('varış yok ' + label); await b.wait(50); } return Date.now() - t0; };
const click = (sel) => b.eval(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find(e => !e.disabled); el.click(); return el.textContent.trim(); })()`);
const fly = async (sel, name) => {
  await b.eval('window.__olcum()');
  await click(sel);
  await b.wait(1700); await b.shot(`${tag}-${name}-mid`);
  const ms = await waitArrive(name);
  const m = await b.eval('window.__olcum()');
  await b.wait(900); await b.shot(`${tag}-${name}-arrive`);
  console.log(name.padEnd(10), 'uçuş+', ms + 1700, 'ms', 'p50', m.p50, 'p95', m.p95, 'p99', m.p99, 'uzun', m.longFrames, '/', m.frames, 'geo', m.geometries, 'tex', m.textures, 'prog', m.programs);
};
await fly('.primary', '2-gold');
await fly('.next-destination', '3-binary');
await fly('.round-button', '4-back');
await fly('.journey-hud button', '5-home');
console.log(b.logs.filter(l => !/vite|DevTools|THREE.Clock/.test(l)).join('\n'));
await b.close();
