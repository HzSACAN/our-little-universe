import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  DoubleSide,
  ImageLoader,
  LinearFilter,
  LinearMipmapLinearFilter,
  Mesh,
  NoColorSpace,
  NormalBlending,
  PlaneGeometry,
  ShaderMaterial,
  Texture,
  Vector3,
} from 'three';
import type { SceneBridge } from './bridge';
import type { QualityTier } from './quality';
import { layerBudget, nebulaTextures, placedLayers, type NebulaTextureId } from './texturedNebulaLayout';

// Ayrıntılı bulutsu dokuları, dünya uzayında sabit saydam yüzeylerde. Tam hacimsel bir
// bulutsu değildir. Katmanlar farklı derinliklerde durduğu için uçuşta ve bakınmada
// gerçek paralaks verir. Doğrudan ana sahnede, tam çözünürlükte çizilir; prosedürel
// bulutsunun düşük çözünürlüklü ara hedefinde yeniden bulanıklaşmaz.

const vertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;
void main(){
  vUv=uv;
  vec4 world=modelMatrix*vec4(position,1.);
  vWorld=world.xyz;
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

const fragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform float uOpacity;
uniform float uExposure;
uniform float uMirror;
uniform vec2 uFade;
uniform vec3 uCenter;
uniform vec3 uNormal;
varying vec2 vUv;
varying vec3 vWorld;
vec3 srgbToLinear(vec3 c){
  return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));
}
void main(){
  vec2 uv=vec2(mix(vUv.x,1.-vUv.x,uMirror),vUv.y);
  // Doku yüklenirken alfa ile çarpılır (premultiplied): süzme ve mipmap, saydam
  // piksellerin doygun rengini kenara taşımaz (hale/renk saçağı olmaz).
  vec4 t=texture2D(uMap,uv);
  if(t.a<.003) discard;
  vec3 color=srgbToLinear(min(t.rgb/t.a,1.));
  // Ayrıntısız, düz pastel dolgu (dokunun dış gövdesi) daha saydam: ince gaz kenarları ve
  // ışıklı yapılar kalır, yüzey "çıkartma" gibi okunmaz. Ölçü: dokunun kaba mip düzeyine farkı.
  vec4 coarse=texture2D(uMap,uv,3.);
  float lum=dot(t.rgb,vec3(.299,.587,.114));
  float detail=smoothstep(.015,.09,abs(lum-dot(coarse.rgb,vec3(.299,.587,.114))));
  float body=mix(.5,1.,max(detail,smoothstep(.55,.85,lum)));
  // ACES ton eşlemesi doygunluğu artırır; kaynak renkler biraz yumuşatılır.
  color=mix(vec3(dot(color,vec3(.2126,.7152,.0722))),color,.86)*.86*uExposure;
  // Doku kenarında güvence: dikdörtgen sınır hiçbir açıda görünmez.
  float edge=smoothstep(0.,.05,uv.x)*smoothstep(0.,.05,1.-uv.x)*smoothstep(0.,.07,uv.y)*smoothstep(0.,.07,1.-uv.y);
  // Kamera yüzeye yaklaşınca ya da yüzeyi yandan görünce (kart kenarı) yumuşakça söner.
  float plane=abs(dot(cameraPosition-uCenter,uNormal));
  float near=smoothstep(uFade.x,uFade.y,plane);
  float facing=smoothstep(.12,.42,abs(dot(normalize(cameraPosition-vWorld),uNormal)));
  float a=t.a*body*uOpacity*edge*near*facing;
  gl_FragColor=vec4(color*a,a);
}
`;

interface Entry {
  texture: Texture;
  users: number;
  state: 'loading' | 'ready' | 'failed';
  disposeTimer: ReturnType<typeof setTimeout> | null;
}

// Aynı görsel bir kez indirilir ve bütün katmanlarca paylaşılır; son kullanıcı
// ayrılınca dispose edilir. Bir katmanın kapanması diğerlerinin dokusunu bozmaz. Kademe
// değişiminde ya da yeniden bağlanmada aynı doku hemen tekrar istenirse yeniden indirilmez.
const cache = new Map<NebulaTextureId, Entry>();

function acquire(id: NebulaTextureId, anisotropy: number): Entry {
  let entry = cache.get(id);
  if (!entry) {
    const texture = new Texture();
    const created: Entry = { texture, users: 0, state: 'loading', disposeTimer: null };
    entry = created;
    cache.set(id, created);
    new ImageLoader().load(
      `${import.meta.env.BASE_URL}${nebulaTextures[id].file}`,
      (image) => {
        texture.image = image;
        texture.needsUpdate = true;
        created.state = 'ready';
      },
      undefined,
      () => {
        created.state = 'failed';
        // Doku gelmezse katman hiç çizilmez; sahne prosedürel bulutsuyla sürer.
        console.warn(`Bulutsu dokusu yüklenemedi: ${nebulaTextures[id].file}`);
      },
    );
    // Renk elle çözülür (yukarıdaki shader): doku sRGB baytlarıyla, alfa ile çarpılmış yüklenir.
    texture.colorSpace = NoColorSpace;
    texture.premultiplyAlpha = true;
    texture.generateMipmaps = true;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
  }
  if (entry.disposeTimer) clearTimeout(entry.disposeTimer);
  entry.disposeTimer = null;
  entry.texture.anisotropy = Math.max(entry.texture.anisotropy, anisotropy);
  entry.users++;
  return entry;
}

function release(id: NebulaTextureId) {
  const entry = cache.get(id);
  if (!entry) return;
  entry.users--;
  if (entry.users > 0) return;
  entry.disposeTimer = setTimeout(() => {
    if (entry.users > 0) return;
    entry.texture.dispose();
    cache.delete(id);
  }, 2000);
}

interface TexturedNebulaProps {
  tier: QualityTier;
  bridge: SceneBridge;
}

export function TexturedNebula({ tier, bridge }: TexturedNebulaProps) {
  const gl = useThree((s) => s.gl);
  const layers = useMemo(() => placedLayers.filter((l) => l.priority <= layerBudget[tier]), [tier]);
  const anisotropy = Math.min(tier === 'low' ? 2 : 4, gl.capabilities.getMaxAnisotropy());

  const geometry = useMemo(() => new PlaneGeometry(1, 1), []);
  const meshes = useMemo(
    () =>
      layers.map((layer) => {
        const material = new ShaderMaterial({
          uniforms: {
            uMap: { value: null as Texture | null },
            uOpacity: { value: 0 },
            uExposure: { value: layer.exposure },
            uMirror: { value: layer.mirror ? 1 : 0 },
            uFade: { value: [layer.fade[0], layer.fade[1]] },
            uCenter: { value: layer.center.clone() },
            uNormal: { value: layer.normal.clone() },
          },
          vertexShader,
          fragmentShader,
          transparent: true,
          premultipliedAlpha: true,
          blending: NormalBlending,
          depthWrite: false,
          depthTest: true,
          side: DoubleSide,
        });
        const mesh = new Mesh(geometry, material);
        mesh.position.copy(layer.center);
        mesh.quaternion.copy(layer.quaternion);
        mesh.scale.set(layer.size[0], layer.size[1], 1);
        // Sabit çizim sırası: uzaktaki katman önce. Uzaklığa göre her frame yeniden
        // sıralama, örtüşen katmanların sırasını kamera hareketinde sıçratabilirdi.
        mesh.renderOrder = -4 - layer.distance / 100000;
        mesh.frustumCulled = false;
        mesh.visible = false;
        return { layer, mesh, material, shown: 0 };
      }),
    [layers, geometry],
  );

  // Dokular efektte edinilir ve bırakılır: bileşen yeniden bağlansa da sayaç tutarlı kalır.
  const entries = useRef(new Map<NebulaTextureId, Entry>());
  useEffect(() => {
    const ids = [...new Set(meshes.map((m) => m.layer.texture))];
    for (const id of ids) entries.current.set(id, acquire(id, anisotropy));
    for (const m of meshes) m.material.uniforms.uMap.value = entries.current.get(m.layer.texture)!.texture;
    return () => {
      for (const id of ids) {
        entries.current.delete(id);
        release(id);
      }
    };
  }, [meshes, anisotropy]);

  useEffect(
    () => () => {
      meshes.forEach((m) => m.material.dispose());
    },
    [meshes],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const toCamera = useMemo(() => new Vector3(), []);
  useFrame(({ camera }, delta) => {
    for (const m of meshes) {
      const ready = entries.current.get(m.layer.texture)?.state === 'ready';
      // Yüklenince yumuşak belirme (hareket azaltmada anında).
      m.shown = ready ? (bridge.reducedMotion ? 1 : Math.min(1, m.shown + delta / 0.8)) : 0;
      // Kameraya çok yakın ya da tamamen sönmüş katman çizilmez (doldurma maliyeti).
      const plane = Math.abs(toCamera.copy(camera.position).sub(m.layer.center).dot(m.layer.normal));
      m.mesh.visible = m.shown > 0 && plane > m.layer.fade[0];
      m.material.uniforms.uOpacity.value = m.layer.opacity * m.shown;
    }
  });

  return (
    <>
      {meshes.map((m) => (
        <primitive key={m.layer.id} object={m.mesh} />
      ))}
    </>
  );
}
