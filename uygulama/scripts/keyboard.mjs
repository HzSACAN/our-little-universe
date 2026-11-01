import { launch, BASE } from './cdp.mjs';
import { runChecks } from './check.mjs';
const b = await launch();
await runChecks(async ({ ok, consoleClean }) => {
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
  ok('varışta anı kendiliğinden açılmaz', await b.eval(`!document.querySelector('dialog[open]')`));
  ok('varışta odak anı başlığında', await b.eval(`document.activeElement?.id === 'arrival-title'`), await b.eval(`document.activeElement?.tagName + '#' + document.activeElement?.id`));
  // Yıldız hedefi ilk projeksiyon karesine kadar gizli (yavaş GPU'da ~130 ms); kullanıcı bu kadar hızlı Tab'a basmaz.
  await b.wait(400);
  await press('Tab', 'Tab', 9);
  ok('sonraki Tab: yıldızın erişilebilir hedefi', await b.eval(`document.activeElement?.classList.contains('star-target') && document.activeElement.getAttribute('aria-label').startsWith('Anıyı aç')`), await b.eval(`document.activeElement?.getAttribute('aria-label')`));
  ok('odakta yıldızın çevresinde görünür halka', await b.eval(`getComputedStyle(document.querySelector('.star-target-ring')).borderTopStyle === 'solid' && document.querySelector('.star-target').matches(':focus-visible')`));
  await press('Enter', 'Enter', 13, '\r');
  await b.wait(900);
  ok('Enter ile anı dialogu açıldı', await b.eval(`!!document.querySelector('dialog[open]')`));
  ok('odak dialog içinde', await b.eval(`!!document.activeElement?.closest('dialog[open]')`));
  await b.shot('i-dialog-desk');
  await press('Escape', 'Escape', 27);
  await b.wait(700);
  ok('Escape ile kapandı ve odak yıldız hedefine döndü', await b.eval(`!document.querySelector('dialog[open]') && document.activeElement?.classList.contains('star-target')`));
  consoleClean(b.logs);
}, { close: () => b.close() });
