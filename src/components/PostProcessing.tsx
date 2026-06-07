import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';

export function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.25}
        luminanceSmoothing={0.9}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.85}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={0.04}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  );
}
