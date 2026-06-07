import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function NebulaParticles() {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const count = 500;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const sz = new Float32Array(count);

    // Create wispy nebula clouds around the cluster regions
    const centers = [
      { pos: [8, 1, -2], color: [0.15, 0.25, 0.45], spread: 6 },
      { pos: [-6, 3, 4], color: [0.1, 0.35, 0.25], spread: 5 },
      { pos: [-2, -5, -3], color: [0.35, 0.15, 0.12], spread: 5 },
      { pos: [0, 0, 0], color: [0.2, 0.18, 0.25], spread: 10 },
      { pos: [-7, -1, 1], color: [0.2, 0.3, 0.35], spread: 4 },
      { pos: [3, 5, -6], color: [0.4, 0.2, 0.1], spread: 4 },
    ];

    for (let i = 0; i < count; i++) {
      const center = centers[i % centers.length];
      const spread = center.spread;

      pos[i * 3] = center.pos[0] + (Math.random() - 0.5) * spread * 2;
      pos[i * 3 + 1] = center.pos[1] + (Math.random() - 0.5) * spread * 2;
      pos[i * 3 + 2] = center.pos[2] + (Math.random() - 0.5) * spread * 2;

      col[i * 3] = center.color[0] + Math.random() * 0.05;
      col[i * 3 + 1] = center.color[1] + Math.random() * 0.05;
      col[i * 3 + 2] = center.color[2] + Math.random() * 0.05;

      sz[i] = 0.3 + Math.random() * 0.8;
    }

    return { positions: pos, colors: col, sizes: sz };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    // Very slow drift
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.003;
    pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.002) * 0.02;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          array={colors}
          count={colors.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.8}
        transparent
        opacity={0.06}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
