import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { useVoiceInput } from '../hooks/useVoiceInput';

// Answer generation for free-form queries
const ANSWER_PATTERNS: { pattern: RegExp; answer: string }[] = [
  {
    pattern: /acme.*renew|renew.*acme/i,
    answer:
      'Found 15 meetings related to the Acme Corp renewal, spanning pricing discussions, technical reviews, and executive alignments over the past 8 months.',
  },
  {
    pattern: /acme.*worr|worr.*acme|what.*acme.*concern/i,
    answer:
      "Acme's primary concern is pricing — their CFO James Okafor stated your per-seat cost is 40% above Competitor X. Secondary concerns include missing Salesforce integration, declining adoption (down 15% last quarter), and 12 unresolved support tickets open for 30+ days.",
  },
  {
    pattern: /pric.*push|push.*pric|pricing.*issue/i,
    answer:
      'Pricing pushback surfaced across 4 accounts: Acme Corp (CFO called you 40% above competitors), VertexAI (requesting volume discount from $45 to $30/seat), Globex Industries ($800K budget under evaluation), and in win-loss reviews (3 deals lost to lower-priced competitors last quarter).',
  },
  {
    pattern: /promis.*integrat|integrat.*promis|promise.*built|never.*built|unfulfill/i,
    answer:
      "Found two unfulfilled promises: (1) A Snowflake connector promised to Acme 6 months ago with no ETA — buried in a support call. (2) A custom SSO adapter promised to CloudBridge 5 months ago as a partnership commitment — nobody built it.",
  },
  {
    pattern: /lose.*renew|going.*lose|risk.*renew|renewal.*risk/i,
    answer:
      "Probably, unless you act this week. No one said this in one meeting — I connected it from three. The CFO is evaluating competitors at lower price points, adoption dropped 15% last quarter with three teams going dark, and Marcus committed to an integration timeline that engineering hasn't been briefed on.",
  },
  {
    pattern: /churn|risk.*escalat|zenith/i,
    answer:
      "Zenith Health is in critical condition. NPS dropped from 42 to -8. Their COO said 'we've reported the same bug 4 times.' Contract auto-renews in 60 days with a termination clause. Save plan approved: dedicated support, weekly check-ins, 15% discount.",
  },
  {
    pattern: /compet|win.*loss|battle/i,
    answer:
      'Lost 3 deals to CompetitorX last quarter citing better AI features and lower pricing. CompetitorY raised $50M Series C. CompetitorX is offering free 6-month pilots. Battlecard strong on security, weak on time-to-value.',
  },
  {
    pattern: /hiring|headcount|candidate|pipeline.*role/i,
    answer:
      '45 applications for PM role, 8 phone screens, 3 onsites. Marcus wants 3 AEs + 1 SE but budget covers 2. Time-to-hire averaging 52 days. Lost 2 candidates to higher offers.',
  },
  {
    pattern: /globex|POC|pilot.*eval/i,
    answer:
      "Globex is evaluating with a $800K ARR budget, decision by end of Q2. POC results: 99.7% accuracy. Key blockers: HIPAA compliance (in progress), EU data residency (no EU regions yet), and Elena's FIPS 140-2 request.",
  },
  {
    pattern: /vertex|expansion|rollout/i,
    answer:
      'VertexAI wants to expand from 50 to 400 seats. Leo needs SSO and SCIM first. Negotiating price from $45 to $30/seat. Usage is bimodal: power users at 4.2 hrs/day, but 60% log in less than weekly.',
  },
  {
    pattern: /board|investor|ARR|revenue|fundrais/i,
    answer:
      'ARR at $8.2M (up from $6.1M). NRR 112%. Gross margin 78%. Board concerned about 18-month CAC payback and top-3 customer concentration at 42% of ARR. Series A target: $15M in Q4, 14 months runway.',
  },
  {
    pattern: /partner|channel|resell|co-sell/i,
    answer:
      'Active partnerships: Zapier (needs OAuth 2.0), Salesforce co-sell ($200K opportunity), Atlassian marketplace (340 installs, needs engagement). AWS partnership drove $450K influenced revenue. CloudBridge SSO adapter unfulfilled.',
  },
  {
    pattern: /roadmap|product.*strategy|feature.*request/i,
    answer:
      'Q3 roadmap: AI summarization, advanced analytics, Snowflake connector — but capacity covers only 2 of 3. 42 feature requests this month; top: webhooks, bulk export, role-based permissions. Salesforce integration pulled up for Acme renewal.',
  },
];

function generateAnswer(query: string): string {
  for (const { pattern, answer } of ANSWER_PATTERNS) {
    if (pattern.test(query)) return answer;
  }

  if (query.trim().length > 5) {
    return `Analyzed ${Math.floor(Math.random() * 8 + 3)} meetings across ${Math.floor(Math.random() * 3 + 2)} clusters. The most relevant insights relate to ${query.toLowerCase().includes('acme') ? 'the Acme account' : 'your search'} — click any meeting sphere to explore the full context.`;
  }

  return '';
}

export function SearchOverlay() {
  const query = useStore((s) => s.query);
  const setQuery = useStore((s) => s.setQuery);
  const results = useStore((s) => s.results);
  const drilledMeeting = useStore((s) => s.drilledMeeting);
  const drillInto = useStore((s) => s.drillInto);
  const resetView = useStore((s) => s.resetView);
  const answer = useStore((s) => s.answer);
  const answerLoading = useStore((s) => s.answerLoading);
  const setAnswer = useStore((s) => s.setAnswer);
  const setAnswerLoading = useStore((s) => s.setAnswerLoading);
  const isFlying = useStore((s) => s.isFlying);
  const setSynthesis = useStore((s) => s.setSynthesis);

  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState('');
  const debounceRef = useRef<number>(0);
  const answerTimeoutRef = useRef<number>(0);

  const triggerSearch = useCallback(
    (val: string) => {
      setQuery(val);

      // Clear previous answer timeout
      clearTimeout(answerTimeoutRef.current);

      if (val.trim().length > 3) {
        setAnswerLoading(true);
        answerTimeoutRef.current = window.setTimeout(() => {
          const ans = generateAnswer(val);
          if (ans) {
            setAnswer(ans);
          }
          setAnswerLoading(false);

          // Check if this should trigger synthesis (void moment)
          if (/lose|risk|going to|connected|across.*meeting/i.test(val)) {
            const currentResults = useStore.getState().results;
            if (currentResults.length >= 3) {
              const top3 = currentResults.slice(0, 3);
              const edges: [string, string][] = [];
              for (let i = 0; i < top3.length; i++) {
                for (let j = i + 1; j < top3.length; j++) {
                  edges.push([top3[i].meeting.id, top3[j].meeting.id]);
                }
              }
              const centroid: [number, number, number] = [0, 0, 0];
              for (const r of top3) {
                centroid[0] += r.meeting.position[0] / 3;
                centroid[1] += r.meeting.position[1] / 3;
                centroid[2] += r.meeting.position[2] / 3;
              }
              setTimeout(() => setSynthesis(edges, centroid), 800);
            }
          }
        }, 1200);
      } else {
        setAnswer('');
        setAnswerLoading(false);
      }
    },
    [setQuery, setAnswer, setAnswerLoading, setSynthesis]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalQuery(val);

      clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        triggerSearch(val);
      }, 250);
    },
    [triggerSearch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLocalQuery('');
        triggerSearch('');
        resetView();
      }
      if (e.key === 'Enter') {
        clearTimeout(debounceRef.current);
        triggerSearch(localQuery);
      }
    },
    [localQuery, triggerSearch, resetView]
  );

  const { isListening, toggle: toggleVoice } = useVoiceInput((text) => {
    setLocalQuery(text);
    triggerSearch(text);
  });

  // Focus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 10,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Search bar */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(600px, 90vw)',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(10, 10, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: `1px solid rgba(255, 215, 153, ${isListening ? '0.4' : '0.15'})`,
            borderRadius: 16,
            padding: '12px 20px',
            boxShadow: isListening
              ? '0 0 20px rgba(255, 215, 153, 0.1), 0 8px 32px rgba(0,0,0,0.5)'
              : '0 8px 32px rgba(0,0,0,0.5)',
            transition: 'border-color 0.3s, box-shadow 0.3s',
          }}
        >
          <span
            style={{
              color: isListening
                ? 'rgba(255, 215, 153, 0.8)'
                : 'rgba(255, 215, 153, 0.5)',
              marginRight: 12,
              fontSize: 18,
              transition: 'color 0.3s',
            }}
          >
            {isListening ? '\u25CF' : '>'}
          </span>
          <input
            ref={inputRef}
            value={localQuery}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening ? 'Listening...' : 'Ask anything across all meetings...'
            }
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e8e0d4',
              fontSize: 16,
              fontFamily: 'inherit',
              letterSpacing: '0.02em',
            }}
          />

          {/* Voice button */}
          <button
            onClick={toggleVoice}
            style={{
              background: isListening
                ? 'rgba(255, 215, 153, 0.15)'
                : 'none',
              border: 'none',
              color: isListening
                ? 'rgba(255, 215, 153, 0.8)'
                : 'rgba(255, 215, 153, 0.3)',
              cursor: 'pointer',
              fontSize: 16,
              padding: '4px 8px',
              borderRadius: 6,
              transition: 'all 0.2s',
              marginRight: 4,
            }}
            title="Voice input"
          >
            {isListening ? '\u23F9' : '\u2609'}
          </button>

          {localQuery && (
            <button
              onClick={() => {
                setLocalQuery('');
                triggerSearch('');
                resetView();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 215, 153, 0.4)',
                cursor: 'pointer',
                fontSize: 12,
                padding: '4px 8px',
                letterSpacing: '0.05em',
              }}
            >
              ESC
            </button>
          )}
        </div>

        {/* Flying indicator */}
        {isFlying && (
          <div
            style={{
              textAlign: 'center',
              marginTop: 8,
              color: 'rgba(255, 215, 153, 0.6)',
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            navigating...
          </div>
        )}
      </div>

      {/* Answer panel */}
      {(answer || answerLoading) && (
        <div
          style={{
            position: 'absolute',
            bottom: 100,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(550px, 85vw)',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              background: 'rgba(10, 10, 18, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 215, 153, 0.2)',
              borderRadius: 12,
              padding: '16px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                color: 'rgba(255, 215, 153, 0.4)',
                fontSize: 10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              synthesis
            </div>
            <div
              style={{
                color: '#e8e0d4',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {answerLoading ? (
                <span style={{ opacity: 0.5 }}>Connecting insights...</span>
              ) : (
                <TypewriterText text={answer} />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drilled meeting panel */}
      {drilledMeeting && (
        <div
          style={{
            position: 'absolute',
            right: 24,
            top: 100,
            width: 320,
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              background: 'rgba(10, 10, 18, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 215, 153, 0.15)',
              borderRadius: 12,
              padding: '16px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <button
              onClick={() => drillInto(null)}
              style={{
                float: 'right',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 215, 153, 0.4)',
                cursor: 'pointer',
                fontSize: 18,
                fontFamily: 'inherit',
              }}
            >
              \u00d7
            </button>
            <div
              style={{
                color: 'rgba(255, 215, 153, 0.4)',
                fontSize: 10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {drilledMeeting.date}
            </div>
            <div
              style={{
                color: '#e8e0d4',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              {drilledMeeting.title}
            </div>
            <div
              style={{
                color: 'rgba(255, 215, 153, 0.3)',
                fontSize: 11,
                marginBottom: 16,
              }}
            >
              {drilledMeeting.participants.join(' \u00b7 ')}
            </div>

            {/* Moments */}
            {drilledMeeting.moments.slice(0, 8).map((moment) => {
              const relevance =
                useStore.getState().momentRelevanceMap.get(moment.id) ?? 0;
              return (
                <div
                  key={moment.id}
                  style={{
                    marginBottom: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background:
                      relevance > 0.3
                        ? 'rgba(255, 215, 153, 0.08)'
                        : 'rgba(255, 255, 255, 0.02)',
                    borderLeft: `2px solid rgba(255, 215, 153, ${0.1 + relevance * 0.6})`,
                  }}
                >
                  <div
                    style={{
                      color: 'rgba(255, 215, 153, 0.3)',
                      fontSize: 10,
                      marginBottom: 4,
                    }}
                  >
                    {moment.timestamp}
                  </div>
                  <div
                    style={{
                      color:
                        relevance > 0.3
                          ? '#e8e0d4'
                          : 'rgba(232, 224, 212, 0.5)',
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    {moment.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results sidebar */}
      {results.length > 0 && !drilledMeeting && (
        <div
          style={{
            position: 'absolute',
            left: 24,
            top: 100,
            width: 280,
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              background: 'rgba(10, 10, 18, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 215, 153, 0.1)',
              borderRadius: 12,
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                color: 'rgba(255, 215, 153, 0.4)',
                fontSize: 10,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              {results.length} matches
            </div>

            {results.slice(0, 10).map((r) => (
              <button
                key={r.meeting.id}
                onClick={() => drillInto(r.meeting)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: 'none',
                  borderLeft: `2px solid rgba(255, 215, 153, ${0.1 + r.score * 0.8})`,
                  borderRadius: 6,
                  padding: '8px 10px',
                  marginBottom: 6,
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
                    fontWeight: 500,
                    marginBottom: 2,
                  }}
                >
                  {r.meeting.title}
                </div>
                <div
                  style={{
                    color: 'rgba(255, 215, 153, 0.3)',
                    fontSize: 10,
                  }}
                >
                  {r.meeting.date} \u00b7 {(r.score * 100).toFixed(0)}% match
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brand */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            color: 'rgba(255, 215, 153, 0.25)',
            fontSize: 11,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
          }}
        >
          orrery
        </div>
      </div>
    </div>
  );
}

function TypewriterText({ text }: { text: string }) {
  const [displayed, setDisplayed] = useState('');
  const indexRef = useRef(0);

  useEffect(() => {
    setDisplayed('');
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        indexRef.current++;
        setDisplayed(text.slice(0, indexRef.current));
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <span>
      {displayed}
      {displayed.length < text.length && (
        <span
          style={{
            opacity: 0.5,
            animation: 'blink 1s infinite',
          }}
        >
          |
        </span>
      )}
    </span>
  );
}
