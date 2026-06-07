import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store';

export function SearchOverlay() {
  const query = useStore((s) => s.query);
  const setQuery = useStore((s) => s.setQuery);
  const results = useStore((s) => s.results);
  const drilledMeeting = useStore((s) => s.drilledMeeting);
  const drillInto = useStore((s) => s.drillInto);
  const resetView = useStore((s) => s.resetView);
  const answer = useStore((s) => s.answer);
  const answerLoading = useStore((s) => s.answerLoading);
  const isFlying = useStore((s) => s.isFlying);
  const flyTo = useStore((s) => s.flyTo);

  const inputRef = useRef<HTMLInputElement>(null);
  const [localQuery, setLocalQuery] = useState('');
  const debounceRef = useRef<number>(0);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalQuery(val);

      clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        setQuery(val);
      }, 150);
    },
    [setQuery]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLocalQuery('');
        setQuery('');
        resetView();
      }
      if (e.key === 'Enter') {
        clearTimeout(debounceRef.current);
        setQuery(localQuery);
      }
    },
    [localQuery, setQuery, resetView]
  );

  // Focus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 500);
  }, []);

  const topResult = results[0];
  const topMoment =
    topResult?.momentScores?.[0]?.score > 0.1
      ? topResult.momentScores[0].moment
      : null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      zIndex: 10,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Search bar */}
      <div style={{
        position: 'absolute',
        top: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(600px, 90vw)',
        pointerEvents: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(10, 10, 18, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 215, 153, 0.15)',
          borderRadius: 16,
          padding: '12px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          <span style={{
            color: 'rgba(255, 215, 153, 0.5)',
            marginRight: 12,
            fontSize: 18,
          }}>
            &gt;
          </span>
          <input
            ref={inputRef}
            value={localQuery}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything across all meetings..."
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
          {localQuery && (
            <button
              onClick={() => {
                setLocalQuery('');
                setQuery('');
                resetView();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 215, 153, 0.4)',
                cursor: 'pointer',
                fontSize: 14,
                padding: '4px 8px',
              }}
            >
              ESC
            </button>
          )}
        </div>

        {/* Flying indicator */}
        {isFlying && (
          <div style={{
            textAlign: 'center',
            marginTop: 8,
            color: 'rgba(255, 215, 153, 0.6)',
            fontSize: 12,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            navigating...
          </div>
        )}
      </div>

      {/* Answer panel */}
      {(answer || answerLoading) && (
        <div style={{
          position: 'absolute',
          bottom: 120,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(550px, 85vw)',
          pointerEvents: 'auto',
        }}>
          <div style={{
            background: 'rgba(10, 10, 18, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 215, 153, 0.2)',
            borderRadius: 12,
            padding: '16px 20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              color: 'rgba(255, 215, 153, 0.4)',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              synthesis
            </div>
            <div style={{
              color: '#e8e0d4',
              fontSize: 14,
              lineHeight: 1.6,
            }}>
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
        <div style={{
          position: 'absolute',
          right: 24,
          top: 100,
          width: 320,
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          pointerEvents: 'auto',
        }}>
          <div style={{
            background: 'rgba(10, 10, 18, 0.9)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 215, 153, 0.15)',
            borderRadius: 12,
            padding: '16px 20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <button
              onClick={() => drillInto(null)}
              style={{
                float: 'right',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 215, 153, 0.4)',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              x
            </button>
            <div style={{
              color: 'rgba(255, 215, 153, 0.4)',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              {drilledMeeting.date}
            </div>
            <div style={{
              color: '#e8e0d4',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 12,
            }}>
              {drilledMeeting.title}
            </div>
            <div style={{
              color: 'rgba(255, 215, 153, 0.3)',
              fontSize: 11,
              marginBottom: 16,
            }}>
              {drilledMeeting.participants.join(' · ')}
            </div>

            {/* Moments */}
            {drilledMeeting.moments.slice(0, 8).map((moment) => {
              const relevance = useStore.getState().momentRelevanceMap.get(moment.id) ?? 0;
              return (
                <div
                  key={moment.id}
                  style={{
                    marginBottom: 12,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: relevance > 0.3
                      ? 'rgba(255, 215, 153, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                    borderLeft: `2px solid rgba(255, 215, 153, ${0.1 + relevance * 0.6})`,
                  }}
                >
                  <div style={{
                    color: 'rgba(255, 215, 153, 0.3)',
                    fontSize: 10,
                    marginBottom: 4,
                  }}>
                    {moment.timestamp}
                  </div>
                  <div style={{
                    color: relevance > 0.3 ? '#e8e0d4' : 'rgba(232, 224, 212, 0.5)',
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}>
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
        <div style={{
          position: 'absolute',
          left: 24,
          top: 100,
          width: 280,
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          pointerEvents: 'auto',
        }}>
          <div style={{
            background: 'rgba(10, 10, 18, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 215, 153, 0.1)',
            borderRadius: 12,
            padding: '12px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              color: 'rgba(255, 215, 153, 0.4)',
              fontSize: 10,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}>
              {results.length} matches
            </div>

            {results.slice(0, 10).map((r) => (
              <button
                key={r.meeting.id}
                onClick={() => {
                  drillInto(r.meeting);
                }}
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
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.background = 'rgba(255, 215, 153, 0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.background = 'rgba(255, 255, 255, 0.02)';
                }}
              >
                <div style={{
                  color: '#e8e0d4',
                  fontSize: 12,
                  fontWeight: 500,
                  marginBottom: 2,
                }}>
                  {r.meeting.title}
                </div>
                <div style={{
                  color: 'rgba(255, 215, 153, 0.3)',
                  fontSize: 10,
                }}>
                  {r.meeting.date} · {(r.score * 100).toFixed(0)}% match
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Brand */}
      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
      }}>
        <div style={{
          color: 'rgba(255, 215, 153, 0.25)',
          fontSize: 11,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}>
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
        <span style={{
          opacity: 0.5,
          animation: 'blink 1s infinite',
        }}>
          |
        </span>
      )}
    </span>
  );
}
