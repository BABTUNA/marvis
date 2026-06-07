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

    // Create wispy nebula clouds around the spherical cluster regions
    const centers = [
      { pos: [4.4, 9, 0], color: [0.08, 0.15, 0.3], spread: 5 },
      { pos: [0.8, 5, -8.6], color: [0.05, 0.2, 0.15], spread: 5 },
      { pos: [-9.8, 1, -1.8], color: [0.2, 0.08, 0.06], spread: 4 },
      { pos: [0, 0, 0], color: [0.1, 0.09, 0.14], spread: 12 },
      { pos: [8.4, -1, -5.3], color: [0.1, 0.18, 0.2], spread: 4 },
      { pos: [-2.4, -5, -8.3], color: [0.25, 0.1, 0.05], spread: 4 },
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
        opacity={0.03}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
