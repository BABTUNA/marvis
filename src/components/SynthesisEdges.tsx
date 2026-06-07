import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import { useStore } from '../store';

export function SynthesisEdges() {
  const data = useStore((s) => s.data);
  const synthesisEdges = useStore((s) => s.synthesisEdges);
  const synthesisCentroid = useStore((s) => s.synthesisCentroid);

  const centroidRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const opacityRef = useRef(0);

  const meetings = data?.meetings ?? [];
  const meetingMap = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    for (const m of meetings) {
      map.set(m.id, m.position);
    }
    return map;
  }, [meetings]);

  const edges = useMemo(() => {
    if (!synthesisEdges.length || !synthesisCentroid) return [];

    const meetingIds = new Set<string>();
    for (const [a, b] of synthesisEdges) {
      meetingIds.add(a);
      meetingIds.add(b);
    }

    return Array.from(meetingIds)
      .map((id) => {
        const pos = meetingMap.get(id);
        if (!pos) return null;
        return { from: pos, to: synthesisCentroid, id };
      })
      .filter(Boolean) as { from: [number, number, number]; to: [number, number, number]; id: string }[];
  }, [synthesisEdges, synthesisCentroid, meetingMap]);

  useFrame((state, delta) => {
    const hasEdges = edges.length > 0;
    const targetOpacity = hasEdges ? 1 : 0;
    opacityRef.current += (targetOpacity - opacityRef.current) * Math.min(1, delta * 3);

    if (centroidRef.current) {
      centroidRef.current.visible = hasEdges && opacityRef.current > 0.01;
      if (centroidRef.current.visible) {
        const scale = 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.04;
        centroidRef.current.scale.setScalar(scale);
        const mat = centroidRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = opacityRef.current * 0.8;
      }
    }
  });

  if (edges.length === 0 && opacityRef.current < 0.01) return null;

  return (
    <group ref={groupRef}>
      {edges.map((edge) => (
        <Line
          key={edge.id}
          points={[edge.from, edge.to]}
          color="#ffd799"
          lineWidth={1.5}
          transparent
          opacity={opacityRef.current * 0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      ))}

      {synthesisCentroid && (
        <mesh ref={centroidRef} position={synthesisCentroid} visible={false}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial
            color="#ffd799"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}
