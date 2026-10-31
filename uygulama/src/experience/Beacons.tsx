import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial } from 'three';
import { starOrder } from '../content/memories';
import { stars } from './world';
import { starGlowColors } from './MemoryStars';

// Uzaktaki anı yıldızları gerçek boyutlarında birkaç piksele iner. Genel
// görünümde okunabilmeleri için her birine en az birkaç düzine piksellik,
// kendi renginde hafif ışınlı bir parıltı eşlik eder. Yıldız yaklaştıkça
// (ekrandaki yarıçapı büyüdükçe) parıltı söner ve gerçek yüzey görünür.

const vertexShader = /* glsl */ `
attribute float aRadius;
attribute vec3 aColor;
uniform float uHalfHeight;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec4 mv=modelViewMatrix*vec4(position,1.);
  gl_Position=projectionMatrix*mv;
  float dist=max(1.,-mv.z);
  float rPx=aRadius*projectionMatrix[1][1]*uHalfHeight/dist;
  gl_PointSize=clamp(rPx*9.,24.*uPixelRatio,110.*uPixelRatio);
  vAlpha=1.-smoothstep(5.*uPixelRatio,18.*uPixelRatio,rPx);
  vColor=aColor;
  if(vAlpha<.01||mv.z>0.) gl_Position=vec4(2.,2.,2.,1.);
}
`;

const fragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 c=gl_PointCoord-.5;
  float d=length(c)*2.;
  float core=exp(-d*d*30.);
  float glow=exp(-d*4.2)*.32;
  float spikes=(exp(-abs(c.x)*70.)*exp(-abs(c.y)*5.5)+exp(-abs(c.y)*70.)*exp(-abs(c.x)*5.5))*.42;
  float a=(core*1.5+glow+spikes)*(1.-smoothstep(.82,1.,d));
  gl_FragColor=vec4(vColor*a*vAlpha,1.);
}
`;

export function Beacons() {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const res = useMemo(() => {
    const positions = new Float32Array(starOrder.length * 3);
    const radii = new Float32Array(starOrder.length);
    const colors = new Float32Array(starOrder.length * 3);
    starOrder.forEach((id, i) => {
      const s = stars[id];
      positions.set([s.position.x, s.position.y, s.position.z], i * 3);
      radii[i] = s.radius;
      const c = new Color(starGlowColors[id]).multiplyScalar(1.5);
      colors.set([c.r, c.g, c.b], i * 3);
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    geometry.setAttribute('aRadius', new BufferAttribute(radii, 1));
    geometry.setAttribute('aColor', new BufferAttribute(colors, 3));
    const material = new ShaderMaterial({
      uniforms: { uHalfHeight: { value: 1 }, uPixelRatio: { value: 1 } },
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    const points = new Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 6;
    points.raycast = () => {};
    return { geometry, material, points };
  }, []);
  useEffect(() => () => { res.geometry.dispose(); res.material.dispose(); }, [res]);
  useFrame(() => {
    res.material.uniforms.uHalfHeight.value = (size.height * dpr) / 2;
    res.material.uniforms.uPixelRatio.value = dpr;
  });
  return <primitive object={res.points} dispose={null} />;
}
