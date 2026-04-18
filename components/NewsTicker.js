'use client';

import { useEffect, useRef, useState } from 'react';

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    const load = () =>
      fetch('/api/news').then(r => r.json())
        .then(d => { if (Array.isArray(d?.headlines)) setHeadlines(d.headlines); })
        .catch(() => {});
    load();
    const id = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!headlines.length) return null;

  const text = headlines.join('   ·//·   ') + '   ·//·   ';
  const duration = headlines.length * 9;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 26, overflow: 'hidden',
      background: 'rgba(1,5,9,0.97)',
      borderTop: '1px solid rgba(0,212,255,0.15)',
      display: 'flex', alignItems: 'center',
      backdropFilter: 'blur(10px)',
    }}>
      {/* Label */}
      <div style={{
        flexShrink: 0,
        padding: '0 14px',
        fontFamily: 'var(--font-hud)',
        fontSize: 8, letterSpacing: 4,
        color: 'var(--cyan)',
        borderRight: '1px solid rgba(0,212,255,0.2)',
        whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--red)', boxShadow: '0 0 6px var(--red)', display: 'inline-block', animation: 'pulse-dot 1s ease-in-out infinite' }} />
        LIVE FEED
      </div>

      {/* Scrolling text */}
      <div style={{ overflow: 'hidden', flex: 1, position: 'relative' }}>
        <div style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-mono)',
          fontSize: 9, letterSpacing: 1.5,
          color: 'rgba(0,212,255,0.55)',
          animation: `ticker ${duration}s linear infinite`,
          paddingLeft: '100%',
        }}>
          {text}
        </div>
      </div>

      {/* Right edge decoration */}
      <div style={{
        flexShrink: 0, padding: '0 12px',
        fontFamily: 'var(--font-mono)', fontSize: 8,
        color: 'rgba(0,212,255,0.25)',
        borderLeft: '1px solid rgba(0,212,255,0.1)',
        whiteSpace: 'nowrap',
      }}>
        {new Date().toLocaleTimeString('en-AU', { hour12: false, hour: '2-digit', minute: '2-digit' })}
      </div>

      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-100%); } }`}</style>
    </div>
  );
}
