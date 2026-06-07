import { useEffect, useState } from 'react';
import { GalaxyScene } from './components/GalaxyScene';
import { SearchOverlay } from './components/SearchOverlay';
import { DemoMode } from './components/DemoMode';
import { useStore } from './store';
import type { MeetingsData } from './types';

function App() {
  const setData = useStore((s) => s.setData);
  const loading = useStore((s) => s.loading);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    fetch('/meetings.json')
      .then((res) => res.json())
      .then((data: MeetingsData) => {
        setData(data);
        // Slight delay before fading the loading screen
        setTimeout(() => setFadeOut(true), 300);
      })
      .catch((err) => {
        console.error('Failed to load meetings data:', err);
      });
  }, [setData]);

  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#050508',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          gap: 24,
        }}
      >
        <div
          style={{
            color: 'rgba(255, 215, 153, 0.6)',
            fontSize: 28,
            fontWeight: 300,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
          }}
        >
          orrery
        </div>
        <div
          style={{
            color: 'rgba(255, 215, 153, 0.2)',
            fontSize: 12,
            letterSpacing: '0.15em',
          }}
        >
          mapping your conversations...
        </div>
        <div
          style={{
            width: 120,
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255, 215, 153, 0.3), transparent)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scaleX(0.5); }
            50% { opacity: 1; transform: scaleX(1); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      {/* Fade-in overlay that dissolves */}
      {!fadeOut && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#050508',
            zIndex: 100,
            transition: 'opacity 1.5s ease-out',
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      <GalaxyScene />
      <SearchOverlay />
      <DemoMode />
    </>
  );
}

export default App;
