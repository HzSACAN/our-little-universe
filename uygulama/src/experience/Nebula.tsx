import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AddEquation,
  CustomBlending,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Float32BufferAttribute,
  HalfFloatType,
  Mesh,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  OneFactor,
  OneMinusSrcAlphaFactor,
  Vector2,
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
varying float vField;
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
  vField=aParams.w;
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
varying float vField;
${textureNoise(octaves)}
void main(){
  float r=length(vUv);
  if(r>.94) discard;
  // Parçacık yalnızca gaz alanının görünür olduğu bölgeyi belirler (maske);
  // desenin kendisi damar boyunca ortak, dünyaya bağlı bir hacimden gelir.
  float mask=1.-smoothstep(.3,.94,r);
  vec3 p=vWorld/vField+vec3(vSeed,vSeed*.37,-vSeed*.71);
  p+=vec3(uTime*.010,-uTime*.007,uTime*.005);
  // Büyük ölçekli kapsama: damarın içinde de geniş, düzensiz koyu boşluklar açılır.
  // Ucuz tek örnek; boş bölgede pahalı ayrıntı hiç hesaplanmaz.
  vec4 macro=tnoise4(p*.3+vec3(7.3,1.1,3.9));
  float cover=smoothstep(-.12,.42,macro.r);
  if(cover*mask<.015) discard;
  // Alan bükümü: düz bulutlar yerine kıvrımlı, akışkan yapılar.
  vec3 q=p+tnoise4(p*.6+vec3(1.7,9.2,3.1)).xyz*1.1;
  float n=tfbm(q)*.5+.5;
  // Büyük şeklin içindeki ışıyan çekirdek: geniş, yumuşak ama yalnız yoğun bölgelerde.
  float broad=smoothstep(.05,.65,macro.g)*cover*cover;
  // Düzensiz koyu boşluklar: alan zayıfsa bu kesit hiç katkı vermez.
  if(n<.34&&broad<.04) discard;
  // Geniş gaz gövdesi, içinde orta ölçekli kümeler.
  float body=smoothstep(.5,.84,n);
  // İnce, kıvrımlı ve keskin ışıklı filamentler: iki ölçekte sırt gürültüsü.
  vec4 mid=tnoise4(q*1.7+vec3(3.7,-1.2,.4));
  float ridgeA=1.-abs(mid.r);
  float ridgeB=1.-abs(tnoise(q*3.4+vec3(-2.1,4.4,.3)));
  float fil=(pow(ridgeA,10.)*.9+pow(ridgeB,16.)*.4)*smoothstep(.4,.68,n);
  // Koyu toz şeritleri: ayrı bir sırt alanı gazı keser ve arkadaki gökyüzünü karartır.
  float dustRidge=1.-abs(mid.g);
  float dust=smoothstep(.86,.975,dustRidge)*smoothstep(.42,.64,n);
  // Gövdenin yoğun bölgeleri daha parlak: büyük şeklin içinde ışıyan çekirdekler.
  float emission=((body*.6+body*body*1.1+fil*1.3)*cover+broad*.75*smoothstep(.22,.6,n))*(1.-dust*.85)*mask*1.45;
  vec3 col=mix(vEdge,vCore,smoothstep(.52,.86,n));
  // Filamentler çekirdek renginin daha açık, ama beyaz olmayan tonu.
  col=mix(col,vCore*1.2+vec3(.06),clamp(fil*.7,0.,1.));
  col=mix(col,vCore,broad*.35);
  gl_FragColor=vec4(col*emission*vIntensity,dust*mask*cover*vIntensity*2.6);
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
uniform vec2 uTexel;
uniform float uSharpen;
varying vec2 vUv;
void main(){
  vec4 c=texture2D(uMap,vUv);
  // Düşük çözünürlüklü ara hedeften büyütmenin yumuşattığı ayrıntıyı geri kazanmak
  // için hafif keskinleştirme (dört komşu örnek).
  vec4 blur=(texture2D(uMap,vUv+vec2(uTexel.x,0.))+texture2D(uMap,vUv-vec2(uTexel.x,0.))
    +texture2D(uMap,vUv+vec2(0.,uTexel.y))+texture2D(uMap,vUv-vec2(0.,uTexel.y)))*.25;
  c=max(c+(c-blur)*uSharpen,0.);
  float absorb=1.-exp(-c.a*1.4);
  vec3 e=c.rgb*(1.-absorb*.5);
  // Renk korumalı yumuşak sıkıştırma: yoğun bölgeler beyaza patlamaz ve bloom
  // eşiğinin altında kalır; bulutsu ayrıntısı ışıma altında kaybolmaz.
  float m=max(max(e.r,e.g),e.b);
  float k=.9*(1.-exp(-m/.9));
  e*=k/max(m,1e-4);
  float l=dot(e,vec3(.2126,.7152,.0722));
  e=max(mix(vec3(l),e,1.12),0.);
  gl_FragColor=vec4(e,absorb);
}
`;

interface NebulaProps {
  share: number;
  octaves: number;
  /** Bulutsunun çizildiği ara hedefin ekran çözünürlüğüne oranı. */
  resolution: number;
  /** Büyütmede kaybolan ayrıntıyı geri kazanan keskinleştirme miktarı. */
  sharpen: number;
  bridge: SceneBridge;
}

/**
 * Bulutsu yumuşak olduğundan düşük çözünürlüklü ayrı bir hedefe çizilir ve
 * sahneye, anı yıldızlarından önce eklenir. Saydam katman maliyeti böylece
 * ekran çözünürlüğünden bağımsızlaşır.
 */
export function Nebula({ share, octaves, resolution, sharpen, bridge }: NebulaProps) {
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
      // Renk ışık olarak, alfa toz yoğunluğu olarak toplanır.
      blending: CustomBlending,
      blendEquation: AddEquation,
      blendSrc: OneFactor,
      blendDst: OneFactor,
      blendSrcAlpha: OneFactor,
      blendDstAlpha: OneFactor,
    });
    const puffs = new Mesh(geo, mat);
    puffs.frustumCulled = false;
    const offscreen = new Scene();
    offscreen.add(puffs);
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false });
    const quad = new PlaneGeometry(2, 2);
    const composite = new ShaderMaterial({
      uniforms: { uMap: { value: target.texture }, uTexel: { value: new Vector2(1, 1) }, uSharpen: { value: 0 } },
      vertexShader: compositeVertex,
      fragmentShader: compositeFragment,
      // Opak listede çizilir ki anı yıldızlarından önce gelsin. Işık eklenir, toz
      // arkadaki gökyüzünü karartır: sonuç = bulutsu + gökyüzü × (1 − toz).
      transparent: false,
      depthTest: false,
      depthWrite: false,
      blending: CustomBlending,
      blendEquation: AddEquation,
      blendSrc: OneFactor,
      blendDst: OneMinusSrcAlphaFactor,
    });
    return { geo, mat, offscreen, target, quad, composite };
  }, [share, octaves]);

  useEffect(() => {
    const w = Math.max(1, Math.round(size.width * dpr * resolution));
    const h = Math.max(1, Math.round(size.height * dpr * resolution));
    res.target.setSize(w, h);
    res.composite.uniforms.uTexel.value.set(1 / w, 1 / h);
    res.composite.uniforms.uSharpen.value = sharpen;
  }, [res, size.width, size.height, dpr, resolution, sharpen]);

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
    gl.setClearColor(0x000000, 0);
    gl.clear(true, false, false);
    gl.autoClear = false;
    gl.render(res.offscreen, camera);
    gl.autoClear = autoClear;
    gl.setRenderTarget(previous);
    gl.setClearColor(0x040616, 1);
  });

  return <mesh geometry={res.quad} material={res.composite} frustumCulled={false} renderOrder={-5} />;
}
