import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  PlaneGeometry,
  Vector3,
  ShaderMaterial,
  SphereGeometry,
} from 'three';
import { starOrder, type StarId } from '../content/memories';
import { fbm, simplexNoise3 } from './shaders/noise';
import { COMPANION_ORBIT, COMPANION_RADIUS, stars } from './world';
import type { SceneBridge } from './bridge';

// Altı anı yıldızı ışık yayan cisimler olarak çizilir ve her biri ayrı bir yüzey
// karakteri taşır: altın ve pembe yıldız taneli kaynayan yüzey, ikili yıldız
// akan bantlar ve eş yıldız, turkuaz yıldız manyetik plazma iplikleri, mor
// yıldız dev konveksiyon hücreleri, şafak yıldızı ise altından pembeye dönen
// iki tonlu bir yüzey.

const surfaceVertex = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vView;
void main(){
  vPos=position;
  vec4 world=modelMatrix*vec4(position,1.);
  vNormal=normalize(mat3(modelMatrix)*normal);
  vView=normalize(cameraPosition-world.xyz);
  gl_Position=projectionMatrix*viewMatrix*world;
}
`;

const surfaceFragment = /* glsl */ `
uniform float uTime;
uniform int uMode;
uniform vec3 uDeep;
uniform vec3 uMid;
uniform vec3 uHot;
uniform vec3 uRim;
uniform vec3 uTone;
uniform float uToneMix;
varying vec3 vPos;
varying vec3 vNormal;
varying vec3 vView;
${simplexNoise3}
${fbm(4)}
void main(){
  vec3 p=normalize(vPos);
  float mu=clamp(dot(normalize(vNormal),normalize(vView)),0.,1.);
  vec3 col;
  if(uMode==0){
    // Altın: geniş sıcak akıntılar üzerinde ince granülasyon; ışık yayan yüzey.
    float t=uTime*.03;
    vec3 q=p*2.4+vec3(t,-t*.6,t*.4);
    float warp=fbm(q*.6);
    float large=fbm(q*.9+warp)*.5+.5;
    float grain=snoise(p*24.+warp*2.+vec3(t*3.))*.5+.5;
    float heat=clamp(.16+large*.58+grain*.2,0.,1.);
    col=mix(uDeep,uMid,smoothstep(.12,.58,heat));
    col=mix(col,uHot,smoothstep(.6,.95,heat)*.8);
    // İsteğe bağlı iki ton: alt yarımküreye doğru ikinci renge döner (şafak).
    col*=mix(vec3(1.),uTone,smoothstep(.35,-.85,p.y)*uToneMix);
    col*=.42+.58*pow(mu,.5);
    col+=uRim*pow(1.-mu,2.6)*.6;
  } else if(uMode==1){
    // Buz mavisi: enlem boyunca akan bantlar, farklı hızlarda dönen katmanlar.
    float lat=p.y;
    float spin=uTime*(.07+.05*(1.-lat*lat));
    float c=cos(spin),s=sin(spin);
    vec3 r=vec3(p.x*c-p.z*s,p.y,p.x*s+p.z*c);
    float warp=fbm(r*2.2+vec3(0.,uTime*.02,0.));
    float bands=sin(lat*9.+warp*2.6)*.5+.5;
    float fine=fbm(vec3(r.x*3.,r.y*8.,r.z*3.)+warp)*.5+.5;
    float heat=clamp(.34+bands*.24+fine*.36,0.,1.);
    col=mix(uDeep,uMid,smoothstep(.25,.7,heat));
    col=mix(col,uHot,smoothstep(.7,1.,heat)*.4);
    col*=(.55+.4*pow(mu,.4))*.9;
    // Lavanta kenar parıltısı: altın yıldızdan farklı ışık davranışı.
    col+=uRim*pow(1.-mu,2.2)*.9;
  } else if(uMode==3){
    // Turkuaz: koyu zemin üzerinde parlak, kıvrılan manyetik plazma iplikleri; yavaş nefes.
    float t=uTime*.05;
    vec3 q=p*1.8+vec3(0.,t,0.);
    float w=fbm(q);
    float fil=1.-abs(snoise(p*3.2+w*1.8+vec3(t)));
    fil=pow(fil,7.);
    float base=fbm(p*2.6+w)*.5+.5;
    float heat=clamp(.34+base*.36+fil*.4,0.,1.);
    col=mix(uDeep,uMid,smoothstep(.15,.62,heat));
    col=mix(col,uHot,smoothstep(.66,1.,heat)*.7);
    col*=(.5+.5*pow(mu,.5))*(.93+.07*sin(uTime*.8));
    col+=uRim*pow(1.-mu,2.4)*.55;
  } else if(uMode==4){
    // Mor: dev yıldız gibi büyük konveksiyon hücreleri, aralarında koyu yollar.
    float t=uTime*.03;
    vec3 q=p*3.1+vec3(t*.4,-t*.2,t*.3);
    float w=fbm(q*.5);
    float lanes=abs(snoise(q+w*1.4));
    float cells=smoothstep(.0,.55,lanes);
    float spots=fbm(p*1.5+vec3(4.,t*.6,0.))*.5+.5;
    float heat=clamp(.3+cells*.3+spots*.4,0.,1.);
    col=mix(uDeep,uMid,smoothstep(.2,.66,heat));
    col=mix(col,uHot,smoothstep(.74,1.,heat)*.55);
    col*=.42+.58*pow(mu,.6);
    col+=uRim*pow(1.-mu,2.)*.75;
  } else {
    // Eş yıldız: küçük, sıcak, hızlı kaynayan yüzey.
    float n=fbm(p*5.+vec3(uTime*.2))*.5+.5;
    col=mix(uMid,uHot,n);
    col*=.7+.3*pow(mu,.5);
    col+=uRim*pow(1.-mu,2.)*.8;
  }
  gl_FragColor=vec4(col,1.);
}
`;

const coronaVertex = /* glsl */ `
varying vec2 vUv;
uniform float uSize;
void main(){
  vec3 center=(modelMatrix*vec4(0.,0.,0.,1.)).xyz;
  vec3 camRight=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
  vec3 camUp=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
  vec3 world=center+(camRight*position.x+camUp*position.y)*uSize;
  vUv=position.xy*uSize; // yıldız yarıçapı biriminde
  gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
}
`;

const coronaFragment = /* glsl */ `
uniform float uTime;
uniform float uRadius;
uniform vec3 uColor;
uniform vec3 uOuter;
uniform float uStreamers;
uniform float uReach;
uniform float uStrength;
uniform float uSize;
// Etkileşim: davet halkası (0–1), hover/odak (0–1), açılış ışığı (0–1) ve dalganın ilerlemesi (0–1).
uniform float uInvite;
uniform float uHover;
uniform float uFlare;
uniform float uWave;
varying vec2 vUv;
${simplexNoise3}
void main(){
  float d=length(vUv)/uRadius;
  if(d<.98) discard;
  float a=atan(vUv.y,vUv.x);
  float x=d-1.;
  float inner=exp(-x*9.)*.9;
  // Anı açılırken korona kısa ve kontrollü biçimde genişler.
  float glow=exp(-x/(uReach*(1.+uFlare*.55+uHover*.12)));
  float halo=exp(-x*.55)*.12;
  float n=snoise(vec3(cos(a)*2.4,sin(a)*2.4,x*.8-uTime*.04))*.5+.5;
  float m=snoise(vec3(cos(a)*6.,sin(a)*6.,x*1.6-uTime*.07+3.))*.5+.5;
  float streak=mix(1.,.35+1.25*pow(n,2.)*(.6+.6*m),uStreamers);
  vec3 col=uColor*(inner+glow*streak*.55*(1.+uFlare*.6+uHover*.18))+uOuter*halo;
  // Yıldızın dokunulabilir olduğunu sezdiren ince, nefes alan ışık halkası.
  float breathe=.5+.5*sin(uTime*1.7);
  float ringR=1.34+.035*breathe;
  float ring=exp(-pow((d-ringR)/.022,2.))*(uInvite*(.35+.4*breathe)+uHover*.55);
  col+=mix(uColor,vec3(1.),.25)*ring*.75;
  // Açılış: yüzeyden yayılan ince bir ışık dalgası; dalga boyunca seyrek kıvılcımlar.
  if(uWave>0.&&uWave<1.){
    float wr=1.08+uWave*3.1;
    float wave=exp(-pow((d-wr)/(.03+uWave*.09),2.))*pow(1.-uWave,1.6);
    float sparks=.35+.9*smoothstep(.45,.95,snoise(vec3(cos(a)*7.,sin(a)*7.,uWave*2.5+uTime*.1)));
    col+=mix(uColor,vec3(1.),.3)*wave*sparks*1.25;
  }
  float edge=1.-smoothstep(.7,1.,length(vUv)/uSize);
  gl_FragColor=vec4(col*uStrength*edge,1.);
}
`;

interface StarLook {
  mode: 0 | 1 | 2 | 3 | 4;
  /** Mod 0 için alt yarımküre tonu ve karışım oranı. */
  tone?: string;
  toneMix?: number;
  deep: string;
  mid: string;
  hot: string;
  rim: string;
  rimBoost: number;
  corona: { color: string; outer: string; boost: number; streamers: number; reach: number; size: number };
}

const looks: Record<StarId | 'companion', StarLook> = {
  gold: {
    mode: 0,
    deep: '#a33d12',
    mid: '#f0a548',
    hot: '#ffe6b0',
    rim: '#ffb46a',
    rimBoost: 1.2,
    corona: { color: '#ffbf6e', outer: '#ff8a5c', boost: 1.6, streamers: 1, reach: 0.55, size: 6.5 },
  },
  binary: {
    mode: 1,
    deep: '#5866d0',
    mid: '#8fb4ff',
    hot: '#e4eeff',
    rim: '#c9a6ff',
    rimBoost: 1.6,
    corona: { color: '#9fc2ff', outer: '#a77bff', boost: 1.3, streamers: 0.45, reach: 0.38, size: 5 },
  },
  rose: {
    mode: 0, deep: '#8b1f59', mid: '#e779b4', hot: '#ffe1ef', rim: '#ffa0c8', rimBoost: 1.3,
    corona: { color: '#f6a1cc', outer: '#9746b6', boost: 1.3, streamers: 0.65, reach: 0.65, size: 6 },
  },
  azure: {
    mode: 3, deep: '#1a6b86', mid: '#34b9c4', hot: '#d2fff2', rim: '#7ff6e6', rimBoost: 1.1,
    corona: { color: '#7fead8', outer: '#3a6fd0', boost: 1.15, streamers: 0.35, reach: 0.45, size: 5.5 },
  },
  violet: {
    mode: 4, deep: '#4b2f9c', mid: '#9a7be4', hot: '#f1e4ff', rim: '#ff8ad6', rimBoost: 1.35,
    corona: { color: '#c7a2ff', outer: '#d45fb0', boost: 1.3, streamers: 0.8, reach: 0.6, size: 6 },
  },
  dawn: {
    mode: 0, deep: '#b5552e', mid: '#f2b978', hot: '#fff0cf', rim: '#ffb1c4', rimBoost: 1.35,
    tone: '#ff9cb8', toneMix: 0.55,
    corona: { color: '#ffd6a8', outer: '#e07fa6', boost: 1.25, streamers: 0.95, reach: 0.75, size: 7.5 },
  },
  companion: {
    mode: 2,
    deep: '#ff9ccf',
    mid: '#ffb3d9',
    hot: '#fff3fa',
    rim: '#ff8fc8',
    rimBoost: 1.8,
    corona: { color: '#ffb0dc', outer: '#c78bff', boost: 1.5, streamers: 0.2, reach: 0.5, size: 5 },
  },
};

/** Uzak parıltı ve etiketler için her yıldızın korona rengi. */
export const starGlowColors = Object.fromEntries(
  starOrder.map((id) => [id, looks[id].corona.color]),
) as Record<StarId, string>;

function makeSurface(look: StarLook) {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMode: { value: look.mode },
      uDeep: { value: new Color(look.deep) },
      uMid: { value: new Color(look.mid) },
      uHot: { value: new Color(look.hot) },
      uRim: { value: new Color(look.rim).multiplyScalar(look.rimBoost) },
      uTone: { value: new Color(look.tone ?? '#ffffff') },
      uToneMix: { value: look.toneMix ?? 0 },
    },
    vertexShader: surfaceVertex,
    fragmentShader: surfaceFragment,
  });
}

function makeCorona(look: StarLook, radius: number) {
  const c = look.corona;
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uRadius: { value: radius },
      uSize: { value: radius * c.size },
      uColor: { value: new Color(c.color).multiplyScalar(c.boost) },
      uOuter: { value: new Color(c.outer) },
      uStreamers: { value: c.streamers },
      uReach: { value: c.reach },
      uStrength: { value: 1 },
      uInvite: { value: 0 },
      uHover: { value: 0 },
      uFlare: { value: 0 },
      uWave: { value: 0 },
    },
    vertexShader: coronaVertex,
    fragmentShader: coronaFragment,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
}

interface MemoryStarsProps {
  bridge: SceneBridge;
  interactive: boolean;
  onSelect: (id: StarId) => void;
}

export function MemoryStars({ bridge, interactive, onSelect }: MemoryStarsProps) {
  const res = useMemo(() => {
    const sphere = new SphereGeometry(1, 96, 64);
    const smallSphere = new SphereGeometry(1, 48, 32);
    const quad = new PlaneGeometry(2, 2);
    const materials = Object.fromEntries(starOrder.map((id) => [id, {
      surface: makeSurface(looks[id]), corona: makeCorona(looks[id], stars[id].radius),
    }])) as Record<StarId, { surface: ShaderMaterial; corona: ShaderMaterial }>;
    const companionSurface = makeSurface(looks.companion);
    const companionCorona = makeCorona(looks.companion, stars.binary.radius * COMPANION_RADIUS);
    const segments = 160;
    const orbitPos = new Float32Array((segments + 1) * 3);
    const orbitAngle = new Float32Array(segments + 1);
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      orbitPos.set([Math.cos(a) * COMPANION_ORBIT, 0, Math.sin(a) * COMPANION_ORBIT], i * 3);
      orbitAngle[i] = a;
    }
    const orbitGeo = new BufferGeometry();
    orbitGeo.setAttribute('position', new BufferAttribute(orbitPos, 3));
    orbitGeo.setAttribute('aAngle', new BufferAttribute(orbitAngle, 1));
    const orbitMat = new ShaderMaterial({
      uniforms: { uHead: { value: 0 }, uColor: { value: new Color('#d8b8ff').multiplyScalar(0.9) } },
      vertexShader: `attribute float aAngle; uniform float uHead; varying float vTrail;
        void main(){float behind=mod(uHead-aAngle+6.2831853,6.2831853);vTrail=exp(-behind*1.6)*.9;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform vec3 uColor; varying float vTrail;
        void main(){gl_FragColor=vec4(uColor*vTrail,1.);}`,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    return { sphere, smallSphere, quad, materials, companionSurface, companionCorona, orbitGeo, orbitMat };
  }, []);

  useEffect(() => () => {
    [res.sphere, res.smallSphere, res.quad, res.companionSurface, res.companionCorona, res.orbitGeo, res.orbitMat].forEach((r) => r.dispose());
    Object.values(res.materials).forEach(({ surface, corona }) => { surface.dispose(); corona.dispose(); });
  }, [res]);

  const bodies = useRef<Partial<Record<StarId, Group | null>>>({});
  const companion = useRef<Group>(null);
  const time = useRef(0);
  const hover = useRef(0);
  const invite = useRef(0);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (!bridge.reducedMotion) time.current += dt;
    const t = time.current;
    // Bulunulan yıldızın tepkileri; diğer yıldızlarda sıfır kalır.
    const k = 1 - Math.exp(-dt * 7);
    hover.current += ((bridge.fx.hover ? 1 : 0) - hover.current) * k;
    invite.current += ((bridge.fx.invite ? 1 : 0) - invite.current) * k * 0.5;
    const since = (performance.now() - bridge.fx.flareAt) / 1000;
    const reduced = bridge.reducedMotion;
    // Kısa yükseliş, yumuşak sönüş: sert bir beyaz flaş yerine korona nefes verir gibi açılır.
    const flare = reduced || since < 0 || since > 1.6 ? 0 : since < 0.14 ? since / 0.14 : Math.exp(-(since - 0.14) * 3.2);
    const wave = reduced || since < 0 || since > 1.1 ? 0 : since / 1.1;
    starOrder.forEach((id, i) => {
      const localTime = t * (id === 'azure' ? 0.4 : 1) + i * 17;
      const { surface, corona } = res.materials[id];
      surface.uniforms.uTime.value = localTime;
      corona.uniforms.uTime.value = localTime;
      const active = id === bridge.current && !bridge.flying;
      corona.uniforms.uInvite.value = active ? invite.current : 0;
      corona.uniforms.uHover.value = active ? hover.current : 0;
      corona.uniforms.uFlare.value = active ? flare : 0;
      corona.uniforms.uWave.value = active ? wave : 0;
      const body = bodies.current[id];
      if (body) body.rotation.y = t * (0.012 + i * 0.003);
    });
    const binaryActive = bridge.current === 'binary' && !bridge.flying;
    res.companionCorona.uniforms.uFlare.value = binaryActive ? flare : 0;
    res.companionCorona.uniforms.uHover.value = binaryActive ? hover.current : 0;
    res.companionSurface.uniforms.uTime.value = t;
    res.companionCorona.uniforms.uTime.value = t;
    const angle = t * 0.22 + 2.2;
    companion.current?.position.set(Math.cos(angle) * COMPANION_ORBIT, 0, Math.sin(angle) * COMPANION_ORBIT);
    res.orbitMat.uniforms.uHead.value = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    // Eş yıldızın dünya konumu: erişilebilir dokunma hedefi onu da kapsar.
    if (companion.current) {
      companion.current.getWorldPosition(companionWorld);
      bridge.companion.x = companionWorld.x;
      bridge.companion.y = companionWorld.y;
      bridge.companion.z = companionWorld.z;
      bridge.companion.r = stars.binary.radius * COMPANION_RADIUS;
    }
  });

  // Kanvasta yıldıza (veya eş yıldıza) dokunma; asıl karar App'teki dokunuş korumasındadır.
  const select = (id: StarId) => (e: ThreeEvent<MouseEvent>) => {
    if (!interactive || e.delta > 8) return;
    e.stopPropagation(); onSelect(id);
  };

  return <group dispose={null}>
    {starOrder.map((id) => <group key={id} position={stars[id].position} scale={stars[id].radius}>
      <group ref={(el) => { bodies.current[id] = el; }}>
        <mesh geometry={res.sphere} material={res.materials[id].surface} onClick={select(id)} />
      </group>
      <mesh geometry={res.quad} material={res.materials[id].corona} renderOrder={5} raycast={noRaycast} />
      {id === 'binary' && <group rotation={[0.95, 0.15, -0.28]}>
        <lineLoop geometry={res.orbitGeo} material={res.orbitMat} renderOrder={4} raycast={noRaycast} />
        <group ref={companion}><group scale={COMPANION_RADIUS}>
          <mesh geometry={res.smallSphere} material={res.companionSurface} onClick={select(id)} />
          <mesh geometry={res.quad} material={res.companionCorona} renderOrder={5} raycast={noRaycast} />
        </group></group>
      </group>}
    </group>)}
  </group>;
}

function noRaycast() { return null; }

const companionWorld = new Vector3();
