'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const CARD_DEFAULTS = {
  weather:   { x: 60,  y: 60,  visible: true  },
  markets:   { x: 60,  y: 290, visible: true  },
  salesfloor:{ x: 60,  y: 520, visible: false },
  news:      { x: 900, y: 60,  visible: false },
};

const STORAGE_KEY = 'friday_intel_positions';

function loadPositions() {
  try {
    if (typeof localStorage === 'undefined') return CARD_DEFAULTS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return CARD_DEFAULTS;
    return { ...CARD_DEFAULTS, ...JSON.parse(raw) };
  } catch { return CARD_DEFAULTS; }
}
function savePositions(pos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
}

// ── Draggable card shell ──────────────────────────────────────
function IntelCard({ id, title, colour = '#00d4ff', children, pos, onMove, onClose }) {
  const dragRef  = useRef(null);
  const startRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    if (e.target.closest('button, a, input')) return;
    e.preventDefault();
    startRef.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };

    const move = (ev) => {
      if (!startRef.current) return;
      const dx = ev.clientX - startRef.current.mx;
      const dy = ev.clientY - startRef.current.my;
      const nx = Math.max(0, Math.min(window.innerWidth  - 200, startRef.current.ox + dx));
      const ny = Math.max(44, Math.min(window.innerHeight - 80,  startRef.current.oy + dy));
      onMove(id, nx, ny);
    };
    const up = () => {
      startRef.current = null;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, [id, pos, onMove]);

  return (
    <div
      ref={dragRef}
      className="intel-card"
      style={{ left: pos.x, top: pos.y, minWidth: 210, animation: 'hudFadeUp 0.3s ease-out' }}
      onMouseDown={onMouseDown}
    >
      <div className="intel-card-header">
        <span className="intel-card-title">
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: colour, boxShadow: `0 0 5px ${colour}`, display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          {title}
        </span>
        <button className="intel-dismiss" onClick={() => onClose(id)} title="dismiss">✕</button>
      </div>
      {children}
    </div>
  );
}

// ── Weather card ─────────────────────────────────────────────
function WeatherCard({ pos, onMove, onClose }) {
  const [data, setData] = useState(null);
  const WMO = { 0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',51:'Drizzle',61:'Rain',65:'Heavy Rain',80:'Showers',95:'Storm' };

  useEffect(() => {
    fetch('/api/weather').then(r => r.json()).then(setData).catch(() => {});
    const id = setInterval(() => fetch('/api/weather').then(r => r.json()).then(setData).catch(() => {}), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <IntelCard id="weather" title="HUA HIN WEATHER" colour="#00d4ff" pos={pos} onMove={onMove} onClose={onClose}>
      {data ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 30, fontWeight: 100, color: '#00d4ff', lineHeight: 1 }}>{data.temp}°</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.6)' }}>{WMO[data.code] || data.desc}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,212,255,0.45)', lineHeight: 1.8 }}>
            <div>FEELS {data.feels}°  ·  WIND {data.wind} km/h</div>
            <div>RAIN {data.rain}%  ·  HUMIDITY {data.humidity ?? '—'}%</div>
          </div>
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.3)' }}>LOADING...</div>
      )}
    </IntelCard>
  );
}

// ── Markets card ──────────────────────────────────────────────
function MarketsCard({ pos, onMove, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/markets').then(r => r.json()).then(setData).catch(() => {});
    const id = setInterval(() => fetch('/api/markets').then(r => r.json()).then(setData).catch(() => {}), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const tickers = data ? [
    { sym: 'S&P 500', val: data.sp500,  chg: data.sp500_chg  },
    { sym: 'ASX 200', val: data.asx200, chg: data.asx200_chg },
    { sym: 'BTC/USD', val: data.btc,    chg: data.btc_chg    },
    { sym: 'WTI OIL', val: data.oil,    chg: data.oil_chg    },
  ] : [];

  return (
    <IntelCard id="markets" title="MARKETS" colour="#f59e0b" pos={pos} onMove={onMove} onClose={onClose}>
      {data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {tickers.map(t => {
            const up = (t.chg ?? 0) >= 0;
            const col = up ? '#3dd68c' : '#ef4444';
            return (
              <div key={t.sym} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.55)' }}>{t.sym}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-hud)', fontSize: 11, color: '#b8d4e8' }}>
                    {t.val != null ? (t.val > 1000 ? t.val.toLocaleString('en', { maximumFractionDigits: 0 }) : t.val.toFixed(2)) : '—'}
                  </div>
                  {t.chg != null && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: col }}>
                      {up ? '+' : ''}{t.chg.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(245,158,11,0.35)' }}>LOADING...</div>
      )}
    </IntelCard>
  );
}

// ── Sales Floor card ──────────────────────────────────────────
function SalesFloorCard({ pos, onMove, onClose }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const load = () => fetch('/api/sales/rep-stats', {
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MANAGER_AUTH_KEY || ''}` }
    }).then(r => r.json()).then(setStats).catch(() => {});
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const t = stats?.team;
  const kpis = t ? [
    { label: 'B1',   val: `${t.b1 ?? '—'}%`,   ok: (t.b1 ?? 0) >= 90 },
    { label: 'B2',   val: `${t.b2 ?? '—'}%`,   ok: (t.b2 ?? 0) >= 65 },
    { label: 'CANX', val: `${t.canx ?? '—'}%`, ok: (t.canx ?? 99) <= 10 },
  ] : [];

  return (
    <IntelCard id="salesfloor" title="SALES FLOOR · RILEY" colour="#f59e0b" pos={pos} onMove={onMove} onClose={onClose}>
      {t ? (
        <div style={{ display: 'flex', gap: 10 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: 16, color: k.ok ? '#3dd68c' : '#ef4444', lineHeight: 1 }}>{k.val}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(0,212,255,0.4)', marginTop: 3 }}>{k.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(245,158,11,0.35)' }}>LOADING...</div>
      )}
    </IntelCard>
  );
}

// ── News card ──────────────────────────────────────────────────
function NewsCard({ pos, onMove, onClose }) {
  const [headlines, setHeadlines] = useState([]);

  useEffect(() => {
    fetch('/api/news').then(r => r.json())
      .then(d => { if (d?.headlines) setHeadlines(d.headlines); }).catch(() => {});
  }, []);

  return (
    <IntelCard id="news" title="LIVE HEADLINES" colour="#c084fc" pos={pos} onMove={onMove} onClose={onClose}>
      {headlines.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 260 }}>
          {headlines.slice(0, 5).map((h, i) => (
            <div key={i} style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(192,132,252,0.75)',
              lineHeight: 1.5, borderBottom: i < 4 ? '1px solid rgba(192,132,252,0.08)' : 'none',
              paddingBottom: 4,
            }}>
              <span style={{ color: 'rgba(192,132,252,0.4)', marginRight: 5 }}>{i + 1}.</span>{h}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(192,132,252,0.35)' }}>LOADING...</div>
      )}
    </IntelCard>
  );
}

// ── Toggle bar ────────────────────────────────────────────────
const TOGGLE_ITEMS = [
  { id: 'weather',    icon: '◈', label: 'WX'    },
  { id: 'markets',   icon: '▲', label: 'MKT'   },
  { id: 'salesfloor',icon: '◉', label: 'FLOOR' },
  { id: 'news',      icon: '▦', label: 'NEWS'  },
];

// ── Main IntelOverlay ─────────────────────────────────────────
export default function IntelOverlay() {
  const [positions, setPositions] = useState(null);

  useEffect(() => {
    setPositions(loadPositions());
  }, []);

  const handleMove = useCallback((id, x, y) => {
    setPositions(prev => {
      const next = { ...prev, [id]: { ...prev[id], x, y } };
      savePositions(next);
      return next;
    });
  }, []);

  const handleClose = useCallback((id) => {
    setPositions(prev => {
      const next = { ...prev, [id]: { ...prev[id], visible: false } };
      savePositions(next);
      return next;
    });
  }, []);

  const handleToggle = useCallback((id) => {
    setPositions(prev => {
      const next = { ...prev, [id]: { ...prev[id], visible: !prev[id].visible } };
      savePositions(next);
      return next;
    });
  }, []);

  if (!positions) return null;

  return (
    <>
      {/* Draggable cards */}
      {positions.weather.visible    && <WeatherCard    pos={positions.weather}    onMove={handleMove} onClose={handleClose} />}
      {positions.markets.visible    && <MarketsCard    pos={positions.markets}    onMove={handleMove} onClose={handleClose} />}
      {positions.salesfloor.visible && <SalesFloorCard pos={positions.salesfloor} onMove={handleMove} onClose={handleClose} />}
      {positions.news.visible       && <NewsCard       pos={positions.news}       onMove={handleMove} onClose={handleClose} />}

      {/* Toggle bar — sits above ticker, below intel cards */}
      <div style={{
        position: 'fixed',
        bottom: 26, left: 48, right: 0,
        height: 26,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        paddingLeft: 10,
        background: 'rgba(2,8,12,0.92)',
        borderTop: '1px solid rgba(0,212,255,0.07)',
      }}>
        {TOGGLE_ITEMS.map(item => {
          const active = positions[item.id]?.visible;
          return (
            <button
              key={item.id}
              onClick={() => handleToggle(item.id)}
              style={{
                background: active ? 'rgba(0,212,255,0.10)' : 'transparent',
                border: active ? '1px solid rgba(0,212,255,0.22)' : '1px solid transparent',
                borderRadius: 2,
                padding: '2px 8px',
                cursor: 'pointer',
                fontFamily: 'var(--font-hud)',
                fontSize: 7,
                letterSpacing: 2,
                color: active ? '#00d4ff' : 'rgba(0,212,255,0.3)',
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'all 0.14s',
              }}
            >
              <span style={{ fontSize: 9 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
