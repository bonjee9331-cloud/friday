'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Configure music
const MUSIC_ID = 'XXswgVBbTjU';
const MUSIC_START = 200;

const BOOT_LOG = [
  'FRIDAY OS v2.0 - INITIALISING...',
  'NEURAL NETWORK ONLINE',
  'VOICE SYNTHESIS READY',
  'CONNECTING TO LIVE DATA FEEDS...',
  'WEATHER MODULE     [ OK ]',
  'NEWS MODULE        [ OK ]',
  'BRIEFING ENGINE    [ OK ]',
  'MEMORY SYSTEMS     [ OK ]',
  'BOB SALES MODULE   [ OK ]',
  'SECURITY LAYER     [ ACTIVE ]',
  'ALL SYSTEMS NOMINAL',
  'GOOD MORNING, BEN.',
];

const HEATMAP_ROWS = 10;
const HEATMAP_COLS = 18;

function safeIncludes(value, text) {
  return typeof value === 'string' && value.includes(text);
}

function HeatmapPanel() {
  const [cells] = useState(() =>
    Array.from({ length: HEATMAP_ROWS * HEATMAP_COLS }, () => {
      const v = Math.random();
      const r = Math.round(255 * Math.min(1, v * 2));
      const g = Math.round(255 * Math.min(1, (1 - v) * 2));
      return { r, g, v };
    })
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 9, letterSpacing: 3, color: '#00b4ff', marginBottom: 6 }}>
        GLOBAL ACTIVITY HEATMAP
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${HEATMAP_COLS}, 1fr)`,
          gap: 2,
        }}
      >
        {cells.map((c, i) => (
          <div
            key={i}
            style={{
              width: 14,
              height: 10,
              borderRadius: 1,
              background: `rgb(${c.r},${c.g},40)`,
              opacity: 0.6 + c.v * 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function BootSequence({ onComplete }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const phaseRef = useRef(0);
  const audioContextRef = useRef(null);

  const [phase, setPhase] = useState(0);
  const [logLines, setLogLines] = useState([]);
  const [weather, setWeather] = useState(null);
  const [news, setNews] = useState([]);
  const [briefing, setBriefing] = useState('');
  const [showData, setShowData] = useState(false);
  const [briefingDone, setBriefingDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      try {
        const r = await fetch('/api/weather');
        const d = await r.json();
        if (!cancelled) setWeather(d || null);
      } catch (_) {
        if (!cancelled) setWeather(null);
      }
    };

    const loadNews = async () => {
      try {
        const r = await fetch('/api/news');
        const d = await r.json();
        if (!cancelled) {
          const headlines = Array.isArray(d?.headlines) ? d.headlines : [];
          setNews(headlines);
        }
      } catch (_) {
        if (!cancelled) setNews([]);
      }
    };

    const loadBriefing = async () => {
      try {
        const r = await fetch('/api/briefing');
        const d = await r.json();
        if (!cancelled) {
          setBriefing(typeof d?.briefing === 'string' ? d.briefing : '');
        }
      } catch (_) {
        if (!cancelled) setBriefing('');
      }
    };

    loadWeather();
    loadNews();
    loadBriefing();

    return () => {
      cancelled = true;
    };
  }, []);

  const speak = useCallback(async (text) => {
    if (typeof text !== 'string' || !text.trim()) {
      setBriefingDone(true);
      return;
    }

    try {
      const res = await fetch('/api/friday/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        setBriefingDone(true);
        return;
      }

      const buf = await res.arrayBuffer();
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) {
        setBriefingDone(true);
        return;
      }

      const ac = new AudioContextClass();
      audioContextRef.current = ac;

      const decoded = await ac.decodeAudioData(buf.slice(0));
      const src = ac.createBufferSource();
      src.buffer = decoded;
      src.connect(ac.destination);
      src.start(0);

      src.onended = async () => {
        setBriefingDone(true);
        try {
          await ac.close();
        } catch (_) {
          // ignore
        }
      };
    } catch (_) {
      setBriefingDone(true);
    }
  }, []);

  useEffect(() => {
    let i = 0;
    let timeoutId = null;

    const tick = () => {
      if (i < BOOT_LOG.length) {
        setLogLines((prev) => [...prev, BOOT_LOG[i]]);
        i += 1;
        timeoutId = window.setTimeout(tick, 350 + Math.random() * 200);
      }
    };

    timeoutId = window.setTimeout(tick, 1200);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => {
        phaseRef.current = 1;
        setPhase(1);
      }, 800),
      setTimeout(() => {
        phaseRef.current = 2;
        setPhase(2);
      }, 2500),
      setTimeout(() => {
        phaseRef.current = 3;
        setPhase(3);
      }, 5000),
      setTimeout(() => {
        phaseRef.current = 4;
        setPhase(4);
        setShowData(true);
      }, 8000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase < 4) return;

    if (typeof briefing !== 'string' || !briefing.trim()) {
      const fallback = setTimeout(() => {
        setBriefingDone(true);
      }, 2500);

      return () => clearTimeout(fallback);
    }

    const t = setTimeout(() => {
      speak(briefing);
    }, 1000);

    return () => clearTimeout(t);
  }, [phase, briefing, speak]);

  useEffect(() => {
    if (briefingDone && phase >= 4) {
      const t = setTimeout(() => {
        onComplete();
      }, 1500);

      return () => clearTimeout(t);
    }
  }, [briefingDone, phase, onComplete]);

  useEffect(() => {
    const t = setTimeout(() => {
      setBriefingDone(true);
    }, 12000);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const hardStop = setTimeout(() => {
      if (phaseRef.current >= 4) {
        setBriefingDone(true);
      }
    }, 14000);

    return () => clearTimeout(hardStop);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);

    const draw = () => {
      t += 1;
      const ph = phaseRef.current;
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = ph < 2 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,10,0.12)';
      ctx.fillRect(0, 0, w, h);

      if (ph >= 1) {
        const HEX = 34;
        const cols = Math.ceil(w / (HEX * 1.5)) + 2;
        const rows = Math.ceil(h / (HEX * 1.732)) + 2;
        const gridAlpha = Math.min(1, (ph - 1) * 0.4) * 0.06;

        for (let col = -1; col < cols; col += 1) {
          for (let row = -1; row < rows; row += 1) {
            const px = col * HEX * 1.5;
            const py = row * HEX * 1.732 + (col % 2 ? HEX * 0.866 : 0);
            const dist = Math.hypot(px - cx, py - cy);
            const pulse = Math.sin(t * 0.01 - dist * 0.006) * 0.5 + 0.5;

            ctx.strokeStyle = `rgba(0,120,255,${gridAlpha + pulse * 0.03})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();

            for (let k = 0; k < 6; k += 1) {
              const ang = (k * Math.PI) / 3;
              const hx = px + HEX * 0.85 * Math.cos(ang);
              const hy = py + HEX * 0.85 * Math.sin(ang);

              if (k === 0) ctx.moveTo(hx, hy);
              else ctx.lineTo(hx, hy);
            }

            ctx.closePath();
            ctx.stroke();
          }
        }
      }

      if (ph >= 2) {
        for (let i = 0; i < 8; i += 1) {
          const r = 60 + i * 90 + (t % 200) * 1.5;
          const alp = Math.max(0, 0.15 - r / 1200);
          ctx.strokeStyle = `rgba(0,200,255,${alp})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r % Math.max(w, h), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (ph >= 3) {
        const nodeCount = 8;
        const orbitR = 180;

        ctx.strokeStyle = 'rgba(0,180,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < nodeCount; i += 1) {
          const ang = (i / nodeCount) * Math.PI * 2 + t * 0.008;
          const nx = cx + orbitR * Math.cos(ang);
          const ny = cy + orbitR * Math.sin(ang);

          ctx.fillStyle = 'rgba(0,220,255,0.8)';
          ctx.shadowColor = '#00eaff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(nx, ny, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      const scanY = (t * 3) % h;
      const grad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 10);
      grad.addColorStop(0, 'rgba(0,180,255,0)');
      grad.addColorStop(1, 'rgba(0,180,255,0.04)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 60, w, 70);

      const bLen = 28;
      ctx.strokeStyle = 'rgba(0,180,255,0.5)';
      ctx.lineWidth = 1.5;

      [
        [0, 0, 1, 1],
        [w, 0, -1, 1],
        [0, h, 1, -1],
        [w, h, -1, -1],
      ].forEach(([bx, by, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(bx + dx * bLen, by);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx, by + dy * bLen);
        ctx.stroke();
      });

      if (ph >= 1) {
        ctx.font = `300 ${ph >= 2 ? '36' : '48'}px monospace`;
        ctx.fillStyle = 'rgba(0,200,255,1)';
        ctx.shadowColor = '#00b4ff';
        ctx.shadowBlur = 30;
        ctx.textAlign = 'center';

        const yPos = ph >= 3 ? 60 : cy - 20;
        ctx.fillText('FRIDAY', cx, yPos);

        ctx.shadowBlur = 0;
        ctx.font = '300 10px monospace';
        ctx.fillStyle = 'rgba(0,160,255,0.6)';
        ctx.fillText('PERSONAL AI v2.0', cx, yPos + 24);
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      ctx.font = '300 12px monospace';
      ctx.fillStyle = 'rgba(0,180,255,0.5)';
      ctx.textAlign = 'right';
      ctx.fillText(timeStr, w - 20, h - 20);
      ctx.textAlign = 'left';

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (_) {
          // ignore
        }
      }
    };
  }, []);

  const wmoDesc = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    51: 'Light Drizzle',
    61: 'Light Rain',
    63: 'Moderate Rain',
    71: 'Light Snow',
    80: 'Rain Showers',
    95: 'Thunderstorm',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000010',
        overflow: 'hidden',
        fontFamily: 'monospace',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      <iframe
        src={`https://www.youtube.com/embed/${MUSIC_ID}?autoplay=1&start=${MUSIC_START}&loop=1&playlist=${MUSIC_ID}`}
        allow="autoplay"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0.01,
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
        title="music"
      />

      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 40,
          zIndex: 10,
          color: '#00b4ff',
          fontSize: 11,
          letterSpacing: 2,
          lineHeight: 1.9,
          maxWidth: 340,
          opacity: phase >= 1 ? 1 : 0,
          transition: 'opacity 1s',
        }}
      >
        {logLines.map((line, i) => (
          <div
            key={i}
            style={{
              color:
                safeIncludes(line, 'NOMINAL') || safeIncludes(line, 'BEN')
                  ? '#00ffaa'
                  : safeIncludes(line, 'OK')
                    ? '#00c8ff'
                    : 'rgba(0,180,255,0.7)',
              animationName: 'fadeIn',
              animationDuration: '0.4s',
            }}
          >
            <span style={{ color: 'rgba(0,180,255,0.4)', marginRight: 8 }}>{'>'}</span>
            {line}
          </div>
        ))}
      </div>

      {showData && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: 80,
              right: 40,
              border: '1px solid rgba(0,180,255,0.3)',
              background: 'rgba(0,10,30,0.85)',
              padding: '16px 20px',
              borderRadius: 4,
              color: '#00b4ff',
              minWidth: 220,
              animationName: 'slideInRight',
              animationDuration: '0.8s',
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: 4, marginBottom: 10, color: 'rgba(0,180,255,0.6)' }}>
              MELBOURNE WEATHER
            </div>

            {weather ? (
              <div>
                <div style={{ fontSize: 32, fontWeight: 100 }}>
                  {typeof weather?.temp === 'number' || typeof weather?.temp === 'string'
                    ? weather.temp
                    : '--'}
                  °C
                </div>
                <div style={{ fontSize: 11, marginTop: 4, color: '#00eaff' }}>
                  {wmoDesc[weather?.code] || weather?.desc || 'Unavailable'}
                </div>
                <div style={{ fontSize: 10, marginTop: 8, color: 'rgba(0,180,255,0.6)' }}>
                  Feels {weather?.feels ?? '--'}°C · Wind {weather?.wind ?? '--'}km/h
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 10, color: 'rgba(0,180,255,0.5)' }}>LOADING...</div>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              top: 260,
              right: 40,
              border: '1px solid rgba(0,180,255,0.25)',
              background: 'rgba(0,10,30,0.85)',
              padding: '14px 18px',
              borderRadius: 4,
              color: '#00b4ff',
              width: 300,
              animationName: 'slideInRight',
              animationDuration: '1s',
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: 4, marginBottom: 10, color: 'rgba(0,180,255,0.6)' }}>
              LIVE HEADLINES
            </div>

            {news.length > 0 ? (
              news.slice(0, 5).map((h, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 10,
                    lineHeight: 1.6,
                    borderBottom: i < 4 ? '1px solid rgba(0,180,255,0.1)' : 'none',
                    paddingBottom: 6,
                    marginBottom: 6,
                    color: 'rgba(0,210,255,0.85)',
                  }}
                >
                  <span style={{ color: 'rgba(0,180,255,0.4)', marginRight: 6 }}>{i + 1}.</span>
                  {typeof h === 'string' ? h : 'Headline unavailable'}
                </div>
              ))
            ) : (
              <div style={{ fontSize: 10, color: 'rgba(0,180,255,0.5)' }}>LOADING...</div>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 60,
              left: '50%',
              transform: 'translateX(-50%)',
              border: '1px solid rgba(0,180,255,0.2)',
              background: 'rgba(0,10,30,0.85)',
              padding: '14px 18px',
              borderRadius: 4,
              animationName: 'slideInUp',
              animationDuration: '1s',
            }}
          >
            <HeatmapPanel />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 200,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 11,
              letterSpacing: 3,
              color: '#00ffaa',
              animationName: 'pulse',
              animationDuration: '2s',
              animationIterationCount: 'infinite',
              whiteSpace: 'nowrap',
            }}
          >
            {briefingDone ? 'BRIEFING COMPLETE LAUNCHING FRIDAY' : 'DELIVERING MORNING BRIEFING...'}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideInUp {
          from { opacity: 0; transform: translateX(-50%) translateY(30px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
