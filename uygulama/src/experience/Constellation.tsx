import { useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, BufferAttribute, BufferGeometry, CatmullRomCurve3, Line, ShaderMaterial, Vector3 } from 'three';
import { discoveredEdges, isComplete, type StarId } from '../content/memories';
import { stars } from './world';
import type { SceneBridge } from './bridge';

export function Constellation({ visited, bridge }: { visited: StarId[]; bridge: SceneBridge }) {
  const complete = isComplete(visited);
  // Önceki kenarlar ziyaret eklendiğinde yeniden kurulmaz ve yeniden çizilmez.
  return <group>{discoveredEdges(visited).map(([a, b]) =>
    <Connection key={`${a}-${b}`} from={a} to={b} complete={complete} bridge={bridge} />,
  )}</group>;
}

function Connection({ from, to, complete, bridge }: { from: StarId; to: StarId; complete: boolean; bridge: SceneBridge }) {
  const res = useMemo(() => {
    const a = stars[from].position, b = stars[to].position;
    const midpoint = new Vector3().lerpVectors(a, b, 0.5);
    midpoint.y += a.distanceTo(b) * 0.025;
    const points = new CatmullRomCurve3([a, midpoint, b]).getPoints(80);
    const geometry = new BufferGeometry().setFromPoints(points);
    geometry.setAttribute('aProgress', new BufferAttribute(Float32Array.from(points.map((_, i) => i / (points.length - 1))), 1));
    const material = new ShaderMaterial({
      uniforms: { uReveal: { value: bridge.reducedMotion ? 1 : 0 }, uComplete: { value: 0 } },
      vertexShader: `attribute float aProgress; varying float vProgress;
        void main(){vProgress=aProgress;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying float vProgress; uniform float uReveal; uniform float uComplete;
        void main(){if(vProgress>uReveal)discard;
          float head=1.-smoothstep(0.,.065,abs(vProgress-uReveal));
          gl_FragColor=vec4(mix(vec3(.48,.39,.24),vec3(.85,.72,.47),uComplete)*(1.+head*.7),.45);}`,
      transparent: true, depthWrite: false, blending: AdditiveBlending,
    });
    const line = new Line(geometry, material);
    line.raycast = () => {};
    return { geometry, material, line };
  }, [from, to]);
  useEffect(() => () => { res.geometry.dispose(); res.material.dispose(); }, [res]);
  useFrame((_, delta) => {
    res.material.uniforms.uReveal.value = bridge.reducedMotion ? 1 : Math.min(1, res.material.uniforms.uReveal.value + Math.min(delta, 0.05) / 1.1);
    res.material.uniforms.uComplete.value = complete ? 1 : 0;
  });
  return <primitive object={res.line} dispose={null} />;
}
