// Önce/sonra görsel karşılaştırma: aynı görünümlerde açılış, uçuş ortası, varış ve
// genel görünüm kareleri. Kullanım: BASE=http://localhost:4173 node scripts/compare.mjs <etiket>
// Eski ve yeni sürüm aynı betikle, aynı tarayıcı ve GPU ile çekilir.
import { launch, BASE } from './cdp.mjs';
import { runChecks } from './check.mjs';

const tag = process.argv[2] ?? 'sonra';
const b = await launch();
await runChecks(async ({ ok }) => {
  const views = [
    [1440, 900, false, 'masaustu'],
    [390, 844, true, 'telefon'],
  ];
  for (const [w, h, mobile, name] of views) {
    await b.viewport(w, h, mobile, mobile ? 3 : 1);
    await b.go(`${BASE}/?olcum${process.env.KADEME ? `&kademe=${process.env.KADEME}` : ""}`);
    await b.wait(5500);
    const phase = () => b.eval(`document.querySelector('.app').className`);
    const idle = async () => {
      const t0 = Date.now();
      while (Date.now() - t0 < 15000) {
        if (!(await phase()).includes('phase-travelling')) return;
        await b.wait(40);
      }
      throw new Error('uçuş bitmedi');
    };
    ok(`${name}: WebGL2 sahnesi`, (await b.eval(`document.querySelector('canvas')?.dataset.renderer`)) === 'webgl2');
    await b.shot(`${tag}-${name}-1-acilis`);
    await b.eval(`document.querySelector('.primary').click()`);
    await b.wait(1600);
    await b.shot(`${tag}-${name}-2-ucus-altin`);
    await idle();
    await b.wait(1200);
    await b.shot(`${tag}-${name}-3-altin`);
    await b.eval(`document.querySelectorAll('.route-stops button')[1].click()`);
    await b.wait(2000);
    await b.shot(`${tag}-${name}-4-ucus-ikili`);
    await idle();
    await b.wait(1200);
    await b.shot(`${tag}-${name}-5-ikili`);
    await b.eval(`document.querySelector('.journey-hud button').click()`);
    await b.wait(300);
    await idle();
    await b.wait(1800);
    await b.shot(`${tag}-${name}-6-genel`);
    const m = await b.eval('window.__olcum()');
    console.log(name, `kademe ${m.tier} dpr ${m.dpr}`);
  }
}, { close: () => b.close() });
