import { launch, BASE } from './cdp.mjs';
const b = await launch();
const ok = (name, cond, extra = '') => console.log(cond ? 'GEÇTİ ' : 'KALDI ', name, extra);
const press = async (key, code, kc, text) => {
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: kc, text });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: kc });
};
await b.viewport(1440, 900);
await b.go(`${BASE}/`);
await b.wait(4000);
// Yalnızca klavye: Tab ile başla düğmesine, Enter ile yolculuk.
let tabs = 0;
while (tabs < 12 && !(await b.eval(`document.activeElement?.classList.contains('primary')`))) { await press('Tab', 'Tab', 9); tabs++; }
ok('Tab ile başla düğmesine ulaşıldı', await b.eval(`document.activeElement?.classList.contains('primary')`), `${tabs} Tab`);
await press('Enter', 'Enter', 13, '\r');
const t0 = Date.now();
while (!(await b.eval(`document.querySelector('.app').className.includes('phase-arrived')`)) && Date.now() - t0 < 10000) await b.wait(50);
ok('Enter ile uçuş ve varış', Date.now() - t0 < 10000, `${Date.now() - t0}ms`);
ok('varışta odak anı başlığında', await b.eval(`document.activeElement?.id === 'arrival-title'`), await b.eval(`document.activeElement?.tagName + '#' + document.activeElement?.id`));
await press('Tab', 'Tab', 9);
ok('sonraki Tab: Anıyı aç', await b.eval(`document.activeElement?.textContent.trim().startsWith('Anıyı aç')`));
await press('Enter', 'Enter', 13, '\r');
await b.wait(600);
ok('Enter ile anı dialogu açıldı', await b.eval(`!!document.querySelector('dialog[open]')`));
ok('odak dialog içinde', await b.eval(`!!document.activeElement?.closest('dialog[open]')`));
await b.shot('i-dialog-desk');
await press('Escape', 'Escape', 27);
await b.wait(400);
ok('Escape ile kapandı ve odak geri döndü', await b.eval(`!document.querySelector('dialog[open]') && document.activeElement?.textContent.trim().startsWith('Anıyı aç')`));
await b.close();
