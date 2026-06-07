import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';
import { momentsVertexShader, momentsFragmentShader } from '../shaders/sphere';

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

export function MomentPoints() {
  const pointsRef = useRef<THREE.Points>(null);

  const data = useStore((s) => s.data);
  const momentRelevanceMap = useStore((s) => s.momentRelevanceMap);
  const drilledMeeting = useStore((s) => s.drilledMeeting);

  const meetings = data?.meetings ?? [];

  const { positions, colors, sizes, relevances, momentIds, totalCount } = useMemo(() => {
    let total = 0;
    for (const m of meetings) total += m.moments.length;

    const pos = new Float32Array(total * 3);
    const col = new Float32Array(total * 3);
    const sz = new Float32Array(total);
    const rel = new Float32Array(total);
    const ids: string[] = [];

    let idx = 0;
    for (const meeting of meetings) {
      const c = CLUSTER_COLORS[meeting.cluster] || [0.5, 0.5, 0.5];
      for (const moment of meeting.moments) {
        // World pos = meeting pos + moment local pos
        pos[idx * 3] = meeting.position[0] + moment.localPos[0];
        pos[idx * 3 + 1] = meeting.position[1] + moment.localPos[1];
        pos[idx * 3 + 2] = meeting.position[2] + moment.localPos[2];

        col[idx * 3] = c[0] * 0.7;
        col[idx * 3 + 1] = c[1] * 0.7;
        col[idx * 3 + 2] = c[2] * 0.7;

        sz[idx] = 2.0 + Math.random() * 2.0;
        rel[idx] = 0;
        ids.push(moment.id);
        idx++;
      }
    }

    return {
      positions: pos,
      colors: col,
      sizes: sz,
      relevances: rel,
      momentIds: ids,
      totalCount: total,
    };
  }, [meetings]);

  const uniformsRef = useRef({ uTime: { value: 0 } });

  useFrame((state, delta) => {
    if (!pointsRef.current || totalCount === 0) return;

    uniformsRef.current.uTime.value = state.clock.elapsedTime;

    const geom = pointsRef.current.geometry;
    const relAttr = geom.getAttribute('aRelevance') as THREE.BufferAttribute;
    const posAttr = geom.getAttribute('position') as THREE.BufferAttribute;
    const arr = relAttr.array as Float32Array;
    const posArr = posAttr.array as Float32Array;

    let needsRelUpdate = false;
    let needsPosUpdate = false;
    let idx = 0;

    for (const meeting of meetings) {
      const isDrilled = drilledMeeting?.id === meeting.id;

      for (const moment of meeting.moments) {
        // Target relevance
        let targetRel = momentRelevanceMap.get(moment.id) ?? 0;

        // If drilling into a meeting, show its moments expanded
        if (drilledMeeting) {
          if (isDrilled) {
            targetRel = Math.max(targetRel, 0.5);
            // Expand moment positions when drilled
            const scale = 3.0;
            const targetX = meeting.position[0] + moment.localPos[0] * scale;
            const targetY = meeting.position[1] + moment.localPos[1] * scale;
            const targetZ = meeting.position[2] + moment.localPos[2] * scale;

            const speed = 3;
            const cx = posArr[idx * 3];
            const cy = posArr[idx * 3 + 1];
            const cz = posArr[idx * 3 + 2];
            posArr[idx * 3] = cx + (targetX - cx) * Math.min(1, delta * speed);
            posArr[idx * 3 + 1] = cy + (targetY - cy) * Math.min(1, delta * speed);
            posArr[idx * 3 + 2] = cz + (targetZ - cz) * Math.min(1, delta * speed);
            needsPosUpdate = true;
          } else {
            targetRel = 0.02;
          }
        } else {
          // Reset to world position
          const targetX = meeting.position[0] + moment.localPos[0];
          const targetY = meeting.position[1] + moment.localPos[1];
          const targetZ = meeting.position[2] + moment.localPos[2];

          const cx = posArr[idx * 3];
          const speed = 3;
          if (Math.abs(targetX - cx) > 0.01) {
            posArr[idx * 3] = cx + (targetX - cx) * Math.min(1, delta * speed);
            posArr[idx * 3 + 1] = posArr[idx * 3 + 1] + (targetY - posArr[idx * 3 + 1]) * Math.min(1, delta * speed);
            posArr[idx * 3 + 2] = posArr[idx * 3 + 2] + (targetZ - posArr[idx * 3 + 2]) * Math.min(1, delta * speed);
            needsPosUpdate = true;
          }
        }

        // Smooth relevance
        const current = arr[idx];
        const newVal = current + (targetRel - current) * Math.min(1, delta * 4);
        if (Math.abs(newVal - current) > 0.001) {
          arr[idx] = newVal;
          needsRelUpdate = true;
        }

        idx++;
      }
    }

    if (needsRelUpdate) relAttr.needsUpdate = true;
    if (needsPosUpdate) posAttr.needsUpdate = true;
  });

  if (totalCount === 0) return null;

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={totalCount}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRelevance"
          array={relevances}
          count={totalCount}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aColor"
          array={colors}
          count={totalCount}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          array={sizes}
          count={totalCount}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={momentsVertexShader}
        fragmentShader={momentsFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniformsRef.current}
      />
    </points>
  );
}
