'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const CARD_DEFAULTS = {
  weather:    { x: 65,  y: 70,  visible: true  },
  markets:    { x: 65,  y: 340, visible: true  },
  salesfloor: { x: 65,  y: 590, visible: false },
  news:       { x: 920, y: 70,  visible: false },
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

// ── Draggable card shell ──────────────────────────────────────────────────────
function IntelCard({ id, title, colour = '#00d4ff', badge, children, pos, onMove, onClose }) {
  const startRef = useRef(null);

  const onMouseDown = useCallback((e) => {
    if (e.target.closest('button, a, input')) return;
    e.preventDefault();
    startRef.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
    const move = (ev) => {
      if (!startRef.current) return;
      const dx = ev.clientX - startRef.current.mx;
      const dy = ev.clientY - startRef.current.my;
      const nx = Math.max(0, Math.min(window.innerWidth  - 240, startRef.current.ox + dx));
      const ny = Math.max(44, Math.min(window.innerHeight - 100, startRef.current.oy + dy));
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
      style={{
        position: 'fixed',
        left: pos.x, top: pos.y,
        minWidth: 240,
        maxWidth: 300,
        background: 'rgba(2,10,18,0.97)',
        border: `1px solid ${colour}44`,
        borderRadius: 6,
        backdropFilter: 'blur(14px)',
        cursor: 'move',
        userSelect: 'none',
        zIndex: 50,
        animation: 'hudSlideIn 0.25s ease-out',
        overflow: 'hidden',
        boxShadow: `0 0 24px ${colour}18, inset 0 0 40px rgba(0,0,0,0.3)`,
      }}
      onMouseDown={onMouseDown}
    >
      {/* Top accent line */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, transparent, ${colour}, transparent)`,
        opacity: 0.7,
      }} />

      {/* Corner brackets */}
      <div style={{ position: 'absolute', top: 2,  left: 0,  width: 12, height: 12, borderTop:  `1px solid ${colour}`, borderLeft:  `1px solid ${colour}`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 2,  right: 0, width: 12, height: 12, borderTop:  `1px solid ${colour}`, borderRight: `1px solid ${colour}`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderBottom: `1px solid ${colour}`, borderLeft:  `1px solid ${colour}`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0,width: 12, height: 12, borderBottom: `1px solid ${colour}`, borderRight: `1px solid ${colour}`, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 12px 6px',
        borderBottom: `1px solid ${colour}18`,
        background: `rgba(0,0,0,0.2)`,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: colour, boxShadow: `0 0 6px ${colour}`, animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: 7.5, letterSpacing: 2.5, color: colour, flex: 1, textTransform: 'uppercase' }}>{title}</span>
        {badge && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: `${colour}80`, letterSpacing: 1 }}>{badge}</span>}
        <button
          onClick={() => onClose(id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: `${colour}60`, fontFamily: 'var(--font-mono)', fontSize: 10, padding: '0 2px', transition: 'color 0.15s', lineHeight: 1 }}
          onMouseEnter={e => e.currentTarget.style.color = colour}
          onMouseLeave={e => e.currentTarget.style.color = `${colour}60`}
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 12px 12px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Weather card (with radar animation) ──────────────────────────────────────
function WeatherCard({ pos, onMove, onClose }) {
  const [data, setData] = useState(null);
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const WMO = { 0: '☀ Clear', 1: '🌤 Mostly Clear', 2: '⛅ Partly Cloudy', 3: '☁ Overcast', 45: '🌫 Fog', 51: '🌦 Drizzle', 61: '🌧 Rain', 65: '⛈ Heavy Rain', 80: '🌦 Showers', 95: '⛈ Storm' };

  useEffect(() => {
    fetch('/api/weather').then(r => r.json()).then(setData).catch(() => {});
    const id = setInterval(() => fetch('/api/weather').then(r => r.json()).then(setData).catch(() => {}), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 3;
    let t = 0;
    const frame = () => {
      t++;
      ctx.clearRect(0, 0, W, H);
      [0.33, 0.66, 1.0].forEach(f => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,212,255,0.12)';
        ctx.lineWidth = 0.6;
        ctx.stroke();
      });
      const sweep = (t * 0.022) % (Math.PI * 2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, sweep - 0.9, sweep);
      ctx.closePath();
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, 'rgba(0,212,255,0)');
      g.addColorStop(1, 'rgba(0,212,255,0.12)');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(R * Math.cos(sweep), R * Math.sin(sweep));
      ctx.strokeStyle = 'rgba(0,212,255,0.75)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00d4ff';
      ctx.fill();
      animRef.current = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <IntelCard id="weather" title="HUA HIN WEATHER" colour="#00d4ff" badge="LIVE" pos={pos} onMove={onMove} onClose={onClose}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <canvas ref={canvasRef} width={56} height={56} style={{ flexShrink: 0 }} />
        {data ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-hud)', fontSize: 32, fontWeight: 100, color: '#00d4ff', lineHeight: 1, textShadow: '0 0 16px rgba(0,212,255,0.5)' }}>{data.temp}°</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'rgba(0,212,255,0.6)' }}>{WMO[data.code] || data.desc}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,212,255,0.45)', lineHeight: 1.9, letterSpacing: 0.3 }}>
              <div>FEELS {data.feels}°  ·  WIND {data.wind} km/h</div>
              <div>RAIN {data.rain}%  ·  HUM {data.humidity ?? '—'}%</div>
            </div>
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.3)' }}>ACQUIRING...</div>
        )}
      </div>
    </IntelCard>
  );
}

// ── Markets card ──────────────────────────────────────────────────────────────
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
    <IntelCard id="markets" title="GLOBAL MARKETS" colour="#f59e0b" badge="LIVE" pos={pos} onMove={onMove} onClose={onClose}>
      {data ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tickers.map(t => {
            const up  = (t.chg ?? 0) >= 0;
            const col = up ? '#3dd68c' : '#ef4444';
            return (
              <div key={t.sym} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 7px',
                background: `rgba(245,158,11,0.03)`,
                border: '1px solid rgba(245,158,11,0.07)',
                borderRadius: 3,
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8.5, color: 'rgba(0,212,255,0.6)' }}>{t.sym}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-hud)', fontSize: 12, color: '#b8d4e8' }}>
                    {t.val != null ? (t.val > 1000 ? t.val.toLocaleString('en', { maximumFractionDigits: 0 }) : t.val.toFixed(2)) : '—'}
                  </div>
                  {t.chg != null && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, color: col }}>
                      {up ? '▲' : '▼'} {Math.abs(t.chg).toFixed(2)}%
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

// ── Sales Floor card ──────────────────────────────────────────────────────────
function SalesFloorCard({ pos, onMove, onClose }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    const load = () => fetch('/api/sales/rep-stats', {
      headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MANAGER_AUTH_KEY || ''}` },
    }).then(r => r.json()).then(setStats).catch(() => {});
    load();
    const id = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const t = stats?.team;
  const kpis = t ? [
    { label: 'B1',   val: `${t.b1 ?? '—'}%`,   ok: (t.b1 ?? 0) >= 90  },
    { label: 'B2',   val: `${t.b2 ?? '—'}%`,   ok: (t.b2 ?? 0) >= 65  },
    { label: 'CANX', val: `${t.canx ?? '—'}%`, ok: (t.canx ?? 99) <= 10 },
  ] : [];
  return (
    <IntelCard id="salesfloor" title="SALES FLOOR · RILEY" colour="#f59e0b" pos={pos} onMove={onMove} onClose={onClose}>
      {t ? (
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          {kpis.map(k => (
            <div key={k.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: 20, color: k.ok ? '#3dd68c' : '#ef4444', lineHeight: 1, textShadow: `0 0 12px ${k.ok ? '#3dd68c' : '#ef4444'}80` }}>{k.val}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(0,212,255,0.4)', marginTop: 4, letterSpacing: 1.5 }}>{k.label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(245,158,11,0.35)' }}>LOADING...</div>
      )}
    </IntelCard>
  );
}

// ── News card ──────────────────────────────────────────────────────────────────
function NewsCard({ pos, onMove, onClose }) {
  const [headlines, setHeadlines] = useState([]);
  useEffect(() => {
    fetch('/api/news').then(r => r.json())
      .then(d => { if (d?.headlines) setHeadlines(d.headlines); }).catch(() => {});
  }, []);
  return (
    <IntelCard id="news" title="LIVE INTEL · HEADLINES" colour="#c084fc" badge="LIVE" pos={pos} onMove={onMove} onClose={onClose}>
      {headlines.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxWidth: 270 }}>
          {headlines.slice(0, 5).map((h, i) => (
            <div key={i} style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(192,132,252,0.8)',
              lineHeight: 1.55, borderBottom: i < 4 ? '1px solid rgba(192,132,252,0.07)' : 'none', paddingBottom: 5,
            }}>
              <span style={{ color: '#c084fc', fontWeight: 700, marginRight: 6, fontFamily: 'var(--font-hud)', fontSize: 7 }}>{String(i + 1).padStart(2, '0')}</span>
              {h}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(192,132,252,0.35)' }}>SCANNING FEEDS...</div>
      )}
    </IntelCard>
  );
}

// ── Toggle bar ─────────────────────────────────────────────────────────────────
const TOGGLE_ITEMS = [
  { id: 'weather',    icon: '◈', label: 'WX',    colour: '#00d4ff' },
  { id: 'markets',   icon: '▲', label: 'MKT',   colour: '#f59e0b' },
  { id: 'salesfloor',icon: '◉', label: 'FLOOR', colour: '#f59e0b' },
  { id: 'news',      icon: '▦', label: 'NEWS',  colour: '#c084fc' },
];

// ── Main IntelOverlay ──────────────────────────────────────────────────────────
export default function IntelOverlay() {
  const [positions, setPositions] = useState(null);

  useEffect(() => { setPositions(loadPositions()); }, []);

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
      {positions.weather.visible    && <WeatherCard    pos={positions.weather}    onMove={handleMove} onClose={handleClose} />}
      {positions.markets.visible    && <MarketsCard    pos={positions.markets}    onMove={handleMove} onClose={handleClose} />}
      {positions.salesfloor.visible && <SalesFloorCard pos={positions.salesfloor} onMove={handleMove} onClose={handleClose} />}
      {positions.news.visible       && <NewsCard       pos={positions.news}       onMove={handleMove} onClose={handleClose} />}

      {/* Toggle bar */}
      <div style={{
        position: 'fixed',
        bottom: 26, left: 48, right: 0,
        height: 28,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        paddingLeft: 12,
        background: 'rgba(2,6,10,0.95)',
        borderTop: '1px solid rgba(0,212,255,0.08)',
      }}>
        {TOGGLE_ITEMS.map(item => {
          const active = positions[item.id]?.visible;
          return (
            <button
              key={item.id}
              onClick={() => handleToggle(item.id)}
              style={{
                background: active ? `${item.colour}18` : 'transparent',
                border: active ? `1px solid ${item.colour}40` : '1px solid transparent',
                borderRadius: 3,
                padding: '2px 9px',
                cursor: 'pointer',
                fontFamily: 'var(--font-hud)',
                fontSize: 7,
                letterSpacing: 2,
                color: active ? item.colour : 'rgba(0,212,255,0.28)',
                display: 'flex', alignItems: 'center', gap: 5,
                transition: 'all 0.14s',
              }}
            >
              <span style={{ fontSize: 9 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(0,212,255,0.2)', marginLeft: 'auto', paddingRight: 12, letterSpacing: 1 }}>
          INTEL OVERLAY · DRAG TO REPOSITION
        </div>
      </div>
    </>
  );
}
