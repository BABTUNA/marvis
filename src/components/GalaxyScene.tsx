import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { MeetingSpheres } from './MeetingSpheres';
import { MomentPoints } from './MomentPoints';
import { CameraController } from './CameraController';
import { SynthesisEdges } from './SynthesisEdges';
import { MeetingLabels } from './MeetingLabels';
import { ClusterLabels } from './ClusterLabels';
import { PostProcessing } from './PostProcessing';
import { GalaxyEnvironment } from './GalaxyEnvironment';

export function GalaxyScene() {
  return (
    <Canvas
      camera={{ position: [0, 8, 25], fov: 60, near: 0.1, far: 200 }}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <GalaxyEnvironment />
        <MeetingSpheres />
        <MomentPoints />
        <SynthesisEdges />
        <MeetingLabels />
        <ClusterLabels />
        <CameraController />
        <PostProcessing />
      </Suspense>
    </Canvas>
  );
}
