import { useState, useCallback } from 'react';
import { useStore } from '../store';

interface DemoQuery {
  text: string;
  description: string;
  type: 'search' | 'drill' | 'synthesis';
}

const DEMO_QUERIES: DemoQuery[] = [
  {
    text: 'Acme renewal conversations',
    description: 'Fly to the Acme cluster',
    type: 'search',
  },
  {
    text: 'What was Acme worried about?',
    description: 'Drill into pricing fears',
    type: 'search',
  },
  {
    text: 'pricing pushback',
    description: 'Cross-cluster pricing mentions',
    type: 'search',
  },
  {
    text: 'integration we promised but never built',
    description: 'Find the orphaned promise',
    type: 'search',
  },
  {
    text: 'Are we going to lose the Acme renewal?',
    description: 'Multi-hop synthesis moment',
    type: 'synthesis',
  },
  {
    text: 'churn risk escalation',
    description: 'Zenith Health risk cluster',
    type: 'search',
  },
  {
    text: 'competitor win-loss',
    description: 'Competitive intelligence',
    type: 'search',
  },
  {
    text: 'hiring pipeline headcount',
    description: 'Internal hiring cluster',
    type: 'search',
  },
];

// Pre-baked answers for demo queries (no LLM needed for demo)
const DEMO_ANSWERS: Record<string, string> = {
  'Acme renewal conversations':
    'Found 15 meetings related to the Acme Corp renewal, spanning pricing discussions, technical reviews, and executive alignments over the past 8 months.',
  'What was Acme worried about?':
    "Acme's primary concern is pricing — their CFO James Okafor stated your per-seat cost is 40% above Competitor X. Secondary concerns include missing Salesforce integration, declining adoption (down 15% last quarter), and 12 unresolved support tickets open for 30+ days.",
  'pricing pushback':
    'Pricing pushback surfaced across 4 accounts: Acme Corp (CFO called you 40% above competitors), VertexAI (requesting volume discount from $45 to $30/seat), Globex Industries ($800K budget under evaluation), and in win-loss reviews (3 deals lost to lower-priced competitors last quarter).',
  'integration we promised but never built':
    "Found two unfulfilled promises: (1) A Snowflake connector promised to Acme 6 months ago with no ETA — buried in a support call. (2) A custom SSO adapter promised to CloudBridge 5 months ago as a partnership commitment — nobody built it. Both are at risk of damaging trust.",
  'Are we going to lose the Acme renewal?':
    "Probably, unless you act this week. No one said this in one meeting — I connected it from three. The CFO is evaluating competitors at lower price points, adoption dropped 15% last quarter with three teams going dark, and Marcus committed to an integration timeline that engineering hasn't been briefed on. The renewal window closes with their fiscal year in March.",
  'churn risk escalation':
    "Zenith Health is in critical condition. NPS dropped from 42 to -8. Their COO Karen said 'we've reported the same bug 4 times.' Contract auto-renews in 60 days with a termination clause. A save plan is approved: dedicated support, weekly check-ins, 15% discount.",
  'competitor win-loss':
    'Lost 3 deals to CompetitorX last quarter citing better AI features and lower pricing. CompetitorY raised $50M Series C and is aggressively hiring. CompetitorX is offering free 6-month pilots to enterprise accounts. Your battlecard is strong on security but weak on time-to-value messaging.',
  'hiring pipeline headcount':
    'Pipeline has 45 applications for the PM role with 8 phone screens and 3 onsites. Marcus wants 3 AEs and 1 SE for Q3 but budget only covers 2 hires. Time-to-hire averaging 52 days. Lost 2 candidates to higher offers last month — comp bands need revision.',
};

export function DemoMode() {
  const setQuery = useStore((s) => s.setQuery);
  const setAnswer = useStore((s) => s.setAnswer);
  const setAnswerLoading = useStore((s) => s.setAnswerLoading);
  const setSynthesis = useStore((s) => s.setSynthesis);
  const data = useStore((s) => s.data);
  const results = useStore((s) => s.results);
  const [expanded, setExpanded] = useState(true);

  const handleDemoQuery = useCallback(
    (demo: DemoQuery) => {
      setQuery(demo.text);
      setAnswerLoading(true);

      // Simulate LLM thinking time, then show answer
      setTimeout(() => {
        const answer = DEMO_ANSWERS[demo.text] || 'Analyzing cross-meeting patterns...';
        setAnswer(answer);
        setAnswerLoading(false);

        // If synthesis type, trigger the void moment
        if (demo.type === 'synthesis' && data) {
          const currentResults = useStore.getState().results;
          if (currentResults.length >= 3) {
            const top3 = currentResults.slice(0, 3);
            const edges: [string, string][] = [];
            for (let i = 0; i < top3.length; i++) {
              for (let j = i + 1; j < top3.length; j++) {
                edges.push([top3[i].meeting.id, top3[j].meeting.id]);
              }
            }

            // Centroid of top 3 meetings
            const centroid: [number, number, number] = [0, 0, 0];
            for (const r of top3) {
              centroid[0] += r.meeting.position[0] / 3;
              centroid[1] += r.meeting.position[1] / 3;
              centroid[2] += r.meeting.position[2] / 3;
            }

            setTimeout(() => {
              setSynthesis(edges, centroid);
            }, 1500);
          }
        }
      }, 1200);
    },
    [setQuery, setAnswer, setAnswerLoading, setSynthesis, data]
  );

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 50,
        right: 24,
        zIndex: 20,
        pointerEvents: 'auto',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'block',
          marginLeft: 'auto',
          marginBottom: 8,
          background: 'rgba(10, 10, 18, 0.7)',
          border: '1px solid rgba(255, 215, 153, 0.15)',
          borderRadius: 8,
          padding: '6px 12px',
          color: 'rgba(255, 215, 153, 0.5)',
          fontSize: 11,
          cursor: 'pointer',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {expanded ? 'hide' : 'demo'}
      </button>

      {expanded && (
        <div
          style={{
            background: 'rgba(10, 10, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 215, 153, 0.1)',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            width: 260,
          }}
        >
          <div
            style={{
              color: 'rgba(255, 215, 153, 0.4)',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 10,
            }}
          >
            demo queries
          </div>

          {DEMO_QUERIES.map((demo) => (
            <button
              key={demo.text}
              onClick={() => handleDemoQuery(demo)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'rgba(255, 255, 255, 0.02)',
                border: 'none',
                borderLeft: `2px solid rgba(255, 215, 153, ${demo.type === 'synthesis' ? '0.5' : '0.15'})`,
                borderRadius: 6,
                padding: '8px 10px',
                marginBottom: 4,
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  'rgba(255, 215, 153, 0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background =
                  'rgba(255, 255, 255, 0.02)';
              }}
            >
              <div
                style={{
                  color: '#e8e0d4',
                  fontSize: 12,
                  marginBottom: 2,
                }}
              >
                "{demo.text}"
              </div>
              <div
                style={{
                  color: 'rgba(255, 215, 153, 0.25)',
                  fontSize: 10,
                }}
              >
                {demo.description}
                {demo.type === 'synthesis' && ' ★'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
