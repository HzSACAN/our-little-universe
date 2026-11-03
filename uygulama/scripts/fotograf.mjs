// Anı fotoğrafını yayına hazırlar: yönü düzeltir, kısa kenarı 1200, uzun kenarı 2400 px'e indirir,
// konum (GPS) dahil bütün meta verileri siler ve public/anilar/<yıldız>.jpg olarak yazar.
// Kullanım: node scripts/fotograf.mjs <yıldız> <kaynak-dosya>
// Çıktıdaki `photo` satırı src/content/memories.ts içine yapıştırılır; alt ve kadraj elle yazılır.
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const STARS = ['gold', 'binary', 'rose', 'azure', 'violet', 'dawn'];
const [star, source] = process.argv.slice(2);
if (!STARS.includes(star) || !source) {
  console.error(`Kullanım: node scripts/fotograf.mjs <${STARS.join('|')}> <kaynak-dosya>`);
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'anilar', `${star}.jpg`);
mkdirSync(dirname(out), { recursive: true });

execFileSync('ffmpeg', [
  '-v', 'error', '-y', '-i', source,
  // Kısa kenar en çok 1200, uzun kenar en çok 2400 px (uzun telefon fotoğrafları da keskin kalır).
  '-vf', "scale=w='min(iw,min(1200*max(1,iw/ih),2400*min(1,iw/ih)))':h=-2:flags=lanczos",
  '-map_metadata', '-1', '-frames:v', '1', '-q:v', '3', out,
], { stdio: 'inherit' });

const [width, height] = execFileSync('ffprobe', [
  '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', out,
]).toString().trim().split(',').map(Number);

console.log(`${out} · ${width}×${height} · ${Math.round(statSync(out).size / 1024)} KB`);
console.log(`photo: { src: 'anilar/${star}.jpg', width: ${width}, height: ${height}, alt: '', focus: '50% 40%' },`);
