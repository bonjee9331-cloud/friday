'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const AGENTS = [
  { key: 'BOB',   colour: '#ff6b35' },
  { key: 'RILEY', colour: '#f59e0b' },
  { key: 'SUSAN', colour: '#3dd68c' },
  { key: 'DOUG',  colour: '#60a5fa' },
  { key: 'MAYA',  colour: '#c084fc' },
];

export default function HudTopbar({ mode, onModeChange }) {
  const path = usePathname();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-AU', { hour12: false }));
      setDate(now.toLocaleDateString('en-AU', {
        weekday: 'short', day: '2-digit', month: 'short',
      }).toUpperCase());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isHome = path === '/';

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      height: 44,
      zIndex: 100,
      background: 'rgba(2,8,12,0.97)',
      borderBottom: '1px solid rgba(0,212,255,0.10)',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 16,
      paddingRight: 16,
      backdropFilter: 'blur(12px)',
      gap: 0,
    }}>
      {/* Brand */}
      <div style={{
        fontFamily: 'var(--font-hud)',
        fontSize: 12, fontWeight: 900,
        letterSpacing: 7,
        color: '#00d4ff',
        textShadow: '0 0 18px rgba(0,212,255,0.55)',
        marginRight: 14, flexShrink: 0,
      }}>FRIDAY</div>

      <div style={{ width: 1, height: 18, background: 'rgba(0,212,255,0.10)', marginRight: 12 }} />

      {/* Live indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontFamily: 'var(--font-mono)',
        fontSize: 7, letterSpacing: 2.5,
        color: 'rgba(0,212,255,0.4)',
        marginRight: 14, flexShrink: 0,
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#3dd68c', boxShadow: '0 0 6px #3dd68c',
          animation: 'pulse-dot 1.5s ease-in-out infinite',
          display: 'inline-block',
        }} />
        INTEL LIVE
      </div>

      {/* Current page label */}
      {isHome && (
        <>
          <div style={{ width: 1, height: 18, background: 'rgba(0,212,255,0.10)', marginRight: 12 }} />
          <div style={{
            fontFamily: 'var(--font-hud)', fontSize: 7, letterSpacing: 3,
            color: 'rgba(0,212,255,0.35)', marginRight: 12, flexShrink: 0,
          }}>COMMAND · NEURAL</div>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Agent dots */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginRight: 14 }}>
        {AGENTS.map((a, i) => (
          <div key={a.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: a.colour, boxShadow: `0 0 5px ${a.colour}`,
              animation: 'pulse-dot 2.5s ease-in-out infinite',
              animationDelay: `${i * 0.28}s`,
            }} />
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 5,
              letterSpacing: 0.5, color: a.colour, opacity: 0.65,
            }}>{a.key}</span>
          </div>
        ))}
      </div>

      <div style={{ width: 1, height: 18, background: 'rgba(0,212,255,0.10)', marginRight: 12 }} />

      {/* Clock */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontFamily: 'var(--font-hud)', fontSize: 12,
          letterSpacing: 2, color: '#00d4ff',
          textShadow: '0 0 10px rgba(0,212,255,0.35)',
          lineHeight: 1,
        }}>{time || '00:00:00'}</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 6,
          letterSpacing: 2, color: 'rgba(0,212,255,0.35)',
          marginTop: 2,
        }}>{date}</div>
      </div>
    </div>
  );
}
