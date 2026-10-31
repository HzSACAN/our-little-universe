import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
} from 'three';
import { starOrder, type StarId } from '../content/memories';
import { fbm, simplexNoise3 } from './shaders/noise';
import { COMPANION_ORBIT, COMPANION_RADIUS, stars } from './world';
import type { SceneBridge } from './bridge';

// İki anı yıldızı ışık yayan cisimler olarak çizilir. Altın yıldız taneli,
// kaynayan bir yüzey ve uzun korona iplikleri taşır; ikili yıldızın ana
// bileşeni akan bantlı buz mavisi bir yüzey, kenarında lavanta parıltı ve
// etrafında dönen sıcak pembe-beyaz bir eş yıldıza sahiptir.

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
varying vec2 vUv;
${simplexNoise3}
void main(){
  float d=length(vUv)/uRadius;
  if(d<.98) discard;
  float a=atan(vUv.y,vUv.x);
  float x=d-1.;
  float inner=exp(-x*9.)*.9;
  float glow=exp(-x/uReach);
  float halo=exp(-x*.55)*.12;
  float n=snoise(vec3(cos(a)*2.4,sin(a)*2.4,x*.8-uTime*.04))*.5+.5;
  float m=snoise(vec3(cos(a)*6.,sin(a)*6.,x*1.6-uTime*.07+3.))*.5+.5;
  float streak=mix(1.,.35+1.25*pow(n,2.)*(.6+.6*m),uStreamers);
  vec3 col=uColor*(inner+glow*streak*.55)+uOuter*halo;
  float edge=1.-smoothstep(.7,1.,length(vUv)/uSize);
  gl_FragColor=vec4(col*uStrength*edge,1.);
}
`;

interface StarLook {
  mode: 0 | 1 | 2;
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
    mode: 2, deep: '#165d75', mid: '#6fdddb', hot: '#d8fff1', rim: '#80ffe7', rimBoost: 1.15,
    corona: { color: '#8cf0df', outer: '#397cbf', boost: 1.15, streamers: 0.25, reach: 0.75, size: 6.5 },
  },
  violet: {
    mode: 1, deep: '#482f9e', mid: '#a694ee', hot: '#e8daff', rim: '#de91ff', rimBoost: 1.45,
    corona: { color: '#c6a5ff', outer: '#cf68b6', boost: 1.3, streamers: 0.65, reach: 0.5, size: 5.5 },
  },
  dawn: {
    mode: 0, deep: '#b65b32', mid: '#efbf80', hot: '#fff0ca', rim: '#ffe6ab', rimBoost: 1.3,
    corona: { color: '#ffe0ad', outer: '#db8f9b', boost: 1.2, streamers: 0.9, reach: 0.7, size: 7 },
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

function makeSurface(look: StarLook) {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMode: { value: look.mode },
      uDeep: { value: new Color(look.deep) },
      uMid: { value: new Color(look.mid) },
      uHot: { value: new Color(look.hot) },
      uRim: { value: new Color(look.rim).multiplyScalar(look.rimBoost) },
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
  useFrame((_, delta) => {
    if (!bridge.reducedMotion) time.current += Math.min(delta, 0.05);
    const t = time.current;
    starOrder.forEach((id, i) => {
      const localTime = t * (id === 'azure' ? 0.4 : 1) + i * 17;
      res.materials[id].surface.uniforms.uTime.value = localTime;
      res.materials[id].corona.uniforms.uTime.value = localTime;
      const body = bodies.current[id];
      if (body) body.rotation.y = t * (0.012 + i * 0.003);
    });
    res.companionSurface.uniforms.uTime.value = t;
    res.companionCorona.uniforms.uTime.value = t;
    const angle = t * 0.22 + 2.2;
    companion.current?.position.set(Math.cos(angle) * COMPANION_ORBIT, 0, Math.sin(angle) * COMPANION_ORBIT);
    res.orbitMat.uniforms.uHead.value = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  });

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
