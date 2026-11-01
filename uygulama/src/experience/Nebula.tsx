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
attribute float aGlow;
varying vec2 vUv;
varying vec3 vWorld;
varying vec3 vCore;
varying vec3 vEdge;
varying float vIntensity;
varying float vSeed;
varying float vScale;
varying float vField;
varying float vGlow;
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
  vGlow=aGlow;
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
varying float vGlow;
${textureNoise(octaves)}
void main(){
  float r=length(vUv);
  if(r>.9) discard;
  // Parçacık, gaz alanının görünür olduğu yumuşak bir hacim kesitidir (maske);
  // desenin kendisi damar boyunca ortak, dünyaya bağlı bir alandan gelir.
  float mask=smoothstep(.94,.08,r);
  vec3 p=vWorld/vField+vec3(vSeed,vSeed*.37,-vSeed*.71);
  p+=vec3(uTime*.010,-uTime*.007,uTime*.005);
  // Tek örnekte dört geniş ölçekli alan: kapsama (r), yoğunlaşma (g), renk bölgesi (b), toz (a).
  vec4 macro=tnoise4(p*.28+vec3(7.3,1.1,3.9));
  // Kapsama yumuşak: boşluklar keskin yarık değil, gazın incelip koyulaştığı bölgeler.
  float cover=smoothstep(-.5,.55,macro.r);
  // Katkısı görünmeyecek kadar küçük kesitlerde pahalı gürültü hiç hesaplanmaz.
  if(cover*mask*vIntensity<.012) discard;
  // Hafif alan bükümü: kıvrım değil, akışkan ve bütünlüklü gövdeler.
  vec3 q=p+tnoise4(p*.45+vec3(1.7,9.2,3.1)).xyz*.65;
  float n=tfbm(q)*.5+.5;
  // 1) Geniş gövde: düşük eşik, yarı saydam; orta ölçekli doku fbm'den gelir.
  float body=smoothstep(.34,.84,n);
  // 2) Yoğunlaşma: geniş gövdenin içinde yalnız seçili bölgelerde ışıyan çekirdek.
  float dense=smoothstep(.15,.7,macro.g)*vGlow;
  float knot=dense*smoothstep(.56,.84,n);
  // 3) İnce ayrıntı: yalnız gövdenin parlak kenar bandında ve yoğunlaşma noktalarında,
  // yüksek frekanslı ve çok ince; görüntünün geri kalanı yumuşak kalır.
  float rim=smoothstep(.54,.64,n)*(1.-smoothstep(.68,.84,n));
  float ridge=1.-abs(tnoise(q*3.8+vec3(-2.1,4.4,.3)));
  float fil=pow(ridge,18.)*rim*dense;
  // Yumuşak toz: düşük frekanslı, gazın içinde koyulaşan bölgeler; çekirdekleri örtmez.
  float dust=smoothstep(.1,.75,macro.a)*smoothstep(.4,.72,n)*(1.-knot)*.6;
  float emission=(body*.36+body*body*.7+knot*1.4+fil*1.2)*cover*mask*(1.-dust*.55);
  // Renk: kenar rengi (çoğunlukla mavi/lacivert) her yerde; vurgu rengi yalnız
  // yoğun kısımlarda ve bölgesel bir alanda öne çıkar.
  // Güçlü yoğunlaşmalı damarlarda (ör. ana turkuaz-yeşil gövde) vurgu rengi daha sürekli.
  float accent=clamp(smoothstep(-.25,.45,macro.b)+vGlow*.45-.3,0.,1.);
  vec3 col=mix(vEdge,vCore,smoothstep(.46,.84,n)*mix(.2,1.,accent));
  // Çekirdek ve ince kenarlar çekirdek renginin açık, beyaza yaklaşan tonu.
  col=mix(col,mix(vCore,vec3(.95,.97,1.),.4),clamp(knot*.55+fil*.6,0.,1.));
  gl_FragColor=vec4(col*emission*vIntensity*1.85,dust*mask*cover*vIntensity*1.1);
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
  // Büyütmenin yumuşattığı ayrıntı yalnız parlak bölgelerde geri kazanılır (dört komşu
  // örnek); geniş, sönük gaz gövdesi yumuşak kalır.
  vec4 blur=(texture2D(uMap,vUv+vec2(uTexel.x,0.))+texture2D(uMap,vUv-vec2(uTexel.x,0.))
    +texture2D(uMap,vUv+vec2(0.,uTexel.y))+texture2D(uMap,vUv-vec2(0.,uTexel.y)))*.25;
  float lit=smoothstep(.12,.45,max(max(c.r,c.g),c.b));
  c=max(c+(c-blur)*uSharpen*lit,0.);
  float absorb=1.-exp(-c.a*1.2);
  vec3 e=c.rgb*(1.-absorb*.35);
  // Renk korumalı yumuşak sıkıştırma: yoğun bölgeler beyaza patlamaz ve bloom
  // eşiğinin altında kalır; bulutsu ayrıntısı ışıma altında kaybolmaz.
  float m=max(max(e.r,e.g),e.b);
  float k=.9*(1.-exp(-m/.9));
  e*=k/max(m,1e-4);
  gl_FragColor=vec4(e,absorb*.8);
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
    geo.setAttribute('aGlow', new InstancedBufferAttribute(data.glows, 1));
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
