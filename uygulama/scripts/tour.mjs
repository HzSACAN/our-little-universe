// Altı yıldız turu: verilen sırayla her yıldıza uçar, varış ve genel görünüm
// ekranlarını alır, mektup kilidini ve frame sürelerini kaydeder.
// Kullanım: node scripts/tour.mjs <genişlik> <yükseklik> <d|m> <etiket> [sıra, ör. 3,1,6,2,5,4]
import { launch, BASE } from './cdp.mjs';
const [w, h, mode, tag = 'tur', orderArg = '1,2,3,4,5,6'] = process.argv.slice(2);
const order = orderArg.split(',').map(Number);
const mobile = mode === 'm';
const b = await launch();
await b.viewport(Number(w), Number(h), mobile, mobile ? 3 : 1);
await b.go(`${BASE}/?olcum`);
await b.wait(5000);
const scripts = await b.eval(`[...performance.getEntriesByType('resource')].map(e => e.name.split('/').pop()).filter(n => n.endsWith('.js'))`);
console.log('yüklenen JS:', scripts.join(', '), '| renderer:', await b.eval(`document.querySelector('canvas')?.dataset.renderer`));
await b.shot(`${tag}-0-acilis`);
const st = () => b.eval(`({ cls: document.querySelector('.app').className, title: document.querySelector('.arrival-panel h2')?.textContent, count: document.querySelector('.journey-hud [role=status]')?.textContent, letterBtn: document.querySelector('.next-destination span')?.textContent })`);
const waitIdle = async () => { const t0 = Date.now(); while (Date.now() - t0 < 15000) { const s = await st(); if (!s.cls.includes('phase-travelling')) return { s, t: Date.now() - t0 }; await b.wait(40); } throw new Error('uçuş bitmedi'); };
const letterAllowed = () => b.eval(`[...document.querySelectorAll("button")].filter(x => /mektu/i.test(x.textContent + (x.getAttribute("aria-label") || "")) && x.offsetParent && !x.disabled).map(x => x.textContent.trim().slice(0, 24)).join(" / ") || "yok"`);
let first = true;
for (const n of order) {
  await b.eval('window.__olcum()');
  if (first) { await b.eval(`document.querySelector('.primary').click()`); await b.wait(400); await waitIdle(); first = false; if (n === 1) { const s = await st(); console.log(`yıldız 1 ${s.title} ${s.count}`); await b.wait(900); await b.shot(`${tag}-yildiz-1`); continue; } }
  await b.eval(`document.querySelectorAll('.route-stops button')[${n - 1}].click()`);
  await b.wait(200);
  const { s, t } = await waitIdle();
  const m = await b.eval('window.__olcum()');
  await b.wait(900);
  await b.shot(`${tag}-yildiz-${n}`);
  console.log(`yıldız ${n} ${s.title} | ${s.count} | uçuş ${t + 200}ms | p50 ${m.p50} p95 ${m.p95} uzun ${m.longFrames}/${m.frames} | kademe ${m.tier} dpr ${m.dpr} | geo ${m.geometries} tex ${m.textures} prog ${m.programs} calls ${m.calls} | mektup açılabilir: ${await letterAllowed()}`);
}
await b.eval(`document.querySelector('.journey-hud button').click()`);
await b.wait(300); await waitIdle(); await b.wait(1600);
await b.shot(`${tag}-genel`);
const s = await st();
console.log('genel görünüm', s.cls, s.count, '| tamamlanma paneli:', await b.eval(`!!document.querySelector('.completion-panel')`));
const labels = await b.eval(`[...document.querySelectorAll('.world-label')].map(e => ({ id: e.className.match(/--(\\w+)/)[1], v: e.dataset.visible, r: (() => { const r = e.querySelector('.world-name').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; })() }))`);
const vis = labels.filter(l => l.v === 'true');
const overlaps = [];
for (let i = 0; i < vis.length; i++) for (let j = i + 1; j < vis.length; j++) { const a = vis[i].r, c = vis[j].r; if (a[0] < c[2] && c[0] < a[2] && a[1] < c[3] && c[1] < a[3]) overlaps.push(vis[i].id + '/' + vis[j].id); }
console.log('görünür etiketler', vis.map(l => l.id).join(','), '| çakışan:', overlaps.join(' ') || 'yok');
console.log(b.logs.filter(l => !/DevTools|THREE.Clock|vite/.test(l)).join('\n') || '(konsol temiz)');
await b.close();
