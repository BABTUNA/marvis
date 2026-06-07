import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useStore } from '../store';

const CLUSTER_CENTERS: Record<string, { pos: [number, number, number]; label: string }> = {
  'acme-renewal': { pos: [4.4, 9, 0], label: 'Acme Renewal' },
  'acme-support': { pos: [-5.3, 7, 4.8], label: 'Acme Support' },
  'globex-deal': { pos: [0.8, 5, -8.6], label: 'Globex Deal' },
  'internal-product': { pos: [7.2, 3, 6.3], label: 'Product' },
  'internal-hiring': { pos: [-9.8, 1, -1.8], label: 'Hiring' },
  'vertexai-expansion': { pos: [8.4, -1, -5.3], label: 'VertexAI' },
  'competitor-intel': { pos: [-3.3, -3, 9], label: 'Competitive' },
  'zenith-churn': { pos: [-2.4, -5, -8.3], label: 'Zenith Risk' },
  'partnerships': { pos: [6.3, -7, 3.3], label: 'Partnerships' },
  'board-investors': { pos: [-2.9, -9, -3.3], label: 'Board' },
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
