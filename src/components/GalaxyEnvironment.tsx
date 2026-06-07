import { useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

export function GalaxyEnvironment() {
  const starsRef = useRef<THREE.Points>(null);

  const starPositions = useMemo(() => {
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random positions in a large sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 50 + Math.random() * 100;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    return { positions, sizes };
  }, []);

  useFrame((state) => {
    if (starsRef.current) {
      starsRef.current.rotation.y = state.clock.elapsedTime * 0.002;
    }
  });

  return (
    <>
      {/* Near-black background */}
      <color attach="background" args={['#050508']} />

      {/* Exponential fog for depth */}
      <fogExp2 attach="fog" args={['#050508', 0.015]} />

      {/* Background stars */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={starPositions.positions}
            count={starPositions.positions.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={starPositions.sizes}
            count={starPositions.sizes.length}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#3a3a5c"
          size={0.15}
          transparent
          opacity={0.4}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}
