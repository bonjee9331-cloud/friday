'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AppErrorBoundary from './AppErrorBoundary';

const LockScreen   = dynamic(() => import('./LockScreen'),   { ssr: false });
const BootSequence = dynamic(() => import('./BootSequence'), { ssr: false });
const Dashboard    = dynamic(() => import('./Dashboard'),    { ssr: false });
const ChatUI       = dynamic(() => import('./ChatUI'),       { ssr: false });

export default function FridayApp() {
  const [appState, setAppState] = useState(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('friday_booted')) return 'ready';
    return 'locked';
  });

  const [mode, setMode] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const m = localStorage.getItem('friday_mode');
      if (m === 'thread' || m === 'cockpit') return m;
    }
    return 'cockpit';
  });

  // Listen for mode changes from HudTopbar
  useEffect(() => {
    const handler = (e) => {
      if (e.detail === 'cockpit' || e.detail === 'thread') setMode(e.detail);
    };
    window.addEventListener('friday-mode', handler);
    return () => window.removeEventListener('friday-mode', handler);
  }, []);

  const handleUnlock = useCallback(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('friday_booted')) {
      setAppState('ready');
    } else {
      setAppState('booting');
    }
  }, []);

  const handleBooted = useCallback(() => setAppState('ready'), []);

  if (appState === 'locked')  return <AppErrorBoundary><LockScreen   onUnlock={handleUnlock} /></AppErrorBoundary>;
  if (appState === 'booting') return <AppErrorBoundary><BootSequence onComplete={handleBooted} /></AppErrorBoundary>;

  return (
    <AppErrorBoundary>
      <div style={{ height: '100%', overflow: 'hidden' }}>

        {/* COCKPIT mode — widget grid */}
        {mode === 'cockpit' && (
          <div style={{ height: '100%', overflow: 'auto' }}>
            <Dashboard />
          </div>
        )}

        {/* THREAD mode — agent chat */}
        {mode === 'thread' && (
          <div style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            padding: '16px 20px',
          }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontFamily: 'var(--font-hud)', fontSize: 8,
                letterSpacing: 4, color: 'rgba(0,212,255,0.4)',
              }}>NEURAL THREAD — DIRECT COMMS</div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 9,
                color: 'rgba(0,212,255,0.25)', marginTop: 3,
              }}>Route queries to BOB · RILEY · SUSAN · DOUG · MAYA</div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <ChatUI />
            </div>
          </div>
        )}

      </div>
    </AppErrorBoundary>
  );
}
