// Kısa kabul videosu: açılış → uçuş → varış ipucu → yıldıza dokunma → anının açılması →
// kapanış → genel görünüme dönüş. CDP ekran yayını kareleri zaman damgalarıyla
// kaydedilir, ffmpeg ile gerçek zamanlı bir MP4'e birleştirilir.
// Kullanım: BASE=http://localhost:4173 node scripts/video.mjs <etiket> [genişlik] [yükseklik] [m]
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launch, BASE } from './cdp.mjs';
import { runChecks } from './check.mjs';

const [tag = 'video', w = '1440', h = '900', mode = 'd'] = process.argv.slice(2);
const mobile = mode === 'm';
const out = fileURLToPath(new URL(`./.cikti/video-${tag}`, import.meta.url));
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const b = await launch();
await runChecks(async ({ ok }) => {
  await b.viewport(Number(w), Number(h), mobile, mobile ? 2 : 1);
  await b.go(`${BASE}/`);
  await b.wait(5500);
  const frames = [];
  const onFrame = (m) => {
    if (m.method !== 'Page.screencastFrame') return;
    const { data, sessionId, metadata } = m.params;
    const file = `${out}/${String(frames.length).padStart(5, '0')}.jpg`;
    writeFileSync(file, Buffer.from(data, 'base64'));
    frames.push({ file, t: metadata.timestamp });
    b.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  };
  b.listen(onFrame);
  await b.send('Page.startScreencast', { format: 'jpeg', quality: 86, everyNthFrame: 1 });
  const idle = async () => { const t0 = Date.now(); while (Date.now() - t0 < 15000) { if (!(await b.eval(`document.querySelector('.app').className`)).includes('phase-travelling')) return; await b.wait(40); } throw new Error('uçuş bitmedi'); };
  const tap = async (x, y) => {
    if (mobile) {
      await b.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 0 }] });
      await b.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      await b.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, buttons: 0 });
      await b.wait(350);
      await b.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', buttons: 1, clickCount: 1 });
      await b.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', buttons: 0, clickCount: 1 });
    }
  };
  await b.wait(1800);
  await b.eval(`document.querySelector('.primary').click()`);
  await b.wait(300);
  await idle();
  await b.wait(2600); // ipucu belirir
  const t = await b.eval(`(() => { const r = document.querySelector('.star-target').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await tap(t.x, t.y);
  await b.wait(3200);
  ok('videoda anı açıldı', await b.eval(`!!document.querySelector('dialog.memory-dialog[open]')`));
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await b.wait(1600);
  await b.eval(`document.querySelectorAll('.route-stops button')[1].click()`);
  await b.wait(300);
  await idle();
  await b.wait(1500);
  await b.eval(`document.querySelector('.journey-hud button').click()`);
  await b.wait(300);
  await idle();
  await b.wait(2000);
  await b.send('Page.stopScreencast');
  await b.wait(300);
  ok('yeterli kare kaydedildi', frames.length > 200, String(frames.length));
  // Kare süreleri gerçek zaman damgalarından: video gerçek hızda oynar.
  const list = frames.map((f, i) => `file '${f.file.replace(/\\/g, '/')}'\nduration ${Math.max(0.001, (frames[i + 1]?.t ?? f.t + 0.04) - f.t).toFixed(4)}`).join('\n');
  writeFileSync(`${out}/kareler.txt`, `${list}\nfile '${frames.at(-1).file.replace(/\\/g, '/')}'\n`);
  const mp4 = fileURLToPath(new URL(`./.cikti/${tag}.mp4`, import.meta.url));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${out}/kareler.txt`, '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '23', '-movflags', '+faststart', mp4]);
  console.log('video:', mp4, `${frames.length} kare, ${(frames.at(-1).t - frames[0].t).toFixed(1)} sn`);
}, { close: () => b.close() });
