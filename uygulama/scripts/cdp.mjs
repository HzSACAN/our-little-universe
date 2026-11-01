// Küçük CDP sürücüsü: headless Chrome ile gerçek GPU çizimi, ekran görüntüsü ve ölçüm.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// Çıktılar scripts/.cikti altına yazılır. Chrome yolu CHROME ile, adres BASE ile değiştirilebilir.
const SP = process.env.SP ?? fileURLToPath(new URL('./.cikti', import.meta.url));
mkdirSync(SP + '/shots', { recursive: true });
export const BASE = process.env.BASE ?? 'http://localhost:5173';
const CHROME = process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const port = 9333;
export async function launch() {
  mkdirSync(SP + '/profile', { recursive: true });
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${SP}/profile`, '--no-first-run', '--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 50; i++) {
    try { const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); const page = list.find(t => t.type === 'page'); if (page) { ws = page.webSocketDebuggerUrl; break; } } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  if (!ws) { proc.kill(); throw new Error(`Chrome başlatılamadı (${CHROME}); CHROME ortam değişkeniyle yolu verin.`); }
  const sock = new WebSocket(ws);
  await new Promise(r => sock.addEventListener('open', r, { once: true }));
  let id = 0; const pending = new Map(); const listeners = [];
  sock.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); } else listeners.forEach(l => l(m)); });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); sock.send(JSON.stringify({ id: i, method, params })); });
  const logs = [];
  listeners.push(m => { if (m.method === 'Runtime.consoleAPICalled') logs.push(m.params.type + ': ' + m.params.args.map(a => a.value ?? a.description).join(' ')); if (m.method === 'Runtime.exceptionThrown') logs.push('EXC: ' + JSON.stringify(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text)); });
  await send('Runtime.enable'); await send('Page.enable');
  const api = {
    send, logs,
    /** Ham CDP olaylarını dinler (ör. ekran yayını kareleri). */
    listen(fn) { listeners.push(fn); },
    async viewport(w, h, mobile = false, dpr = 1) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile }); await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false }); },
    async go(url) { await send('Page.navigate', { url }); await new Promise(r => setTimeout(r, 300)); },
    async eval(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; },
    async shot(name) { const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 }); writeFileSync(`${SP}/shots/${name}.jpg`, Buffer.from(r.data, 'base64')); return `${SP}/shots/${name}.jpg`; },
    wait: ms => new Promise(r => setTimeout(r, ms)),
    async close() { try { await send('Browser.close'); } catch {} proc.kill(); },
  };
  return api;
}
