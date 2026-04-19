'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AppErrorBoundary from './AppErrorBoundary';

const LockScreen   = dynamic(() => import('./LockScreen'),     { ssr: false });
const BootSequence = dynamic(() => import('./BootSequence'),   { ssr: false });
const FridayCore   = dynamic(() => import('./FridayCore'),     { ssr: false });
const Dashboard    = dynamic(() => import('./Dashboard'),      { ssr: false });
const BobDashboard = dynamic(() => import('./BobDashboard'),   { ssr: false });
const TasksView    = dynamic(() => import('./TasksView'),      { ssr: false });
const JobsView     = dynamic(() => import('./JobsView'),       { ssr: false });
const ChatUI       = dynamic(() => import('./ChatUI'),         { ssr: false });

const TABS = [
  { id: 'overview',   label: 'OVERVIEW',    icon: '◈', hint: 'Command center'  },
  { id: 'voice',      label: 'VOICE',       icon: '◉', hint: 'Neural link'     },
  { id: 'sales',      label: 'SALES OPS',   icon: '▦', hint: 'Floor monitor'   },
  { id: 'jobs',       label: 'JOB HUNT',    icon: '◎', hint: 'Susan autopilot' },
  { id: 'tasks',      label: 'TASKS',       icon: '⬡', hint: 'Doug runner'     },
  { id: 'chat',       label: 'CHAT',        icon: '⌘', hint: 'Direct comms'    },
];

const TAB_COLOURS = {
  overview: '#00d4ff',
  voice:    '#b044ff',
  sales:    '#f59e0b',
  jobs:     '#3dd68c',
  tasks:    '#60a5fa',
  chat:     '#ff6b35',
};

export default function FridayApp() {
  // Skip lock + boot if this session has already completed the boot sequence
  const [state, setState] = useState(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('friday_booted')) {
      return 'ready';
    }
    return 'locked';
  });
  const [tab, setTab] = useState('overview');

  const handleUnlock = useCallback(() => {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('friday_booted')) {
      setState('ready');
    } else {
      setState('booting');
    }
  }, []);
  const handleBooted = useCallback(() => setState('ready'), []);

  if (state === 'locked')  return <AppErrorBoundary><LockScreen   onUnlock={handleUnlock} /></AppErrorBoundary>;
  if (state === 'booting') return <AppErrorBoundary><BootSequence onComplete={handleBooted} /></AppErrorBoundary>;

  const col = TAB_COLOURS[tab] || '#00d4ff';

  return (
    <AppErrorBoundary>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

        {/* ── Tab bar ── */}
        <div style={{
          display: 'flex',
          alignItems: 'stretch',
          borderBottom: `1px solid ${col}28`,
          background: 'rgba(2,6,12,0.98)',
          flexShrink: 0,
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}>
          {TABS.map(({ id, label, icon }) => {
            const active = tab === id;
            const c = TAB_COLOURS[id];
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                title={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '10px 18px',
                  background: active ? `${c}10` : 'transparent',
                  border: 'none',
                  borderBottom: active ? `2px solid ${c}` : '2px solid transparent',
                  borderTop: '2px solid transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-hud)',
                  fontSize: 9,
                  letterSpacing: 2.5,
                  color: active ? c : 'rgba(255,255,255,0.22)',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.18s',
                  flexShrink: 0,
                  textShadow: active ? `0 0 16px ${c}80` : 'none',
                }}
              >
                <span style={{
                  fontSize: 13,
                  opacity: active ? 1 : 0.4,
                  filter: active ? `drop-shadow(0 0 5px ${c})` : 'none',
                  transition: 'all 0.18s',
                }}>{icon}</span>
                {label}
                {active && (
                  <span style={{
                    width: 4, height: 4,
                    borderRadius: '50%',
                    background: c,
                    boxShadow: `0 0 6px ${c}`,
                    animation: 'pulse-dot 2s ease-in-out infinite',
                    marginLeft: 2,
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {tab === 'overview' && <Dashboard />}
          {tab === 'voice'    && <FridayCore />}
          {tab === 'sales'    && <div style={{ height: '100%', overflowY: 'auto', padding: '20px 24px' }}><BobDashboard /></div>}
          {tab === 'jobs'     && <JobsView />}
          {tab === 'tasks'    && <TasksView />}
          {tab === 'chat'     && <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px 20px' }}><ChatUI /></div>}
        </div>
      </div>
    </AppErrorBoundary>
  );
}
