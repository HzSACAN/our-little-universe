import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import {
  BackSide,
  CubeCamera,
  HalfFloatType,
  Mesh,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  WebGLCubeRenderTarget,
} from 'three';
import { fbm, simplexNoise3 } from './shaders/noise';

// En uzak katman: sonsuz uzaklıkta, düşük kontrastlı galaktik ışık. Uçuş hissi
// bu katmana dayanmaz; derinliği ve renk bölgelerini taşır.

const vertexShader = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir=normalize(position);
  vec4 mv=modelViewMatrix*vec4(position,1.);
  gl_Position=projectionMatrix*mv;
}
`;

const fragmentShader = (octaves: number) => /* glsl */ `
varying vec3 vDir;
${simplexNoise3}
${fbm(octaves)}
void main(){
  vec3 d=normalize(vDir);
  vec3 voidCol=vec3(.012,.016,.07);
  vec3 navy=vec3(.05,.06,.27);
  vec3 blue=vec3(.13,.22,.72);
  vec3 purple=vec3(.33,.13,.55);
  vec3 fuchsia=vec3(.6,.15,.38);
  vec3 teal=vec3(.1,.45,.5);
  // Eğik bir galaktik bant; içinde renk bölgeleri.
  float band=1.-abs(dot(d,normalize(vec3(.35,1.,.22))));
  band=pow(band,3.);
  float n=fbm(d*2.4)*.5+.5;
  float m=fbm(d*5.1+vec3(3.1))*.5+.5;
  vec3 col=mix(voidCol,navy,smoothstep(.25,.85,n)*.9);
  col=mix(col,blue,smoothstep(.55,.95,n)*band*.55);
  col=mix(col,purple,smoothstep(.5,.9,m)*(.25+band*.5));
  col+=fuchsia*smoothstep(.68,.95,m*n+band*.2)*.22*band;
  col+=teal*smoothstep(.62,.92,n)*smoothstep(.4,.8,1.-m)*.18;
  // Koyu toz damarları
  float dust=smoothstep(.45,.7,fbm(d*7.3+vec3(9.4))*.5+.5);
  col*=1.-dust*.45*band;
  gl_FragColor=vec4(col,1.);
}
`;

/**
 * Gökyüzü yönsel ve durağandır; açılışta bir kez küp dokuya pişirilir ve
 * sahne arka planı olarak kullanılır. Her frame tam ekran gürültü hesaplanmaz.
 */
export function Sky({ octaves }: { octaves: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    const geometry = new SphereGeometry(100, 64, 32);
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader: fragmentShader(octaves),
      side: BackSide,
      depthWrite: false,
      depthTest: false,
    });
    const bakeScene = new Scene();
    bakeScene.add(new Mesh(geometry, material));
    const target = new WebGLCubeRenderTarget(1024, { type: HalfFloatType, generateMipmaps: false });
    const cubeCamera = new CubeCamera(1, 1000, target);
    cubeCamera.update(gl, bakeScene);
    const previous = scene.background;
    scene.background = target.texture;
    geometry.dispose();
    material.dispose();
    return () => {
      if (scene.background === target.texture) scene.background = previous;
      target.dispose();
    };
  }, [gl, scene, octaves]);
  return null;
}
