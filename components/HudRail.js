'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const RAIL_ITEMS = [
  { href: '/',             icon: '◈', label: 'COMMAND HUB',   colour: '#00d4ff' },
  { href: '/bob',          icon: '◉', label: 'SALES OPS',     colour: '#f59e0b' },
  { href: '/jobs',         icon: '◎', label: 'JOB AUTOPILOT', colour: '#3dd68c' },
  { href: '/tasks',        icon: '▦', label: 'TASKS',          colour: '#60a5fa' },
  { href: '/brain',        icon: '⬡', label: 'BRAIN',         colour: '#c084fc' },
  { href: '/teleprompter', icon: '▤', label: 'TELEPROMPTER',  colour: '#ff6b35' },
  { href: '/settings',     icon: '⚙', label: 'CONFIG',        colour: '#4a6080' },
];

const AGENTS = [
  { key: 'BOB',   colour: '#ff6b35' },
  { key: 'RILEY', colour: '#f59e0b' },
  { key: 'SUSAN', colour: '#3dd68c' },
  { key: 'DOUG',  colour: '#60a5fa' },
  { key: 'MAYA',  colour: '#c084fc' },
];

export default function HudRail() {
  const path = usePathname();
  const [hovered, setHovered] = useState(null);

  return (
    <aside style={{
      position: 'fixed',
      left: 0, top: 44, bottom: 26,
      width: 48,
      zIndex: 100,
      background: 'rgba(2,8,12,0.96)',
      borderRight: '1px solid rgba(0,212,255,0.09)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 6,
    }}>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', flex: 1 }}>
        {RAIL_ITEMS.map((item) => {
          const active = path === item.href;
          const hover  = hovered === item.href;
          return (
            <div key={item.href} style={{ position: 'relative' }}>
              <Link
                href={item.href}
                onMouseEnter={() => setHovered(item.href)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 48, height: 38,
                  textDecoration: 'none',
                  background: active ? `${item.colour}12` : hover ? `${item.colour}07` : 'transparent',
                  borderRight: active ? `2px solid ${item.colour}` : '2px solid transparent',
                  borderLeft: '2px solid transparent',
                  transition: 'all 0.14s',
                }}
              >
                <span style={{
                  fontSize: 15,
                  color: active ? item.colour : hover ? `${item.colour}bb` : 'rgba(74,96,128,0.55)',
                  filter: active ? `drop-shadow(0 0 5px ${item.colour})` : 'none',
                  transition: 'all 0.14s',
                }}>{item.icon}</span>

                {active && (
                  <span style={{
                    position: 'absolute', right: 5, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3, height: 3, borderRadius: '50%',
                    background: item.colour,
                    boxShadow: `0 0 5px ${item.colour}`,
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }} />
                )}
              </Link>

              {/* Hover tooltip */}
              {hover && (
                <div style={{
                  position: 'absolute',
                  left: 52, top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(2,8,12,0.97)',
                  border: `1px solid ${item.colour}35`,
                  borderRadius: 3,
                  padding: '4px 10px',
                  fontFamily: 'var(--font-hud)',
                  fontSize: 8,
                  letterSpacing: 2.5,
                  color: item.colour,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 110,
                  boxShadow: `0 0 14px ${item.colour}18`,
                }}>
                  {item.label}
                </div>
              )}
            </div>
          );
        })}

        <div style={{ height: 1, margin: '6px 12px', background: 'rgba(0,212,255,0.06)' }} />
      </div>

      {/* Agent status dots */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 7, paddingBottom: 10,
      }}>
        {AGENTS.map((a, i) => (
          <div
            key={a.key}
            title={`${a.key} · ONLINE`}
            style={{
              width: 5, height: 5, borderRadius: '50%',
              background: a.colour,
              boxShadow: `0 0 5px ${a.colour}`,
              animation: 'pulse-dot 2.5s ease-in-out infinite',
              animationDelay: `${i * 0.28}s`,
            }}
          />
        ))}
      </div>
    </aside>
  );
}
