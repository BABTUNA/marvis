import { useRef, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import {
  sphereVertexShader,
  sphereFragmentShader,
} from '../shaders/sphere';

const CLUSTER_COLORS: Record<string, [number, number, number]> = {
  'acme-renewal': [0.3, 0.6, 1.0],
  'acme-support': [0.4, 0.5, 0.9],
  'globex-deal': [0.2, 0.9, 0.6],
  'internal-product': [0.9, 0.4, 0.3],
  'internal-hiring': [0.8, 0.6, 0.2],
  'vertexai-expansion': [0.5, 0.8, 0.9],
  'competitor-intel': [0.9, 0.3, 0.5],
  'zenith-churn': [1.0, 0.5, 0.2],
  'partnerships': [0.6, 0.4, 0.9],
  'board-investors': [0.9, 0.8, 0.3],
};

const tempObject = new THREE.Object3D();
const tempColor = new THREE.Color();

export function MeetingSpheres() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const data = useStore((s) => s.data);
  const relevanceMap = useStore((s) => s.relevanceMap);
  const drilledMeeting = useStore((s) => s.drilledMeeting);
  const drillInto = useStore((s) => s.drillInto);

  const meetings = data?.meetings ?? [];
  const count = meetings.length;

  const { relevanceAttr, colorAttr } = useMemo(() => {
    const relevance = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const meeting = meetings[i];
      const c = CLUSTER_COLORS[meeting.cluster] || [0.5, 0.5, 0.5];
      colors[i * 3] = c[0];
      colors[i * 3 + 1] = c[1];
      colors[i * 3 + 2] = c[2];
      relevance[i] = 0;
    }

    return {
      relevanceAttr: relevance,
      colorAttr: colors,
    };
  }, [count, meetings]);

  // Animate relevance values smoothly
  const targetRelevance = useRef(new Float32Array(count));

  useFrame((_, delta) => {
    if (!meshRef.current || count === 0) return;

    // Update target relevance
    for (let i = 0; i < count; i++) {
      const meeting = meetings[i];
      const rel = relevanceMap.get(meeting.id) ?? 0;
      targetRelevance.current[i] = drilledMeeting ? (drilledMeeting.id === meeting.id ? 1 : 0.05) : rel;
    }

    // Smooth transition
    const geom = meshRef.current.geometry;
    const relAttr = geom.getAttribute('aRelevance') as THREE.BufferAttribute;
    const arr = relAttr.array as Float32Array;

    let needsUpdate = false;
    for (let i = 0; i < count; i++) {
      const target = targetRelevance.current[i];
      const current = arr[i];
      const speed = 4;
      const newVal = current + (target - current) * Math.min(1, delta * speed);

      if (Math.abs(newVal - current) > 0.001) {
        arr[i] = newVal;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      relAttr.needsUpdate = true;
    }

    // Update instance matrices
    for (let i = 0; i < count; i++) {
      const m = meetings[i];
      const scale = 0.15 + arr[i] * 0.25;
      tempObject.position.set(m.position[0], m.position[1], m.position[2]);
      tempObject.scale.setScalar(scale);
      tempObject.updateMatrix();
      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const handleClick = useCallback(
    (e: any) => {
      e.stopPropagation();
      if (e.instanceId !== undefined && e.instanceId < meetings.length) {
        const meeting = meetings[e.instanceId];
        drillInto(drilledMeeting?.id === meeting.id ? null : meeting);
      }
    },
    [meetings, drilledMeeting, drillInto]
  );

  const shaderMaterial = useMemo(
    () => ({
      vertexShader: sphereVertexShader,
      fragmentShader: sphereFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
    }),
    []
  );

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      onClick={handleClick}
      frustumCulled={false}
    >
      <icosahedronGeometry args={[1, 3]}>
        <instancedBufferAttribute
          attach="attributes-aRelevance"
          args={[relevanceAttr, 1]}
        />
        <instancedBufferAttribute
          attach="attributes-aColor"
          args={[colorAttr, 3]}
        />
      </icosahedronGeometry>
      <shaderMaterial ref={materialRef} attach="material" {...shaderMaterial} />
    </instancedMesh>
  );
}
