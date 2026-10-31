// Kalite yöneticisi: yavaş GPU'da bir kademe iniyor mu? (üretim derlemesiyle: BASE=http://localhost:4173)
import { launch, BASE } from './cdp.mjs';
const [w, h] = [Number(process.argv[2] ?? 1920), Number(process.argv[3] ?? 1080)];
const b = await launch();
await b.viewport(w, h);
await b.go(`${BASE}/?olcum`);
await b.wait(3000);
await b.eval('window.__olcum()');
await b.wait(3000);
console.log('ilk 3 sn  ', JSON.stringify(await b.eval('window.__olcum()')));
await b.wait(9000);
await b.eval('window.__olcum()');
await b.wait(3000);
console.log('12 sn sonra', JSON.stringify(await b.eval('window.__olcum()')));
await b.close();
