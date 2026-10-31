import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ShaderMaterial,
  Vector3,
} from 'three';
import { gaussian, range, seededRandom } from './random';
import { stars } from './world';
import type { SceneBridge } from './bridge';

// Üç yıldız katmanı: çok uzak kabuk, yol boyunca orta mesafe yıldızları ve
// kameranın çevresinde dünya konumuna bağlı yakın toz. Hepsi toplu çizilir.

const pointVertex = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
attribute float aPhase;
uniform float uTime;
uniform float uPixelRatio;
uniform float uScale;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec4 mv=modelViewMatrix*vec4(position,1.);
  gl_Position=projectionMatrix*mv;
  float size=aSize*uScale/max(1.,-mv.z);
  gl_PointSize=clamp(size,1.1,9.)*uPixelRatio;
  // Bütün gökyüzü aynı ritimde parlamaz: yalnızca bir kısmı yavaşça titrer.
  float tw=aPhase>3.5?.72+.28*sin(uTime*(.4+aPhase*.08)+aPhase*7.):1.;
  vColor=aColor;
  vAlpha=tw*clamp(size/1.4,.25,1.);
}
`;

const pointFragment = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 c=gl_PointCoord-.5;
  float d=length(c)*2.;
  float core=exp(-d*d*7.);
  float halo=exp(-d*3.2)*.25;
  float a=(core+halo)*(1.-smoothstep(.85,1.,d));
  gl_FragColor=vec4(vColor*a*vAlpha,1.);
}
`;

const dustVertex = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute float aEnd;
uniform float uBox;
uniform float uPixelRatio;
uniform float uTravel;
uniform vec3 uVelocity;
uniform float uIsLine;
varying float vAlpha;
void main(){
  // Dünya konumuna bağlı; kamera çevresindeki kutuda sarılır. Kamera ilerledikçe
  // toz gerçekten geride kalır, kutu kenarında sönerek yeniden belirir.
  vec3 rel=mod(position-cameraPosition+uBox*.5,uBox)-uBox*.5;
  vec3 world=cameraPosition+rel-uVelocity*aEnd;
  vec4 mv=viewMatrix*vec4(world,1.);
  gl_Position=projectionMatrix*mv;
  float d=length(rel);
  float fade=smoothstep(uBox*.5,uBox*.3,d)*smoothstep(4.,22.,d);
  gl_PointSize=clamp(aSize*240./max(1.,-mv.z),1.,6.)*uPixelRatio;
  vAlpha=fade*(.35+.25*sin(aPhase))*(1.+uTravel*.8);
  // Nokta katmanında yalnızca baş; çizgi katmanında baştan kuyruğa sönen iz.
  vAlpha*=uIsLine>.5?uTravel*.6*(1.-aEnd*.9):1.-aEnd;
}
`;

const dustFragment = /* glsl */ `
varying float vAlpha;
uniform float uIsLine;
void main(){
  float a=vAlpha;
  if(uIsLine<.5){
    float d=length(gl_PointCoord-.5)*2.;
    a*=exp(-d*d*5.);
  }
  gl_FragColor=vec4(vec3(.78,.86,1.)*a,1.);
}
`;

const starColors = ['#cfe0ff', '#a9c4ff', '#fff4e2', '#ffd9a8', '#e6d4ff', '#b8fff3', '#ffc2e2'].map((c) => new Color(c));

function tooCloseToMemoryStar(p: Vector3) {
  return Object.values(stars).some((s) => p.distanceTo(s.position) < s.clearance * 1.6);
}

function buildPoints(count: number, seed: number, place: (rng: () => number, out: Vector3) => void, brightShare: number) {
  const rng = seededRandom(seed);
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count);
  const p = new Vector3();
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    do {
      place(rng, p);
      attempts++;
    } while (tooCloseToMemoryStar(p) && attempts < 6);
    positions.set([p.x, p.y, p.z], i * 3);
    const bright = rng() < brightShare;
    sizes[i] = bright ? range(rng, 9, 16) : range(rng, 2.2, 7);
    const c = starColors[Math.floor(rng() * starColors.length)].clone();
    // Az sayıda parlak yıldız ışık yayar (bloom eşiğinin üstünde).
    c.multiplyScalar(bright ? range(rng, 1.4, 2.2) : range(rng, 0.45, 0.95));
    colors.set([c.r, c.g, c.b], i * 3);
    phases[i] = rng() * 6.283;
  }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('aSize', new BufferAttribute(sizes, 1));
  geo.setAttribute('aColor', new BufferAttribute(colors, 3));
  geo.setAttribute('aPhase', new BufferAttribute(phases, 1));
  return geo;
}

interface StarfieldProps {
  far: number;
  mid: number;
  dust: number;
  bridge: SceneBridge;
}

const DUST_BOX = 420;

export function Starfield({ far, mid, dust, bridge }: StarfieldProps) {
  const dpr = useThree((s) => s.viewport.dpr);

  const resources = useMemo(() => {
    const farGeo = buildPoints(
      far,
      11,
      (rng, out) => {
        const theta = rng() * Math.PI * 2;
        const phi = Math.acos(2 * rng() - 1);
        const r = range(rng, 2600, 6500);
        out.setFromSphericalCoords(r, phi, theta);
        out.z -= 1400;
      },
      0.03,
    );
    const midGeo = buildPoints(
      mid,
      23,
      (rng, out) => {
        out.set(range(rng, -1500, 1500), gaussian(rng) * 700, range(rng, 650, -4600));
      },
      0.06,
    );

    const rng = seededRandom(37);
    const dustPos = new Float32Array(dust * 6);
    const dustSize = new Float32Array(dust * 2);
    const dustPhase = new Float32Array(dust * 2);
    const dustEnd = new Float32Array(dust * 2);
    for (let i = 0; i < dust; i++) {
      const x = rng() * DUST_BOX;
      const y = rng() * DUST_BOX;
      const z = rng() * DUST_BOX;
      dustPos.set([x, y, z, x, y, z], i * 6);
      const s = range(rng, 1.5, 4.5);
      dustSize.set([s, s], i * 2);
      const ph = rng() * 6.283;
      dustPhase.set([ph, ph], i * 2);
      dustEnd.set([0, 1], i * 2);
    }
    const dustGeo = new BufferGeometry();
    dustGeo.setAttribute('position', new BufferAttribute(dustPos, 3));
    dustGeo.setAttribute('aSize', new BufferAttribute(dustSize, 1));
    dustGeo.setAttribute('aPhase', new BufferAttribute(dustPhase, 1));
    dustGeo.setAttribute('aEnd', new BufferAttribute(dustEnd, 1));

    const makePointMaterial = (scale: number) =>
      new ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uScale: { value: scale } },
        vertexShader: pointVertex,
        fragmentShader: pointFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      });
    const dustUniforms = {
      uBox: { value: DUST_BOX },
      uPixelRatio: { value: 1 },
      uTravel: { value: 0 },
      uVelocity: { value: new Vector3() },
    };
    const makeDustMaterial = (isLine: boolean) =>
      new ShaderMaterial({
        uniforms: { ...dustUniforms, uIsLine: { value: isLine ? 1 : 0 } },
        vertexShader: dustVertex,
        fragmentShader: dustFragment,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      });

    return {
      farGeo,
      midGeo,
      dustGeo,
      farMat: makePointMaterial(2600),
      midMat: makePointMaterial(900),
      dustMat: makeDustMaterial(false),
      streakMat: makeDustMaterial(true),
      dustUniforms,
    };
  }, [far, mid, dust]);

  useEffect(
    () => () => {
      const r = resources;
      [r.farGeo, r.midGeo, r.dustGeo, r.farMat, r.midMat, r.dustMat, r.streakMat].forEach((x) => x.dispose());
    },
    [resources],
  );

  const lastCamera = useMemo(() => new Vector3(Number.NaN, 0, 0), []);
  const velocity = useMemo(() => new Vector3(), []);

  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05);
    const r = resources;
    if (!bridge.reducedMotion) {
      r.farMat.uniforms.uTime.value += dt;
      r.midMat.uniforms.uTime.value += dt;
    }
    r.farMat.uniforms.uPixelRatio.value = dpr;
    r.midMat.uniforms.uPixelRatio.value = dpr;
    r.dustUniforms.uPixelRatio.value = dpr;
    r.dustUniforms.uTravel.value = bridge.travel;
    // Yakın tozun yol izi: kameranın gerçek hızı yönünde kısa çizgiler.
    if (Number.isNaN(lastCamera.x)) lastCamera.copy(camera.position);
    if (dt > 0) {
      velocity.copy(camera.position).sub(lastCamera).multiplyScalar(0.03 / Math.max(dt, 1 / 240));
      velocity.clampLength(0, 7);
    }
    lastCamera.copy(camera.position);
    r.dustUniforms.uVelocity.value.copy(bridge.reducedMotion ? velocity.set(0, 0, 0) : velocity);
  });

  return (
    <group>
      <points geometry={resources.farGeo} material={resources.farMat} frustumCulled={false} renderOrder={0} />
      <points geometry={resources.midGeo} material={resources.midMat} frustumCulled={false} renderOrder={2} />
      <points geometry={resources.dustGeo} material={resources.dustMat} frustumCulled={false} renderOrder={3} />
      <lineSegments
        geometry={resources.dustGeo}
        material={resources.streakMat}
        frustumCulled={false}
        renderOrder={3}
      />
    </group>
  );
}
