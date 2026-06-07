import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

const STREAK_COUNT = 200;

const streakVertexShader = /* glsl */ `
  attribute float aOpacity;
  varying float vOpacity;

  void main() {
    vOpacity = aOpacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 2.0 * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const streakFragmentShader = /* glsl */ `
  varying float vOpacity;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;

    float alpha = (1.0 - dist * 2.0) * vOpacity;
    gl_FragColor = vec4(0.7, 0.65, 0.5, alpha * 0.35);
  }
`;

export function WarpStreaks() {
  const pointsRef = useRef<THREE.Points>(null);
  const isFlying = useStore((s) => s.isFlying);
  const { camera } = useThree();

  const { positions, opacities } = useMemo(() => {
    const pos = new Float32Array(STREAK_COUNT * 3);
    const op = new Float32Array(STREAK_COUNT);
    return { positions: pos, opacities: op };
  }, []);

  const prevCamPos = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3());
  const intensity = useRef(0);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    // Calculate camera velocity
    velocity.current.subVectors(camera.position, prevCamPos.current).divideScalar(Math.max(delta, 0.001));
    prevCamPos.current.copy(camera.position);

    const speed = velocity.current.length();
    const targetIntensity = isFlying && speed > 2 ? Math.min(1, speed / 20) : 0;
    intensity.current += (targetIntensity - intensity.current) * Math.min(1, delta * 5);

    if (intensity.current < 0.01) {
      pointsRef.current.visible = false;
      return;
    }

    pointsRef.current.visible = true;
    const posArr = positions;
    const opArr = opacities;
    const camDir = velocity.current.clone().normalize();

    for (let i = 0; i < STREAK_COUNT; i++) {
      // Position streaks in front of camera along velocity direction
      const spread = 8;
      const ahead = 5 + Math.random() * 15;
      posArr[i * 3] = camera.position.x + camDir.x * ahead + (Math.random() - 0.5) * spread;
      posArr[i * 3 + 1] = camera.position.y + camDir.y * ahead + (Math.random() - 0.5) * spread;
      posArr[i * 3 + 2] = camera.position.z + camDir.z * ahead + (Math.random() - 0.5) * spread;
      opArr[i] = intensity.current * (0.3 + Math.random() * 0.7);
    }

    const geom = pointsRef.current.geometry;
    geom.attributes.position.needsUpdate = true;
    geom.attributes.aOpacity.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} visible={false} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={STREAK_COUNT}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aOpacity"
          array={opacities}
          count={STREAK_COUNT}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={streakVertexShader}
        fragmentShader={streakFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
