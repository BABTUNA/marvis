import { useEffect } from 'react';
import { GalaxyScene } from './components/GalaxyScene';
import { SearchOverlay } from './components/SearchOverlay';
import { useStore } from './store';
import type { MeetingsData } from './types';

function App() {
  const setData = useStore((s) => s.setData);
  const loading = useStore((s) => s.loading);

  useEffect(() => {
    fetch('/meetings.json')
      .then((res) => res.json())
      .then((data: MeetingsData) => {
        setData(data);
      })
      .catch((err) => {
        console.error('Failed to load meetings data:', err);
      });
  }, [setData]);

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#050508',
        color: 'rgba(255, 215, 153, 0.4)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 14,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
      }}>
        loading galaxy...
      </div>
    );
  }

  return (
    <>
      <GalaxyScene />
      <SearchOverlay />
    </>
  );
}

export default App;
