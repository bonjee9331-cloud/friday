'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const LINKS = [
  { href: '/',           label: 'COMMAND',  hint: 'Main interface',   icon: '◈' },
  { href: '/bob',        label: 'BOB OPS',  hint: 'Sales floor',      icon: '◉' },
  { href: '/jobs',       label: 'AUTOPILOT',hint: 'Job hunting',       icon: '◎' },
  { href: '/tasks',      label: 'TASKS',    hint: 'Daily runner',      icon: '▦' },
  { href: '/brain',      label: 'BRAIN',    hint: 'Neural debug',      icon: '⬡' },
  { href: '/settings',   label: 'CONFIG',   hint: 'System settings',   icon: '⚙' },
];

const AGENTS = [
  { key: 'BOB',   colour: '#ff6b35', label: 'EXEC' },
  { key: 'SUSAN', colour: '#3dd68c', label: 'JOBS' },
  { key: 'DOUG',  colour: '#60a5fa', label: 'LAW'  },
  { key: 'RILEY', colour: '#f59e0b', label: 'SALES' },
  { key: 'MAYA',  colour: '#c084fc', label: 'INTEL' },
];

function Clock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-AU', { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{
      fontFamily: 'var(--font-hud)',
      fontSize: 22,
      letterSpacing: 3,
      color: 'var(--cyan)',
      textShadow: '0 0 20px rgba(0,212,255,0.7)',
      textAlign: 'center',
      padding: '14px 0 6px',
    }}>{time || '00:00:00'}</div>
  );
}

export default function FridayNav() {
  const path = usePathname();

  return (
    <aside className="sidebar" style={{ position: 'relative' }}>

      {/* Brand */}
      <div className="brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-logo">F</div>
          <div>
            <div className="brand-name">FRIDAY</div>
            <div className="brand-sub">AUTONOMOUS SYSTEM · v6</div>
          </div>
        </div>
        <Clock />
      </div>

      {/* Nav links */}
      <nav className="nav">
        {LINKS.map((l) => {
          const active = path === l.href;
          return (
            <Link key={l.href} href={l.href} className="nav-link" style={{
              background: active ? 'rgba(0,212,255,0.08)' : undefined,
              borderColor: active ? 'rgba(0,212,255,0.3)' : undefined,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 16,
                  color: active ? 'var(--cyan)' : 'var(--text-dim)',
                  width: 20,
                  textAlign: 'center',
                  transition: 'color 0.2s',
                }}>{l.icon}</span>
                <div>
                  <div className="nav-label" style={{ color: active ? 'var(--cyan)' : undefined }}>
                    {l.label}
                  </div>
                  <div className="nav-hint">{l.hint}</div>
                </div>
                {active && (
                  <div style={{
                    marginLeft: 'auto',
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: 'var(--cyan)',
                    boxShadow: '0 0 8px var(--cyan)',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }} />
                )}
              </div>
              {active && (
                <div style={{
                  position: 'absolute',
                  left: 0, top: 0, bottom: 0,
                  width: 2,
                  background: 'linear-gradient(180deg, transparent, var(--cyan), transparent)',
                }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Agent roster */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          fontFamily: 'var(--font-hud)',
          fontSize: 8,
          letterSpacing: 3,
          color: 'var(--text-dim)',
          marginBottom: 10,
        }}>ACTIVE AGENTS</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {AGENTS.map(a => (
            <div key={a.key} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}>
              <div style={{
                width: 28, height: 28,
                borderRadius: '50%',
                border: `1px solid ${a.colour}66`,
                background: `${a.colour}12`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 8px ${a.colour}40`,
              }}>
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: a.colour,
                  boxShadow: `0 0 6px ${a.colour}`,
                  animation: 'pulse-dot 2s ease-in-out infinite',
                  animationDelay: `${AGENTS.indexOf(a) * 0.4}s`,
                }} />
              </div>
              <span style={{
                fontFamily: 'var(--font-hud)',
                fontSize: 7,
                letterSpacing: 1,
                color: a.colour,
              }}>{a.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="status">
        <span className="status-dot" />
        <span>SYS ONLINE</span>
        <span style={{ marginLeft: 'auto', color: 'rgba(0,212,255,0.3)', fontSize: 8 }}>
          {new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }).toUpperCase()}
        </span>
      </div>
    </aside>
  );
}
