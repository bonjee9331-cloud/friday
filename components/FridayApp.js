'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import AppErrorBoundary from './AppErrorBoundary';

const LockScreen   = dynamic(() => import('./LockScreen'),   { ssr: false });
const BootSequence = dynamic(() => import('./BootSequence'), { ssr: false });
const Dashboard    = dynamic(() => import('./Dashboard'),    { ssr: false });
const ChatUI       = dynamic(() => import('./ChatUI'),       { ssr: false });

export default function FridayApp() {
  // If session cookie exists (set by /api/auth/login), skip lock screen.
  // We detect this by pinging a protected endpoint — if it returns 200, we're in.
  const [appState, setAppState] = useState('locked');

  // On mount: silently validate session — skip lock if already authenticated
  useEffect(() => {
    if (appState !== 'locked') return;
    fetch('/api/health', { method: 'GET' })
      .then(r => {
        if (r.ok) {
          // Session cookie is valid — go straight to app
          if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('friday_booted')) {
            setAppState('ready');
          } else {
            setAppState('booting');
          }
        }
      })
      .catch(() => {}); // Stay on lock screen if request fails
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Unified split view — command grid left, neural thread right
  return (
    <AppErrorBoundary>
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden', gap: 0 }}>

        {/* Left — cockpit widget grid */}
        <div style={{ flex: '1 1 0', minWidth: 0, height: '100%', overflow: 'auto', borderRight: '1px solid rgba(0,212,255,0.08)' }}>
          <Dashboard />
        </div>

        {/* Right — neural thread */}
        <div style={{
          width: 360, flexShrink: 0,
          height: '100%', display: 'flex', flexDirection: 'column',
          background: 'rgba(2,8,12,0.6)',
        }}>
          {/* Thread header */}
          <div style={{
            padding: '10px 14px 8px',
            borderBottom: '1px solid rgba(0,212,255,0.08)',
            flexShrink: 0,
          }}>
            <div style={{
              fontFamily: 'var(--font-hud)', fontSize: 8,
              letterSpacing: 4, color: '#00d4ff',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: '#00d4ff', boxShadow: '0 0 5px #00d4ff',
                animation: 'pulse-dot 2s ease-in-out infinite',
                display: 'inline-block',
              }} />
              NEURAL THREAD
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 8,
              color: 'rgba(0,212,255,0.28)', marginTop: 3, letterSpacing: 1,
            }}>BOB · RILEY · SUSAN · DOUG · MAYA</div>
          </div>

          {/* Chat panel */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChatUI />
          </div>
        </div>

      </div>
    </AppErrorBoundary>
  );
}
