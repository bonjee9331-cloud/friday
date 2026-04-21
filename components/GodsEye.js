'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Live news feed channels ──────────────────────────────────────────────────
// YouTube live stream IDs — update if a stream goes offline
const FEEDS = [
  { id: 'al_jazeera', title: 'AL JAZEERA',  region: 'MIDDLE EAST',   ytId: 'GdUPJSRQHfY', colour: '#f59e0b' },
  { id: 'sky_news',   title: 'SKY NEWS',    region: 'ASIA-PACIFIC',  ytId: '9Auq9mYxFEE', colour: '#00d4ff' },
  { id: 'bloomberg',  title: 'BLOOMBERG',   region: 'AMERICAS',      ytId: 'dp8PhLsUcFE', colour: '#3dd68c' },
  { id: 'dw_news',    title: 'DW NEWS',     region: 'EUROPE',        ytId: 'Gc4SBYLRsGk', colour: '#c084fc' },
  { id: 'france24',   title: 'FRANCE 24',   region: 'EUROPE/AFRICA', ytId: 'h3MuIUNCRNI', colour: '#ff6b35' },
  { id: 'euronews',   title: 'EURONEWS',    region: 'EUROPE',        ytId: 'zfuMYo9sWjM', colour: '#60a5fa' },
];

// ── World city markers (approximate Mercator % positions) ────────────────────
const CITIES = [
  { name: 'LONDON',       x: '49%', y: '17%', level: 'low',  delay: 0.0 },
  { name: 'PARIS',        x: '47%', y: '19%', level: 'low',  delay: 0.3 },
  { name: 'MOSCOW',       x: '57%', y: '14%', level: 'high', delay: 0.6 },
  { name: 'DUBAI',        x: '60%', y: '29%', level: 'low',  delay: 0.9 },
  { name: 'CAIRO',        x: '54%', y: '27%', level: 'mid',  delay: 1.2 },
  { name: 'MUMBAI',       x: '68%', y: '32%', level: 'low',  delay: 1.5 },
  { name: 'BEIJING',      x: '78%', y: '22%', level: 'mid',  delay: 1.8 },
  { name: 'TOKYO',        x: '83%', y: '21%', level: 'low',  delay: 2.1 },
  { name: 'SINGAPORE',    x: '76%', y: '38%', level: 'low',  delay: 2.4 },
  { name: 'HUA HIN ◎',   x: '74%', y: '34%', level: 'home', delay: 0.1 },
  { name: 'SYDNEY',       x: '83%', y: '60%', level: 'low',  delay: 2.7 },
  { name: 'LAGOS',        x: '48%', y: '37%', level: 'mid',  delay: 3.0 },
  { name: 'JOHANNESBURG', x: '55%', y: '53%', level: 'low',  delay: 3.3 },
  { name: 'SÃO PAULO',    x: '31%', y: '53%', level: 'low',  delay: 3.6 },
  { name: 'NEW YORK',     x: '22%', y: '25%', level: 'low',  delay: 3.9 },
  { name: 'LOS ANGELES',  x: '10%', y: '27%', level: 'low',  delay: 4.2 },
  { name: 'KYIV',         x: '54%', y: '17%', level: 'high', delay: 4.5 },
  { name: 'TEHRAN',       x: '62%', y: '26%', level: 'high', delay: 4.8 },
];

const LEVEL_COL = { low: '#3dd68c', mid: '#f59e0b', high: '#ff3030', home: '#00d4ff' };

const GODS_EYE_MAP = 'https://embed.windy.com/embed2.html?lat=20&lon=10&zoom=2&level=surface&overlay=temp&type=map&location=coordinates&metricTemp=default&metricWind=default&radarRange=-1';

// ── Draggable video feed panel ───────────────────────────────────────────────
function FeedPanel({ feed, pos, onMove, onClose }) {
  const startRef = useRef(null);
  const FW = 286, FH = 162;

  const onMouseDown = useCallback((e) => {
    if (e.target.closest('button, a')) return;
    e.preventDefault();
    startRef.current = { mx: e.clientX, my: e.clientY, ox: pos.x, oy: pos.y };
    const move = (ev) => {
      if (!startRef.current) return;
      onMove(
        feed.id,
        Math.max(0, Math.min(window.innerWidth  - FW, startRef.current.ox + ev.clientX - startRef.current.mx)),
        Math.max(44, Math.min(window.innerHeight - FH - 30, startRef.current.oy + ev.clientY - startRef.current.my))
      );
    };
    const up = () => {
      startRef.current = null;
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  }, [feed.id, pos, onMove]);

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x, top: pos.y,
        width: FW,
        zIndex: 700,
        background: 'rgba(2,6,12,0.99)',
        border: `1px solid ${feed.colour}55`,
        borderRadius: 5,
        cursor: 'move',
        userSelect: 'none',
        overflow: 'hidden',
        animation: 'hudFadeUp 0.35s ease-out',
        boxShadow: `0 0 28px ${feed.colour}25, 0 4px 20px rgba(0,0,0,0.7)`,
      }}
      onMouseDown={onMouseDown}
    >
      {/* Top accent */}
      <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${feed.colour}, transparent)` }} />

      {/* Corner brackets */}
      {[{t:2,l:0},{t:2,r:0},{b:0,l:0},{b:0,r:0}].map((pos, i) => (
        <div key={i} style={{
          position: 'absolute',
          ...(pos.t !== undefined ? { top: pos.t } : { bottom: pos.b }),
          ...(pos.l !== undefined ? { left: pos.l } : { right: pos.r }),
          width: 10, height: 10,
          borderTop:    pos.t !== undefined ? `1px solid ${feed.colour}` : undefined,
          borderBottom: pos.b !== undefined ? `1px solid ${feed.colour}` : undefined,
          borderLeft:   pos.l !== undefined ? `1px solid ${feed.colour}` : undefined,
          borderRight:  pos.r !== undefined ? `1px solid ${feed.colour}` : undefined,
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      ))}

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 8px',
        background: 'rgba(0,0,0,0.6)',
        borderBottom: `1px solid ${feed.colour}22`,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff3030', boxShadow: '0 0 6px #ff3030', animation: 'pulse-dot 1s ease-in-out infinite', flexShrink: 0 }} />
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: 7, letterSpacing: 2.5, color: feed.colour, flex: 1 }}>{feed.title}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 6.5, color: `${feed.colour}65`, letterSpacing: 1 }}>{feed.region}</span>
        <button
          onClick={() => onClose(feed.id)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: `${feed.colour}55`, fontSize: 10, padding: '0 2px', lineHeight: 1, fontFamily: 'var(--font-mono)', transition: 'color 0.12s' }}
          onMouseEnter={e => { e.currentTarget.style.color = feed.colour; }}
          onMouseLeave={e => { e.currentTarget.style.color = `${feed.colour}55`; }}
        >✕</button>
      </div>

      {/* Video iframe */}
      <div style={{ position: 'relative', width: '100%', height: FH }}>
        <iframe
          src={`https://www.youtube.com/embed/${feed.ytId}?autoplay=1&mute=1&controls=1&rel=0&showinfo=0&iv_load_policy=3`}
          width="100%"
          height={FH}
          allow="autoplay; encrypted-media"
          style={{ border: 'none', display: 'block' }}
          title={feed.title}
        />
        {/* LIVE badge */}
        <div style={{
          position: 'absolute', top: 7, left: 10,
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'rgba(0,0,0,0.75)',
          padding: '2px 6px', borderRadius: 2,
          fontFamily: 'var(--font-hud)', fontSize: 6.5,
          letterSpacing: 2, color: '#ff3030',
          textShadow: '0 0 8px #ff3030',
          pointerEvents: 'none',
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ff3030', display: 'inline-block', animation: 'pulse-dot 0.9s ease-in-out infinite' }} />
          LIVE
        </div>
      </div>
    </div>
  );
}

// ── Main Gods Eye overlay ─────────────────────────────────────────────────────
export default function GodsEye({ onClose }) {
  const [positions, setPositions] = useState(null);
  const [visible,   setVisible]   = useState({});
  const [mapLayer,  setMapLayer]  = useState('temp');
  const [mapUrl,    setMapUrl]    = useState(GODS_EYE_MAP);

  useEffect(() => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const FW = 294;
    const FH = 198;
    const midY = Math.round((H - FH) / 2);
    const botY = Math.max(midY + FH + 10, H - FH - 36);

    setPositions({
      al_jazeera: { x: 55,         y: 55    },
      sky_news:   { x: W - FW - 8, y: 55    },
      bloomberg:  { x: 55,         y: midY  },
      dw_news:    { x: W - FW - 8, y: midY  },
      france24:   { x: 55,         y: botY  },
      euronews:   { x: W - FW - 8, y: botY  },
    });
    setVisible(Object.fromEntries(FEEDS.map(f => [f.id, true])));
  }, []);

  const handleMove  = useCallback((id, x, y) => setPositions(p => ({ ...p, [id]: { x, y } })), []);
  const handleClose = useCallback((id) => setVisible(v => ({ ...v, [id]: false })), []);

  const switchLayer = useCallback((layer) => {
    setMapLayer(layer);
    setMapUrl(`https://embed.windy.com/embed2.html?lat=20&lon=10&zoom=2&level=surface&overlay=${layer}&type=map&location=coordinates&metricTemp=default&metricWind=default&radarRange=-1`);
  }, []);

  const activeFeedCount = FEEDS.filter(f => visible[f.id]).length;

  if (!positions) return null;

  return (
    <>
      {/* ── Full screen backdrop + world map ── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,2,6,0.92)',
        animation: 'hudFadeUp 0.25s ease-out',
      }}>
        {/* World map heat layer */}
        <div style={{ position: 'absolute', top: 44, left: 0, right: 0, bottom: 28 }}>
          <iframe
            key={mapUrl}
            src={mapUrl}
            width="100%" height="100%"
            sandbox="allow-scripts allow-same-origin allow-forms"
            style={{
              border: 'none', display: 'block',
              filter: 'saturate(1.8) brightness(0.6) contrast(1.2)',
              opacity: 0.85,
            }}
            title="gods-eye-map"
          />

          {/* City marker overlay — positioned over the iframe */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {CITIES.map((city) => {
              const col = LEVEL_COL[city.level] || '#3dd68c';
              return (
                <div
                  key={city.name}
                  style={{
                    position: 'absolute',
                    left: city.x, top: city.y,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* Pulse ring */}
                  <div style={{
                    position: 'absolute',
                    width: 20, height: 20,
                    top: -10, left: -10,
                    borderRadius: '50%',
                    border: `1px solid ${col}`,
                    opacity: 0.6,
                    animation: `hudPulseRing 2.8s ease-out infinite`,
                    animationDelay: `${city.delay}s`,
                  }} />
                  {/* Core dot */}
                  <div style={{
                    width: city.level === 'home' ? 7 : 5,
                    height: city.level === 'home' ? 7 : 5,
                    borderRadius: '50%',
                    background: col,
                    boxShadow: `0 0 ${city.level === 'high' ? 12 : 6}px ${col}`,
                    animation: 'pulse-dot 2.5s ease-in-out infinite',
                    animationDelay: `${city.delay * 0.5}s`,
                  }} />
                  {/* Label */}
                  <div style={{
                    position: 'absolute',
                    top: city.level === 'home' ? 10 : 8,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontFamily: 'var(--font-hud)',
                    fontSize: city.level === 'home' ? 6 : 5.5,
                    color: col,
                    letterSpacing: 1.2,
                    whiteSpace: 'nowrap',
                    background: 'rgba(0,2,6,0.75)',
                    padding: '1px 4px',
                    borderRadius: 2,
                    textShadow: `0 0 6px ${col}80`,
                  }}>{city.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scan line over map */}
        <div style={{
          position: 'absolute', top: 44, left: 0, right: 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,48,48,0.7), transparent)',
          boxShadow: '0 0 8px rgba(255,48,48,0.4)',
          animation: 'hudScanDrop 10s linear infinite',
          pointerEvents: 'none',
        }} />
      </div>

      {/* ── Header bar (replaces FRIDAY topbar) ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: 44, zIndex: 600,
        background: 'rgba(2,0,0,0.98)',
        borderBottom: '1px solid rgba(255,48,48,0.35)',
        display: 'flex', alignItems: 'center',
        paddingLeft: 16, paddingRight: 16, gap: 12,
        backdropFilter: 'blur(14px)',
      }}>
        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#ff3030', boxShadow: '0 0 12px #ff3030',
            animation: 'pulse-dot 0.9s ease-in-out infinite',
          }} />
          <span style={{ fontFamily: 'var(--font-hud)', fontSize: 13, fontWeight: 900, letterSpacing: 7, color: '#ff3030', textShadow: '0 0 24px rgba(255,48,48,0.6)' }}>
            GODS EYE
          </span>
        </div>

        <div style={{ width: 1, height: 18, background: 'rgba(255,48,48,0.2)' }} />

        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, letterSpacing: 2.5, color: 'rgba(255,48,48,0.6)' }}>
          WORLD MONITOR · {activeFeedCount} FEEDS ACTIVE
        </span>

        <div style={{ width: 1, height: 18, background: 'rgba(255,48,48,0.2)' }} />

        {/* Map layer switcher */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { key: 'temp',   label: 'THERMAL' },
            { key: 'wind',   label: 'WIND'    },
            { key: 'rain',   label: 'PRECIP'  },
            { key: 'clouds', label: 'CLOUD'   },
          ].map(layer => (
            <button key={layer.key} onClick={() => switchLayer(layer.key)} style={{
              background: mapLayer === layer.key ? 'rgba(255,48,48,0.18)' : 'transparent',
              border: mapLayer === layer.key ? '1px solid rgba(255,48,48,0.45)' : '1px solid rgba(255,48,48,0.12)',
              borderRadius: 3, padding: '3px 9px', cursor: 'pointer',
              fontFamily: 'var(--font-hud)', fontSize: 6.5, letterSpacing: 1.5,
              color: mapLayer === layer.key ? '#ff3030' : 'rgba(255,48,48,0.4)',
              transition: 'all 0.14s',
            }}>
              {layer.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Restore closed feeds */}
        {FEEDS.filter(f => !visible[f.id]).map(f => (
          <button key={f.id} onClick={() => setVisible(v => ({ ...v, [f.id]: true }))} style={{
            background: `${f.colour}12`, border: `1px solid ${f.colour}30`,
            borderRadius: 3, padding: '3px 8px', cursor: 'pointer',
            fontFamily: 'var(--font-hud)', fontSize: 6.5, letterSpacing: 1.5, color: `${f.colour}80`,
          }}>
            + {f.title}
          </button>
        ))}

        {/* Deactivate */}
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,48,48,0.12)',
            border: '1px solid rgba(255,48,48,0.45)',
            borderRadius: 4, padding: '6px 16px', cursor: 'pointer',
            fontFamily: 'var(--font-hud)', fontSize: 8, letterSpacing: 2.5,
            color: '#ff3030', transition: 'all 0.14s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,48,48,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,48,48,0.12)'; }}
        >
          ✕ DEACTIVATE
        </button>
      </div>

      {/* ── Draggable video feeds (above overlay) ── */}
      {FEEDS.map(feed =>
        visible[feed.id] && positions[feed.id] && (
          <FeedPanel
            key={feed.id}
            feed={feed}
            pos={positions[feed.id]}
            onMove={handleMove}
            onClose={handleClose}
          />
        )
      )}
    </>
  );
}
