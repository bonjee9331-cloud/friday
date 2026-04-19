'use client';

import { useEffect, useState } from 'react';

function StatPill({ label, value, ok, pulse }) {
  const colour = ok === null ? 'rgba(0,212,255,0.45)' : ok ? '#3dd68c' : '#ef4444';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      padding: '0 8px',
      borderRight: '1px solid rgba(0,212,255,0.08)',
      flexShrink: 0,
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: 1.5, color: 'rgba(0,212,255,0.35)' }}>{label}</span>
      <span style={{
        fontFamily: 'var(--font-hud)', fontSize: 9, letterSpacing: 0.5,
        color: colour,
        textShadow: ok !== null ? `0 0 6px ${colour}60` : 'none',
        animation: pulse ? 'pulse-dot 2s ease-in-out infinite' : 'none',
      }}>{value ?? '—'}</span>
    </div>
  );
}

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState([]);
  const [stats,     setStats]     = useState(null);
  const [markets,   setMarkets]   = useState(null);
  const [weather,   setWeather]   = useState(null);

  useEffect(() => {
    const loadNews = () =>
      fetch('/api/news').then(r => r.json())
        .then(d => { if (Array.isArray(d?.headlines)) setHeadlines(d.headlines); })
        .catch(() => {});

    const loadStats = () =>
      fetch('/api/sales/rep-stats', {
        headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MANAGER_AUTH_KEY || ''}` },
      }).then(r => r.json()).then(setStats).catch(() => {});

    const loadMarkets = () =>
      fetch('/api/markets').then(r => r.json()).then(setMarkets).catch(() => {});

    const loadWx = () =>
      fetch('/api/weather').then(r => r.json()).then(setWeather).catch(() => {});

    loadNews(); loadStats(); loadMarkets(); loadWx();

    const ids = [
      setInterval(loadNews,    15 * 60 * 1000),
      setInterval(loadStats,    5 * 60 * 1000),
      setInterval(loadMarkets,  5 * 60 * 1000),
      setInterval(loadWx,      10 * 60 * 1000),
    ];
    return () => ids.forEach(clearInterval);
  }, []);

  const team  = stats?.team;
  const b1Ok  = team?.b1  != null ? team.b1  >= 90  : null;
  const b2Ok  = team?.b2  != null ? team.b2  >= 65  : null;
  const cxOk  = team?.canx != null ? team.canx <= 10 : null;

  const text = headlines.length
    ? headlines.join('   ·//·   ') + '   ·//·   '
    : 'SCANNING FEEDS...   ';
  const duration = Math.max(20, (headlines.length || 2) * 9);

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      height: 26, overflow: 'hidden',
      background: 'rgba(1,5,9,0.97)',
      borderTop: '1px solid rgba(0,212,255,0.10)',
      display: 'flex', alignItems: 'center',
      backdropFilter: 'blur(10px)',
    }}>

      {/* Left: LIVE label */}
      <div style={{
        flexShrink: 0, padding: '0 10px',
        fontFamily: 'var(--font-hud)',
        fontSize: 7, letterSpacing: 3.5,
        color: 'var(--cyan)',
        borderRight: '1px solid rgba(0,212,255,0.12)',
        display: 'flex', alignItems: 'center', gap: 5, height: '100%',
      }}>
        <span style={{
          width: 4, height: 4, borderRadius: '50%',
          background: '#ef4444', boxShadow: '0 0 5px #ef4444',
          display: 'inline-block', animation: 'pulse-dot 1s ease-in-out infinite',
        }} />
        LIVE
      </div>

      {/* Stat pills */}
      {team && (
        <>
          <StatPill label="B1"   value={team.b1   != null ? `${team.b1}%`  : null} ok={b1Ok}  />
          <StatPill label="B2"   value={team.b2   != null ? `${team.b2}%`  : null} ok={b2Ok}  />
          <StatPill label="CANX" value={team.canx != null ? `${team.canx}%`: null} ok={cxOk}  />
          <StatPill label="REPS" value={stats?.reps?.length ?? null}                ok={null}  />
        </>
      )}
      {markets?.btc != null && (
        <StatPill
          label="BTC"
          value={`$${Math.round(markets.btc).toLocaleString()}`}
          ok={(markets.btc_chg ?? 0) >= 0}
        />
      )}
      {weather?.temp != null && (
        <StatPill label="WX" value={`${weather.temp}°`} ok={null} />
      )}

      {/* Spacer between stats and scrolling text */}
      <div style={{ width: 1, height: 16, background: 'rgba(0,212,255,0.08)', marginLeft: 2, flexShrink: 0 }} />

      {/* Scrolling headlines */}
      <div style={{ overflow: 'hidden', flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div key={headlines.length} style={{
          display: 'inline-block', whiteSpace: 'nowrap',
          fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1.5,
          color: 'rgba(0,212,255,0.48)',
          animation: `ticker ${duration}s linear infinite`,
          paddingLeft: '100%',
        }}>
          {text}
        </div>
      </div>

      {/* Right: timestamp */}
      <div style={{
        flexShrink: 0, padding: '0 10px',
        fontFamily: 'var(--font-mono)', fontSize: 7,
        color: 'rgba(0,212,255,0.2)',
        borderLeft: '1px solid rgba(0,212,255,0.08)',
        whiteSpace: 'nowrap',
      }}>
        {new Date().toLocaleTimeString('en-AU', { hour12: false, hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
