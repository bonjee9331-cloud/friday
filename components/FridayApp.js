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

  return (
    <AppErrorBoundary>
      <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
        {/* tab bar */}
        <div style={{
          display:'flex', gap:0,
          borderBottom:'1px solid rgba(255,107,53,0.15)',
          background:'rgba(11,13,18,0.9)',
          flexShrink:0,
        }}>
          {[['dashboard','DASHBOARD'],['chat','CHAT']].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} style={{
              padding:'8px 20px',
              fontSize:10, letterSpacing:3,
              background:'none', border:'none', cursor:'pointer',
              color: view === id ? '#ff6b35' : 'rgba(255,107,53,0.4)',
              borderBottom: view === id ? '2px solid #ff6b35' : '2px solid transparent',
              transition:'all 0.2s',
            }}>{label}</button>
          ))}
        </div>
        <div style={{ flex:1, overflow:'hidden' }}>
          {view === 'dashboard' ? <Dashboard /> : <FridayCore />}
        </div>
      </div>
    </AppErrorBoundary>
  );
}
