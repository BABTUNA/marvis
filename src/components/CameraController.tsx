import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store';

// Slow ambient orbit when idle
const ORBIT_SPEED = 0.03;
const ORBIT_RADIUS = 0.5;

export function CameraController() {
  const { camera } = useThree();
  const cameraTarget = useStore((s) => s.cameraTarget);
  const setFlying = useStore((s) => s.setFlying);

  const currentLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetPos = useRef(new THREE.Vector3(0, 8, 25));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const targetFov = useRef(60);
  const progress = useRef(1); // 1 = arrived
  const flightDuration = useRef(2.0);
  const startPos = useRef(new THREE.Vector3());
  const startLookAt = useRef(new THREE.Vector3());
  const startFov = useRef(60);

  // Control point for curved path
  const controlPoint = useRef(new THREE.Vector3());

  useEffect(() => {
    if (!cameraTarget) return;

    // Start new flight
    startPos.current.copy(camera.position);
    startLookAt.current.copy(currentLookAt.current);
    startFov.current = (camera as THREE.PerspectiveCamera).fov;

    targetPos.current.set(...cameraTarget.position);
    targetLookAt.current.set(...cameraTarget.lookAt);
    targetFov.current = cameraTarget.fov ?? 60;

    // Compute a control point that creates an arc
    const mid = new THREE.Vector3()
      .addVectors(startPos.current, targetPos.current)
      .multiplyScalar(0.5);
    const dist = startPos.current.distanceTo(targetPos.current);
    // Lift the control point up to create an arc
    mid.y += dist * 0.3;
    // Offset laterally for a banked curve
    const dir = new THREE.Vector3()
      .subVectors(targetPos.current, startPos.current)
      .normalize();
    const lateral = new THREE.Vector3(-dir.z, 0, dir.x).multiplyScalar(dist * 0.15);
    controlPoint.current.copy(mid).add(lateral);

    progress.current = 0;
    flightDuration.current = Math.min(3.0, Math.max(1.2, dist * 0.12));
    setFlying(true);
  }, [cameraTarget, camera, setFlying]);

  useFrame((state, delta) => {
    const cam = camera as THREE.PerspectiveCamera;

    if (progress.current < 1) {
      // In flight
      progress.current = Math.min(1, progress.current + delta / flightDuration.current);

      // Ease in/out (smooth quintic)
      const t = progress.current;
      const ease = t < 0.5
        ? 16 * t * t * t * t * t
        : 1 - Math.pow(-2 * t + 2, 5) / 2;

      // Quadratic bezier for curved path
      const oneMinusT = 1 - ease;
      const px =
        oneMinusT * oneMinusT * startPos.current.x +
        2 * oneMinusT * ease * controlPoint.current.x +
        ease * ease * targetPos.current.x;
      const py =
        oneMinusT * oneMinusT * startPos.current.y +
        2 * oneMinusT * ease * controlPoint.current.y +
        ease * ease * targetPos.current.y;
      const pz =
        oneMinusT * oneMinusT * startPos.current.z +
        2 * oneMinusT * ease * controlPoint.current.z +
        ease * ease * targetPos.current.z;

      cam.position.set(px, py, pz);

      // Interpolate lookAt
      currentLookAt.current.lerpVectors(startLookAt.current, targetLookAt.current, ease);
      cam.lookAt(currentLookAt.current);

      // FOV punch: widen during middle of flight, narrow at ends
      const fovPunch = Math.sin(ease * Math.PI) * 8;
      const baseFov = startFov.current + (targetFov.current - startFov.current) * ease;
      cam.fov = baseFov + fovPunch;
      cam.updateProjectionMatrix();

      if (progress.current >= 1) {
        setFlying(false);
      }
    } else {
      // Idle: gentle orbit
      const time = state.clock.elapsedTime;
      const orbitX = Math.sin(time * ORBIT_SPEED) * ORBIT_RADIUS;
      const orbitY = Math.cos(time * ORBIT_SPEED * 0.7) * ORBIT_RADIUS * 0.3;

      cam.position.x += (targetPos.current.x + orbitX - cam.position.x) * delta * 0.5;
      cam.position.y += (targetPos.current.y + orbitY - cam.position.y) * delta * 0.5;
      cam.position.z += (targetPos.current.z - cam.position.z) * delta * 0.5;

      cam.lookAt(currentLookAt.current);

      // Smoothly restore target FOV
      if (Math.abs(cam.fov - targetFov.current) > 0.1) {
        cam.fov += (targetFov.current - cam.fov) * delta * 2;
        cam.updateProjectionMatrix();
      }
    }
  });

  return null;
}
