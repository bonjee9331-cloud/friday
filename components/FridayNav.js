'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_GROUPS = [
  {
    heading: 'COMMAND',
    links: [
      { href: '/',    label: 'Main Hub',    hint: 'Overview + all tabs', icon: '◈', colour: '#00d4ff' },
    ],
  },
  {
    heading: 'AGENTS',
    links: [
      { href: '/bob',   label: 'Sales Ops',   hint: 'RILEY · floor monitor',  icon: '◉', colour: '#f59e0b' },
      { href: '/s3',    label: 'S3 Content',  hint: 'Savage Sales School',     icon: '▲', colour: '#D4352C' },
      { href: '/tasks', label: 'Tasks',       hint: 'DOUG · daily runner',     icon: '▦', colour: '#60a5fa' },
    ],
  },
  {
    heading: 'JOB HUNT',
    links: [
      { href: '/jobs',         label: 'Job Hunt',     hint: 'SUSAN · autopilot',  icon: '◎', colour: '#3dd68c' },
      { href: '/packages',     label: 'Packages',     hint: 'Application vault',  icon: '◧', colour: '#3dd68c' },
      { href: '/brain',        label: 'Brain',        hint: 'MAYA · job analysis',icon: '⬡', colour: '#c084fc' },
      { href: '/teleprompter', label: 'Teleprompter', hint: 'Script overlay',     icon: '▤', colour: '#ff6b35' },
      { href: '/settings',     label: 'Config',       hint: 'Keys + integrations',icon: '⚙', colour: '#4a6080' },
    ],
  },
];

const AGENTS = [
  { key: 'BOB',   colour: '#ff6b35', label: 'BOB'   },
  { key: 'SUSAN', colour: '#3dd68c', label: 'SUSAN' },
  { key: 'DOUG',  colour: '#60a5fa', label: 'DOUG'  },
  { key: 'RILEY', colour: '#f59e0b', label: 'RILEY' },
  { key: 'MAYA',  colour: '#c084fc', label: 'MAYA'  },
];

function Clock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-AU', { hour12: false }));
      setDate(now.toLocaleDateString('en-AU', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ textAlign: 'center', paddingTop: 10 }}>
      <div style={{
        fontFamily: 'var(--font-hud)',
        fontSize: 20,
        letterSpacing: 2,
        color: 'var(--cyan)',
        lineHeight: 1,
      }}>{time || '00:00:00'}</div>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 8,
        letterSpacing: 2,
        color: 'var(--text-dim)',
        marginTop: 4,
      }}>{date}</div>
    </div>
  );
}

export default function FridayNav() {
  const path = usePathname();

  return (
    <aside className="sidebar">

      {/* Brand */}
      <div className="brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-logo">F</div>
          <div>
            <div className="brand-name">FRIDAY</div>
            <div className="brand-sub">AUTONOMOUS · v7</div>
          </div>
        </div>
        <Clock />
      </div>

      {/* Grouped navigation */}
      <nav className="nav" style={{ paddingTop: 10, paddingBottom: 10 }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.heading} style={{ marginBottom: 4 }}>

            {/* Section heading */}
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 7,
              letterSpacing: 3,
              color: 'rgba(74,96,128,0.7)',
              padding: '8px 14px 4px',
              textTransform: 'uppercase',
              userSelect: 'none',
            }}>
              {group.heading}
            </div>

            {/* Links in this group */}
            {group.links.map((l) => {
              const active = path === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="nav-link"
                  style={{
                    background: active ? `${l.colour}0d` : undefined,
                    borderColor: active ? `${l.colour}35` : undefined,
                  }}
                >
                  {/* Active left bar */}
                  {active && (
                    <div style={{
                      position: 'absolute',
                      left: 0, top: 4, bottom: 4,
                      width: 2,
                      background: l.colour,
                      borderRadius: 1,
                    }} />
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 15,
                      color: active ? l.colour : 'rgba(74,96,128,0.7)',
                      width: 18,
                      textAlign: 'center',
                      transition: 'color 0.15s',
                      filter: active ? `drop-shadow(0 0 4px ${l.colour})` : 'none',
                    }}>{l.icon}</span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="nav-label" style={{
                        color: active ? l.colour : undefined,
                        fontSize: 11,
                      }}>
                        {l.label}
                      </div>
                      <div className="nav-hint">{l.hint}</div>
                    </div>

                    {active && (
                      <div style={{
                        width: 5, height: 5,
                        borderRadius: '50%',
                        background: l.colour,
                        boxShadow: `0 0 6px ${l.colour}`,
                        animation: 'pulse-dot 2s ease-in-out infinite',
                        flexShrink: 0,
                      }} />
                    )}
                  </div>
                </Link>
              );
            })}

            {/* Divider between groups (not after last) */}
            <div style={{
              height: 1,
              margin: '6px 14px 2px',
              background: 'rgba(0,212,255,0.05)',
            }} />
          </div>
        ))}
      </nav>

      {/* Agent status strip */}
      <div style={{
        padding: '10px 14px 12px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 7,
          letterSpacing: 3,
          color: 'rgba(74,96,128,0.7)',
          marginBottom: 8,
          textTransform: 'uppercase',
        }}>Active Agents</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {AGENTS.map((a, i) => (
            <div key={a.key} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: a.colour,
                boxShadow: `0 0 5px ${a.colour}`,
                animation: 'pulse-dot 2.5s ease-in-out infinite',
                animationDelay: `${i * 0.3}s`,
                flexShrink: 0,
              }} />
              <span style={{
                fontFamily: 'var(--font-ui)',
                fontWeight: 600,
                fontSize: 11,
                letterSpacing: 1,
                color: a.colour,
                opacity: 0.85,
              }}>{a.key}</span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 8,
                color: 'rgba(74,96,128,0.6)',
                marginLeft: 'auto',
                letterSpacing: 0.5,
              }}>ONLINE</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status bar */}
      <div className="status">
        <span className="status-dot" />
        <span style={{ fontSize: 9, letterSpacing: 1 }}>SYS ONLINE</span>
      </div>
    </aside>
  );
}
