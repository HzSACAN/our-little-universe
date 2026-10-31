import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Float32BufferAttribute,
  HalfFloatType,
  Mesh,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
} from 'three';
import { buildNebula } from './nebulaLayout';
import { noiseTexture, textureNoise } from './noiseTexture';
import type { SceneBridge } from './bridge';

// Her parçacık kameraya dönük yumuşak bir hacim kesitidir. Gürültü, parçacığın
// düzlemindeki dünya konumundan örneklenir; bu yüzden kamera dönerken desen
// "kart" gibi dönmez, hacmin içinden farklı bir kesit görünür.

const vertexShader = /* glsl */ `
attribute vec3 aCenter;
attribute float aSize;
attribute vec3 aCore;
attribute vec3 aEdge;
attribute vec4 aParams;
attribute vec3 aTangent;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vCore;
varying vec3 vEdge;
varying float vIntensity;
varying float vSeed;
varying float vScale;
void main(){
  vec3 camRight=vec3(viewMatrix[0][0],viewMatrix[1][0],viewMatrix[2][0]);
  vec3 camUp=vec3(viewMatrix[0][1],viewMatrix[1][1],viewMatrix[2][1]);
  vec3 toCam=normalize(cameraPosition-aCenter);
  // Damar yönünü kameraya dik düzleme yansıt; parçacık bu eksende uzar.
  vec3 axis=aTangent-dot(aTangent,toCam)*toCam;
  float axisLen=length(axis);
  axis=axisLen>1e-3?axis/axisLen:camRight;
  vec3 side=normalize(cross(toCam,axis));
  float stretch=mix(1.,aParams.z,clamp(axisLen,0.,1.));
  vec3 world=aCenter+(axis*position.x*stretch+side*position.y)*aSize;
  vUv=position.xy;
  vWorld=world;
  vCore=aCore;
  vEdge=aEdge;
  vSeed=aParams.y;
  vScale=aSize;
  float dist=distance(cameraPosition,aCenter);
  // Kamera parçacığa girerken yumuşakça kaybolur: sis duvarı veya düzlem kenarı görünmez.
  float nearFade=smoothstep(aSize*.3,aSize*1.25,dist);
  vIntensity=aParams.x*nearFade;
  gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);
  if(vIntensity<.002) gl_Position=vec4(2.,2.,2.,1.);
}
`;

const fragmentShader = (octaves: number) => /* glsl */ `
uniform float uTime;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vCore;
varying vec3 vEdge;
varying float vIntensity;
varying float vSeed;
varying float vScale;
${textureNoise(octaves)}
void main(){
  float r=length(vUv);
  // Dış halka neredeyse hiç katkı vermez; gürültü hesaplanmadan atılır.
  if(r>.86) discard;
  float falloff=1.-smoothstep(.0,.9,r);
  falloff*=falloff;
  vec3 p=vWorld/(vScale*.85)+vec3(vSeed,vSeed*.37,-vSeed*.71);
  p+=vec3(uTime*.012,-uTime*.008,uTime*.006);
  float warp=tnoise(p*.55)*1.5;
  vec3 q=p+vec3(warp*.9,warp*.4,-warp*.6);
  float n=tfbm(q)*.5+.5;
  // Geniş gaz gövdesi + ince, parlak kıvrım damarları; aralarda koyu boşluk kalır.
  float body=smoothstep(.47,.88,n+falloff*.12);
  float ridge=1.-abs(tnoise(q*.95+vec3(3.7))*1.5);
  float veins=pow(ridge,5.)*smoothstep(.36,.72,n);
  float density=(body*.66+veins*.75)*falloff;
  vec3 col=mix(vEdge,vCore,smoothstep(.45,.92,n));
  col=mix(col,vCore*1.25,veins*.6);
  // Yoğun bölgelerde sıcak, beyaza yakın çekirdek; geniş alanlar beyaza patlamaz.
  col+=vec3(.9,.95,1.)*pow(density,4.)*.5;
  gl_FragColor=vec4(col*density*vIntensity,1.);
}
`;

const compositeVertex = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv=position.xy*.5+.5;
  gl_Position=vec4(position.xy,0.,1.);
}
`;

const compositeFragment = /* glsl */ `
uniform sampler2D uMap;
varying vec2 vUv;
void main(){
  gl_FragColor=vec4(texture2D(uMap,vUv).rgb,1.);
}
`;

interface NebulaProps {
  share: number;
  octaves: number;
  /** Bulutsunun çizildiği ara hedefin ekran çözünürlüğüne oranı. */
  resolution: number;
  bridge: SceneBridge;
}

/**
 * Bulutsu yumuşak olduğundan düşük çözünürlüklü ayrı bir hedefe çizilir ve
 * sahneye, anı yıldızlarından önce eklenir. Saydam katman maliyeti böylece
 * ekran çözünürlüğünden bağımsızlaşır.
 */
export function Nebula({ share, octaves, resolution, bridge }: NebulaProps) {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const res = useMemo(() => {
    const data = buildNebula(share);
    const geo = new InstancedBufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('aCenter', new InstancedBufferAttribute(data.centers, 3));
    geo.setAttribute('aSize', new InstancedBufferAttribute(data.sizes, 1));
    geo.setAttribute('aCore', new InstancedBufferAttribute(data.cores, 3));
    geo.setAttribute('aEdge', new InstancedBufferAttribute(data.edges, 3));
    geo.setAttribute('aParams', new InstancedBufferAttribute(data.params, 4));
    geo.setAttribute('aTangent', new InstancedBufferAttribute(data.tangents, 3));
    geo.instanceCount = data.count;
    const mat = new ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uNoise: { value: noiseTexture() } },
      vertexShader,
      fragmentShader: fragmentShader(octaves),
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });
    const puffs = new Mesh(geo, mat);
    puffs.frustumCulled = false;
    const offscreen = new Scene();
    offscreen.add(puffs);
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false });
    const quad = new PlaneGeometry(2, 2);
    const composite = new ShaderMaterial({
      uniforms: { uMap: { value: target.texture } },
      vertexShader: compositeVertex,
      fragmentShader: compositeFragment,
      // Opak listede çizilir ki anı yıldızlarından önce gelsin; karışım yine toplamsal.
      transparent: false,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { geo, mat, offscreen, target, quad, composite };
  }, [share, octaves]);

  useEffect(() => {
    res.target.setSize(
      Math.max(1, Math.round(size.width * dpr * resolution)),
      Math.max(1, Math.round(size.height * dpr * resolution)),
    );
  }, [res, size.width, size.height, dpr, resolution]);

  useEffect(
    () => () => {
      res.geo.dispose();
      res.mat.dispose();
      res.target.dispose();
      res.quad.dispose();
      res.composite.dispose();
    },
    [res],
  );

  useFrame(({ camera }, delta) => {
    if (!bridge.reducedMotion) res.mat.uniforms.uTime.value += Math.min(delta, 0.05);
    const previous = gl.getRenderTarget();
    const autoClear = gl.autoClear;
    gl.setRenderTarget(res.target);
    gl.setClearColor(0x000000, 1);
    gl.clear(true, false, false);
    gl.autoClear = false;
    gl.render(res.offscreen, camera);
    gl.autoClear = autoClear;
    gl.setRenderTarget(previous);
    gl.setClearColor(0x040616, 1);
  });

  return <mesh geometry={res.quad} material={res.composite} frustumCulled={false} renderOrder={-5} />;
}
