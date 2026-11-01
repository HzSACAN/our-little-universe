import { useEffect, useMemo } from 'react';
import { BackSide, ShaderMaterial, SphereGeometry, Texture, TextureLoader, SRGBColorSpace } from 'three';
import { HOME_EYE } from './world';

// A world-space distant shell, not a screen-fixed wallpaper. Camera translation
// changes its perspective; nearer gas and stars move by greater amounts.
const vertexShader = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir=position;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
}
`;
const fragmentShader = /* glsl */ `
uniform sampler2D uGalaxy;
uniform float uReady;
varying vec3 vDir;
void main(){
  vec3 d=normalize(vDir);
  float longitude=atan(d.x,-d.z);
  float latitude=asin(clamp(d.y,-1.,1.));
  // Forward art occupies a 103-degree arc: preserve fine detail at the opening.
  // Soft borders join the original artwork to a quiet, continuous dark sky.
  vec2 uv=vec2(.64+longitude/1.8,.53+latitude/1.12);
  vec2 bounded=clamp(uv,0.,1.);
  float edge=smoothstep(0.,.1,bounded.x)*smoothstep(0.,.1,1.-bounded.x)
            *smoothstep(0.,.14,bounded.y)*smoothstep(0.,.14,1.-bounded.y);
  float atmosphere=pow(max(0.,1.-abs(d.y+.2)),3.);
  vec3 base=mix(vec3(.006,.01,.035),vec3(.014,.027,.09),atmosphere);
  vec3 art=texture2D(uGalaxy,bounded).rgb;
  // Lift shadows and midtones rather than overexposing the luminous gas rims.
  art=pow(max(art,vec3(0.)),vec3(.78))*1.05+vec3(.004,.008,.023);
  gl_FragColor=vec4(mix(base,art,edge*uReady),1.);
}
`;

export function Sky() {
  const resources = useMemo(() => ({
    geometry: new SphereGeometry(6800, 96, 64),
    material: new ShaderMaterial({
      uniforms: { uGalaxy: { value: null as Texture | null }, uReady: { value: 0 } },
      vertexShader, fragmentShader, side: BackSide, depthWrite: false, depthTest: false,
    }),
  }), []);
  useEffect(() => {
    let disposed = false;
    const texture = new TextureLoader().load(`${import.meta.env.BASE_URL}assets/nebula/galaxy-panorama.png`, (loaded) => {
      if (disposed) { loaded.dispose(); return; }
      loaded.colorSpace = SRGBColorSpace;
      resources.material.uniforms.uGalaxy.value = loaded;
      resources.material.uniforms.uReady.value = 1;
    }, undefined, () => console.warn('Galaksi dokusu yüklenemedi; koyu gökyüzü kullanılıyor.'));
    return () => {
      disposed = true;
      texture.dispose();
      resources.material.dispose();
      resources.geometry.dispose();
    };
  }, [resources]);
  return <mesh position={HOME_EYE} geometry={resources.geometry} material={resources.material} renderOrder={-10} frustumCulled={false} />;
}
