import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { useStore } from '../store';

export function MeetingLabels() {
  const data = useStore((s) => s.data);
  const results = useStore((s) => s.results);
  const relevanceMap = useStore((s) => s.relevanceMap);
  const drilledMeeting = useStore((s) => s.drilledMeeting);

  const meetings = data?.meetings ?? [];

  // Only show labels for top results or drilled meeting
  const visibleLabels = useMemo(() => {
    if (drilledMeeting) {
      return [{ meeting: drilledMeeting, relevance: 1 }];
    }

    if (results.length === 0) return [];

    return results
      .slice(0, 5)
      .filter((r) => r.score > 0.1)
      .map((r) => ({
        meeting: r.meeting,
        relevance: relevanceMap.get(r.meeting.id) ?? 0,
      }));
  }, [results, drilledMeeting, relevanceMap]);

  if (visibleLabels.length === 0) return null;

  return (
    <group>
      {visibleLabels.map(({ meeting, relevance }) => (
        <Html
          key={meeting.id}
          position={[
            meeting.position[0],
            meeting.position[1] + 0.5,
            meeting.position[2],
          ]}
          center
          distanceFactor={12}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <div
            style={{
              background: 'rgba(10, 10, 18, 0.8)',
              border: `1px solid rgba(255, 215, 153, ${0.1 + relevance * 0.3})`,
              borderRadius: 6,
              padding: '4px 10px',
              color: `rgba(232, 224, 212, ${0.5 + relevance * 0.5})`,
              fontSize: 11,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.02em',
              textAlign: 'center',
              transform: 'translateY(-20px)',
            }}
          >
            <div style={{ fontWeight: 500 }}>{meeting.title.split(' — ')[0]}</div>
            <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>
              {meeting.date} · {meeting.account}
            </div>
          </div>
        </Html>
      ))}
    </group>
  );
}
