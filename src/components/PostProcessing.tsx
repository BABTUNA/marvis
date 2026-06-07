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
        intensity={1.5}
        luminanceThreshold={0.1}
        luminanceSmoothing={0.9}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={0.04}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  );
}
