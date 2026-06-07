import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useStore } from '../store';

const CLUSTER_CENTERS: Record<string, { pos: [number, number, number]; label: string }> = {
  'acme-renewal': { pos: [8, 2, -3], label: 'Acme Renewal' },
  'acme-support': { pos: [10, 0, -1], label: 'Acme Support' },
  'globex-deal': { pos: [-6, 4, 5], label: 'Globex Deal' },
  'internal-product': { pos: [-2, -6, -4], label: 'Product' },
  'internal-hiring': { pos: [0, 7, 8], label: 'Hiring' },
  'vertexai-expansion': { pos: [-8, -2, 0], label: 'VertexAI' },
  'competitor-intel': { pos: [4, -5, 6], label: 'Competitive' },
  'zenith-churn': { pos: [3, 6, -7], label: 'Zenith Risk' },
  'partnerships': { pos: [-5, 5, -6], label: 'Partnerships' },
  'board-investors': { pos: [0, -8, -2], label: 'Board' },
};

export function ClusterLabels() {
  const query = useStore((s) => s.query);
  const drilledMeeting = useStore((s) => s.drilledMeeting);

  // Only show cluster labels when no active search/drill
  const visible = !query && !drilledMeeting;

  const clusters = useMemo(() => Object.entries(CLUSTER_CENTERS), []);

  if (!visible) return null;

  return (
    <group>
      {clusters.map(([id, { pos, label }]) => (
        <Html
          key={id}
          position={[pos[0], pos[1] + 3.5, pos[2]]}
          center
          distanceFactor={20}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              color: 'rgba(255, 215, 153, 0.18)',
              fontSize: 10,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textAlign: 'center',
            }}
          >
            {label}
          </div>
        </Html>
      ))}
    </group>
  );
}
