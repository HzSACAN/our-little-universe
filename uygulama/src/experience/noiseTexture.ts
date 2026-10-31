import { Data3DTexture, LinearFilter, RedFormat, RepeatWrapping, UnsignedByteType } from 'three';
import { seededRandom } from './random';

// Bulutsu shader'ı her parçada pahalı simplex gürültü hesaplamak yerine,
// açılışta bir kez üretilen döşenebilir 3B gradyan gürültü dokusundan okur.

const SIZE = 64;
/** Dokunun bir turunda kaç gürültü hücresi var (shader ölçeği buna göre). */
export const NOISE_PERIOD = 8;

let shared: Data3DTexture | null = null;

function buildNoise(): Uint8Array {
  const rng = seededRandom(1106);
  const cells = NOISE_PERIOD;
  const gradients = new Float32Array(cells * cells * cells * 3);
  for (let i = 0; i < cells * cells * cells; i++) {
    // Birim küre üzerinde rastgele yön.
    const z = rng() * 2 - 1;
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    gradients.set([r * Math.cos(a), r * Math.sin(a), z], i * 3);
  }
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (ix: number, iy: number, iz: number, x: number, y: number, z: number) => {
    const g = (((iz % cells) * cells + (iy % cells)) * cells + (ix % cells)) * 3;
    return gradients[g] * x + gradients[g + 1] * y + gradients[g + 2] * z;
  };
  const out = new Uint8Array(SIZE * SIZE * SIZE);
  const scale = cells / SIZE;
  for (let z = 0; z < SIZE; z++) {
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const px = x * scale;
        const py = y * scale;
        const pz = z * scale;
        const ix = Math.floor(px);
        const iy = Math.floor(py);
        const iz = Math.floor(pz);
        const fx = px - ix;
        const fy = py - iy;
        const fz = pz - iz;
        const u = fade(fx);
        const v = fade(fy);
        const w = fade(fz);
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const n = lerp(
          lerp(
            lerp(grad(ix, iy, iz, fx, fy, fz), grad(ix + 1, iy, iz, fx - 1, fy, fz), u),
            lerp(grad(ix, iy + 1, iz, fx, fy - 1, fz), grad(ix + 1, iy + 1, iz, fx - 1, fy - 1, fz), u),
            v,
          ),
          lerp(
            lerp(grad(ix, iy, iz + 1, fx, fy, fz - 1), grad(ix + 1, iy, iz + 1, fx - 1, fy, fz - 1), u),
            lerp(grad(ix, iy + 1, iz + 1, fx, fy - 1, fz - 1), grad(ix + 1, iy + 1, iz + 1, fx - 1, fy - 1, fz - 1), u),
            v,
          ),
          w,
        );
        // Gradyan gürültü yaklaşık [-0.87, 0.87]; [0, 255] aralığına yay.
        out[(z * SIZE + y) * SIZE + x] = Math.max(0, Math.min(255, Math.round((n / 0.87) * 127.5 + 127.5)));
      }
    }
  }
  return out;
}

export function noiseTexture(): Data3DTexture {
  if (!shared) {
    const texture = new Data3DTexture(buildNoise(), SIZE, SIZE, SIZE);
    texture.format = RedFormat;
    texture.type = UnsignedByteType;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.wrapS = texture.wrapT = texture.wrapR = RepeatWrapping;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;
    shared = texture;
  }
  return shared;
}

/** Doku tabanlı gürültü ve fbm (GLSL). `uNoise` sampler3D uniform'u gerekir. */
export const textureNoise = (octaves: number) => /* glsl */ `
uniform highp sampler3D uNoise;
float tnoise(vec3 p){ return texture(uNoise,p*${(1 / NOISE_PERIOD).toFixed(4)}).r*2.-1.; }
float tfbm(vec3 p){
  float sum=0.;
  float amp=.5;
  for(int i=0;i<${octaves};i++){
    sum+=amp*tnoise(p);
    p=mat3(.8,.6,0.,-.48,.64,.6,.36,-.48,.8)*p*2.03+vec3(17.1,-9.2,4.7);
    amp*=.5;
  }
  return sum*1.6;
}
`;
