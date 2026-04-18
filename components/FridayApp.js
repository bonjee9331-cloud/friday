'use client';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AppErrorBoundary from './AppErrorBoundary';

const LockScreen   = dynamic(() => import('./LockScreen'),   { ssr: false });
const BootSequence = dynamic(() => import('./BootSequence'), { ssr: false });
const FridayCore   = dynamic(() => import('./FridayCore'),   { ssr: false });
const Dashboard    = dynamic(() => import('./Dashboard'),    { ssr: false });

export default function FridayApp() {
  const [state, setState] = useState('locked');
  const [view, setView]   = useState('dashboard'); // 'dashboard' | 'chat'

  const handleUnlock = useCallback(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('friday_booted')) {
      setState('ready');
    } else {
      setState('booting');
    }
  }, []);
  const handleBooted = useCallback(() => setState('ready'), []);

  if (state === 'locked')   return <AppErrorBoundary><LockScreen onUnlock={handleUnlock} /></AppErrorBoundary>;
  if (state === 'booting')  return <AppErrorBoundary><BootSequence onComplete={handleBooted} /></AppErrorBoundary>;

  const TABS = [
    { id: 'dashboard', label: 'COMMAND CENTER', icon: '◈' },
    { id: 'chat',      label: 'NEURAL LINK',    icon: '◉' },
  ];

  return (
    <AppErrorBoundary>
      <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
        {/* Tab bar */}
        <div style={{
          display:'flex', alignItems:'center', gap:0,
          borderBottom:'1px solid rgba(0,212,255,0.15)',
          background:'rgba(4,12,20,0.97)',
          flexShrink:0, position:'relative',
          backdropFilter:'blur(10px)',
        }}>
          {/* Horizontal scan line */}
          <div style={{
            position:'absolute', bottom:0, left:0, right:0, height:1,
            background:'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)',
          }} />
          {TABS.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setView(id)} style={{
              padding:'10px 24px',
              fontSize:9, letterSpacing:3,
              background:'none', border:'none', cursor:'pointer',
              fontFamily:'var(--font-hud)',
              color: view === id ? 'var(--cyan)' : 'rgba(0,212,255,0.3)',
              borderBottom: view === id ? '2px solid var(--cyan)' : '2px solid transparent',
              transition:'all 0.2s',
              display:'flex', alignItems:'center', gap:8,
              boxShadow: view === id ? 'inset 0 -2px 12px rgba(0,212,255,0.1)' : 'none',
            }}>
              <span style={{ filter: view === id ? 'drop-shadow(0 0 6px var(--cyan))' : 'none' }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflow:'hidden' }}>
          {view === 'dashboard' ? <Dashboard /> : <FridayCore />}
        </div>
      </div>
    </AppErrorBoundary>
  );
}
