import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AddEquation, CustomBlending, HalfFloatType, Matrix4, Mesh, OneFactor,
  OneMinusSrcAlphaFactor, PlaneGeometry, Scene, ShaderMaterial, Vector3,
  Vector4, WebGLRenderTarget,
} from 'three';
import type { SceneBridge } from './bridge';
import type { QualityTier } from './quality';
import { cloudCenters, cloudRadii, journeyClouds } from './journeyClouds';
import { noiseTexture } from './noiseTexture';
import { stars } from './world';

const vertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv=position.xy*.5+.5; gl_Position=vec4(position.xy,0.,1.); }
`;

const volumeFragment = (steps: number) => /* glsl */ `
uniform highp sampler3D uNoise;
uniform mat4 uInverseProjection;
uniform mat4 uCameraWorld;
uniform vec3 uEye;
uniform float uTime;
uniform vec4 uClouds[${journeyClouds.length}];
uniform vec3 uRadii[${journeyClouds.length}];
uniform vec4 uStars[7];
varying vec2 vUv;

float envelope(vec3 p){
  // Bands do not overlap in Z. Reject five empty bands before doing any
  // ellipsoid/noise work; this matters on integrated mobile/desktop GPUs.
  for(int i=0;i<${journeyClouds.length};i++){
    if(abs(p.z-uClouds[i].z)>uRadii[i].z) continue;
    vec3 q=(p-uClouds[i].xyz)/uRadii[i];
    return 1.-smoothstep(.28,1.,dot(q,q));
  }
  return 0.;
}
void main(){
  vec4 view=uInverseProjection*vec4(vUv*2.-1.,1.,1.);
  vec3 ray=normalize(mat3(uCameraWorld)*view.xyz);
  // Stop at the nearest opaque star surface: gas behind it must not veil it.
  float rayEnd=1600.;
  for(int j=0;j<7;j++){
    if(uStars[j].w<=0.) continue;
    vec3 oc=uEye-uStars[j].xyz;
    float b=dot(oc,ray);
    float h=b*b-dot(oc,oc)+uStars[j].w*uStars[j].w;
    if(h>0.){
      float hit=-b-sqrt(h);
      if(hit>0.) rayEnd=min(rayEnd,hit);
    }
  }
  const float stride=1600./float(${steps});
  vec3 light=vec3(0.);
  float transmittance=1.;
  for(int i=0;i<${steps};i++){
    float distanceAlongRay=4.+(float(i)+.5)*stride;
    if(distanceAlongRay>rayEnd) break;
    vec3 p=uEye+ray*distanceAlongRay;
    float shape=envelope(p);
    if(shape<.001) continue;
    // A genuine 3D field sampled along the ray, including samples immediately
    // around the camera. Entering a cloud does not make it disappear.
    // Drift is a small bounded sway around the authored field. A linear drift
    // slid new gas in front of every arrival framing after a few minutes.
    vec3 q=p/620.+vec3(sin(uTime*.07),sin(uTime*.05),0.)*.006;
    vec4 macro=texture(uNoise,q);
    float detail=texture(uNoise,q*2.71+vec3(.21,.47,.13)).r;
    float gas=smoothstep(.44,.67,macro.r)*smoothstep(.3,.67,detail);
    float density=shape*gas;
    // Clear the immediate star bodies: arrival surfaces remain legible.
    for(int j=0;j<7;j++) {
      if(uStars[j].w<=0.) continue;
      vec3 toStar=p-uStars[j].xyz;
      density*=smoothstep(pow(uStars[j].w+40.,2.),pow(uStars[j].w+140.,2.),dot(toStar,toStar));
    }
    float absorb=1.-exp(-density*stride*.0048);
    float warm=smoothstep(.39,.69,macro.b);
    vec3 color=mix(vec3(.065,.18,.4),vec3(.32,.09,.28),warm);
    color=mix(color,vec3(.15,.4,.42),smoothstep(.53,.73,macro.g));
    float rim=pow(max(0.,1.-abs(detail-.52)*5.),6.);
    color*=.65+rim*.95;
    light+=transmittance*absorb*color;
    transmittance*=1.-absorb;
    if(transmittance<.08) break;
  }
  gl_FragColor=vec4(light,1.-transmittance);
}
`;
const composite = /* glsl */ `
uniform sampler2D uVolume;
varying vec2 vUv;
void main(){ gl_FragColor=texture2D(uVolume,vUv); }
`;

export function JourneyNebula({ tier, bridge }: { tier: QualityTier; bridge: SceneBridge }) {
  const time = useRef(0);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const settings = tier === 'high' ? [28, .4, 480] : tier === 'medium' ? [22, .34, 384] : [16, .28, 288];
  const steps = settings[0];
  // Gas is soft; crisp filaments are drawn separately at full resolution.
  // Cap integration pixels so a desktop/Retina viewport cannot multiply cost.
  const scale = Math.min(settings[1], settings[2] / (Math.max(size.width, size.height) * dpr));
  const resources = useMemo(() => {
    const geometry = new PlaneGeometry(2, 2);
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthBuffer: false });
    const volume = new ShaderMaterial({
      vertexShader: vertex, fragmentShader: volumeFragment(steps), depthTest: false, depthWrite: false,
      uniforms: {
        uNoise: { value: noiseTexture() }, uTime: { value: 0 },
        uInverseProjection: { value: new Matrix4() }, uCameraWorld: { value: new Matrix4() },
        uEye: { value: new Vector3() }, uClouds: { value: cloudCenters }, uRadii: { value: cloudRadii },
        uStars: { value: [...Object.values(stars).map((s) => new Vector4(s.position.x, s.position.y, s.position.z, s.radius)), new Vector4(0, 0, 0, 0)] },
      },
    });
    const offscreen = new Scene();
    offscreen.add(new Mesh(geometry, volume));
    const material = new ShaderMaterial({
      vertexShader: vertex, fragmentShader: composite,
      uniforms: { uVolume: { value: target.texture } },
      transparent: true, depthTest: false, depthWrite: false,
      blending: CustomBlending, blendEquation: AddEquation, blendSrc: OneFactor, blendDst: OneMinusSrcAlphaFactor,
    });
    return { geometry, target, volume, offscreen, material };
  }, [steps]);
  useEffect(() => {
    resources.target.setSize(Math.max(1, Math.round(size.width*dpr*scale)), Math.max(1, Math.round(size.height*dpr*scale)));
  }, [resources, size.width, size.height, dpr, scale]);
  useEffect(() => () => {
    resources.geometry.dispose(); resources.target.dispose(); resources.volume.dispose(); resources.material.dispose();
  }, [resources]);
  useFrame(({ camera }, delta) => {
    const u = resources.volume.uniforms;
    u.uInverseProjection.value.copy(camera.projectionMatrixInverse);
    u.uCameraWorld.value.copy(camera.matrixWorld);
    u.uEye.value.copy(camera.position);
    const companion = bridge.companion;
    u.uStars.value[6].set(companion.x, companion.y, companion.z, companion.r);
    if (!bridge.reducedMotion) time.current += Math.min(delta, .05);
    u.uTime.value = time.current;
    const previous = gl.getRenderTarget();
    gl.setRenderTarget(resources.target);
    gl.render(resources.offscreen, camera);
    gl.setRenderTarget(previous);
  });
  // Absorption overlays distant stars as well as the sky, making entry visible.
  return <mesh geometry={resources.geometry} material={resources.material} frustumCulled={false} renderOrder={1000} />;
}
