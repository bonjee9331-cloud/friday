'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { authedFetch } from '../lib/client-auth';

// ─── Shared UI ──────────────────────────────────────────────────────────────
function DataBar({ value, max = 100, colour }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: colour, boxShadow: `0 0 6px ${colour}`, borderRadius: 1, transition: 'width 1.2s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  );
}

function WidgetShell({ colour = '#00d4ff', label, icon, children, span = 1, rowSpan = 1, accent }) {
  const borderCol = accent === 'red'
    ? 'rgba(255,48,48,0.25)'
    : accent === 'gold'
      ? 'rgba(255,204,68,0.22)'
      : 'var(--hud-border)';
  const topLine = accent === 'red'
    ? 'linear-gradient(90deg,transparent,rgba(255,48,48,0.5),transparent)'
    : 'linear-gradient(90deg,transparent,var(--hud-cyan-deep),transparent)';

  return (
    <div
      className="hud-widget bracket"
      style={{
        gridColumn:  span > 1    ? `span ${span}`    : undefined,
        gridRow:     rowSpan > 1 ? `span ${rowSpan}` : undefined,
        borderColor: borderCol,
        animation: 'hudFlicker 12s ease-in-out infinite',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: topLine, opacity: 0.8,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, borderBottom: `1px solid ${colour}18`, paddingBottom: 7 }}>
        <span style={{ fontSize: 11, filter: `drop-shadow(0 0 5px ${colour})` }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: 7.5, letterSpacing: 3, color: colour, flex: 1, textTransform: 'uppercase' }}>{label}</span>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: colour, boxShadow: `0 0 6px ${colour}`, animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
      </div>
      {children}
    </div>
  );
}

// ─── VOICE / ARC REACTOR (hero widget) ─────────────────────────────────────
function VoiceWidget() {
  const [status,   setStatus]   = useState('idle');
  const [response, setResponse] = useState('');
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const col = '#00d4ff';

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const cx = W / 2, cy = H / 2;
    let t = 0;

    const frame = () => {
      t++;
      ctx.clearRect(0, 0, W, H);
      const active = status !== 'idle';
      const spd = active ? 1.8 : 0.45;

      // Outer glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
      glow.addColorStop(0, `rgba(0,212,255,${active ? 0.18 : 0.07})`);
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 80, 0, Math.PI * 2);
      ctx.fill();

      // Rings
      const rings = [
        { r: 88, s:  0.003, dash: [10, 20], a: 0.18, w: 0.8 },
        { r: 72, s: -0.005, dash: [ 4,  8], a: 0.25, w: 0.8 },
        { r: 58, s:  0.008, dash: [ 8,  5], a: 0.38, w: 1.0 },
        { r: 44, s: -0.013, dash: [ 3,  6], a: 0.5,  w: 0.8 },
        { r: 30, s:  0.02,  dash: [],        a: 0.65, w: 1.0 },
        { r: 16, s: -0.03,  dash: [ 2,  3], a: 0.8,  w: 0.7 },
      ];

      rings.forEach(ring => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * ring.s * spd);
        ctx.beginPath();
        ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = col;
        ctx.globalAlpha = ring.a * (active ? 1.0 : 0.55);
        ctx.lineWidth   = ring.w;
        ctx.setLineDash(ring.dash);
        ctx.stroke();
        ctx.restore();
      });

      // Cross lines (active only)
      if (active) {
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i + t * 0.008;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(a);
          ctx.beginPath();
          ctx.moveTo(-88, 0);
          ctx.lineTo(88, 0);
          ctx.strokeStyle = 'rgba(0,212,255,0.07)';
          ctx.lineWidth = 0.6;
          ctx.setLineDash([]);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Triangular facets (subtle)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.004 * spd);
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(40 * Math.cos(a), 40 * Math.sin(a));
        ctx.lineTo(40 * Math.cos(a + Math.PI / 3), 40 * Math.sin(a + Math.PI / 3));
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0,212,255,0.06)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([]);
        ctx.stroke();
      }
      ctx.restore();

      // Core
      const coreR = active ? 10 + Math.sin(t * 0.08) * 2 : 7;
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      cg.addColorStop(0, '#ffffff');
      cg.addColorStop(0.35, col);
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg;
      ctx.globalAlpha = active ? 1 : 0.7;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(frame);
    };

    frame();
    return () => cancelAnimationFrame(animRef.current);
  }, [status]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-AU';
    rec.interimResults = false;
    setStatus('listening');
    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setStatus('processing');
      try {
        const r = await authedFetch('/api/friday/agent', { method: 'POST', body: JSON.stringify({ message: text }) });
        const d = await r.json();
        setResponse((d?.reply || '').slice(0, 140));
        setStatus('speaking');
        const va = await authedFetch('/api/friday/voice', { method: 'POST', body: JSON.stringify({ text: d?.reply || '' }) });
        if (va.ok) {
          const buf = await va.arrayBuffer();
          const ac  = new (window.AudioContext || window.webkitAudioContext)();
          const src = ac.createBufferSource();
          src.buffer = await ac.decodeAudioData(buf);
          src.connect(ac.destination);
          src.start(0);
          src.onended = () => { setStatus('idle'); ac.close(); };
        } else setStatus('idle');
      } catch { setStatus('idle'); }
    };
    rec.onerror = () => setStatus('idle');
    rec.start();
  }, []);

  const LABELS = { idle: 'STANDBY', listening: '● LISTENING', processing: '◌ PROCESSING', speaking: '▶ TRANSMITTING' };
  const COLS   = { idle: 'rgba(0,212,255,0.5)', listening: '#ef4444', processing: '#f59e0b', speaking: '#3dd68c' };

  return (
    <WidgetShell colour={col} label="VOICE INTERFACE · BOB" icon="◎" span={2} rowSpan={2}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 4 }}>
        <div
          style={{ cursor: status === 'idle' ? 'pointer' : 'default', position: 'relative' }}
          onClick={status === 'idle' ? startListening : undefined}
          title={status === 'idle' ? 'Click to speak' : undefined}
        >
          <canvas ref={canvasRef} width={200} height={200} style={{ display: 'block' }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-hud)',
            fontSize: 7, letterSpacing: 3,
            color: COLS[status] || col,
            textShadow: `0 0 12px ${COLS[status] || col}`,
            textAlign: 'center',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            {LABELS[status] || 'STANDBY'}
          </div>
        </div>
        {response && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'var(--text)', textAlign: 'center',
            lineHeight: 1.6, maxWidth: 200,
            background: 'rgba(0,212,255,0.04)',
            border: '1px solid rgba(0,212,255,0.1)',
            borderRadius: 4, padding: '6px 10px',
          }}>
            {response}
          </div>
        )}
      </div>
    </WidgetShell>
  );
}

// ─── AGENTS RADAR ──────────────────────────────────────────────────────────
const AGENTS = [
  { key: 'BOB',   colour: '#ff6b35', role: 'Orchestrator',  angle: 270 },
  { key: 'RILEY', colour: '#f59e0b', role: 'Sales Monitor', angle: 342 },
  { key: 'SUSAN', colour: '#3dd68c', role: 'Job Autopilot', angle: 54  },
  { key: 'DOUG',  colour: '#60a5fa', role: 'Task Runner',   angle: 126 },
  { key: 'MAYA',  colour: '#c084fc', role: 'Researcher',    angle: 198 },
];

function AgentsWidget() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) / 2 - 6;
    let t = 0;

    const frame = () => {
      t++;
      ctx.clearRect(0, 0, W, H);

      // Concentric rings
      [0.3, 0.55, 0.8, 1.0].forEach(f => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,212,255,0.1)';
        ctx.lineWidth = 0.6;
        ctx.setLineDash([]);
        ctx.stroke();
      });

      // Axis lines
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + R * Math.cos(a), cy + R * Math.sin(a));
        ctx.strokeStyle = 'rgba(0,212,255,0.06)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Sweep line + trail
      const sweep = (t * 0.018) % (Math.PI * 2);
      ctx.save();
      ctx.translate(cx, cy);
      // Trail gradient arc
      const trailLen = 1.1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, sweep - trailLen, sweep);
      ctx.closePath();
      const trailGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
      trailGrad.addColorStop(0, 'rgba(0,212,255,0)');
      trailGrad.addColorStop(1, 'rgba(0,212,255,0.1)');
      ctx.fillStyle = trailGrad;
      ctx.fill();
      // Sweep line
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(R * Math.cos(sweep), R * Math.sin(sweep));
      ctx.strokeStyle = 'rgba(0,212,255,0.85)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]);
      ctx.stroke();
      ctx.restore();

      // Agent dots + ping
      AGENTS.forEach(a => {
        const baseAngle = a.angle * (Math.PI / 180);
        const angle = baseAngle + t * 0.0008;
        const r = R * 0.68;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        // Dot glow
        const dg = ctx.createRadialGradient(x, y, 0, x, y, 7);
        dg.addColorStop(0, a.colour);
        dg.addColorStop(1, 'transparent');
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = a.colour;
        ctx.globalAlpha = 0.95;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Ping ring when sweep passes
        const diff = ((sweep - angle) + Math.PI * 2) % (Math.PI * 2);
        if (diff < 0.35) {
          const fade = 1 - diff / 0.35;
          const pingR = Math.max(0, 4 + (1 - fade) * 14);
          ctx.beginPath();
          ctx.arc(x, y, pingR, 0, Math.PI * 2);
          ctx.strokeStyle = a.colour;
          ctx.globalAlpha = fade * 0.8;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }

        // Label
        const lx = cx + Math.cos(angle) * (r + 14);
        const ly = cy + Math.sin(angle) * (r + 14);
        ctx.fillStyle = a.colour;
        ctx.font = 'bold 6px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(a.key, lx, ly);
      });

      // Center
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 5);
      cg.addColorStop(0, '#fff');
      cg.addColorStop(0.4, '#00d4ff');
      cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();

      animRef.current = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <WidgetShell colour="#c084fc" label="NEURAL GRID · AGENTS ONLINE" icon="◉" span={2} rowSpan={2}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <canvas ref={canvasRef} width={190} height={190} style={{ display: 'block' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
          {AGENTS.map((a, i) => (
            <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: a.colour, boxShadow: `0 0 6px ${a.colour}`, animation: 'pulse-dot 2.5s ease-in-out infinite', animationDelay: `${i * 0.3}s`, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 9, fontWeight: 700, color: a.colour, width: 48, letterSpacing: 0.5 }}>{a.key}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, color: 'rgba(0,212,255,0.35)', flex: 1 }}>{a.role}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#3dd68c' }}>ACTIVE</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetShell>
  );
}

// ─── KPI widgets ────────────────────────────────────────────────────────────
function SalesKpiWidgets() {
  const [stats,  setStats]  = useState(null);
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    authedFetch('/api/sales/rep-stats').then(r => r.json()).then(d => { setStats(d); setGlitch(true); setTimeout(() => setGlitch(false), 450); }).catch(() => {});
    const id = setInterval(() => authedFetch('/api/sales/rep-stats').then(r => r.json()).then(setStats).catch(() => {}), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const t = stats?.team;
  const kpis = [
    { label: 'B1 RATE',  val: t?.b1,   target: 90, max: 100, ok: (t?.b1   ?? 0)  >= 90,  colour: '#3dd68c', invert: false },
    { label: 'B2 RATE',  val: t?.b2,   target: 65, max: 100, ok: (t?.b2   ?? 0)  >= 65,  colour: t?.b2 >= 65 ? '#3dd68c' : '#f59e0b', invert: false },
    { label: 'CANX 24H', val: t?.canx, target: 10, max: 25,  ok: (t?.canx ?? 99) <= 10,  colour: (t?.canx ?? 99) <= 10 ? '#3dd68c' : '#ef4444', invert: true  },
  ];

  return kpis.map(k => (
    <WidgetShell key={k.label} colour={k.colour} label={k.label} icon="▲" accent={!k.ok && k.invert ? 'red' : undefined}>
      <div className={glitch && k.val != null ? 'glitch' : ''} style={{
        fontFamily: 'var(--font-hud)', fontSize: 34, fontWeight: 900, color: k.colour,
        lineHeight: 1, textShadow: `0 0 20px ${k.colour}80`,
      }}>
        {k.val ?? '—'}{typeof k.val === 'number' ? '%' : ''}
      </div>
      <DataBar value={k.invert ? (100 - (k.val ?? 0)) : (k.val ?? 0)} max={k.max} colour={k.colour} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7.5, color: 'rgba(0,212,255,0.35)', marginTop: 6 }}>
        TGT {k.invert ? `<${k.target}` : `≥${k.target}`}%
      </div>
    </WidgetShell>
  ));
}

// ─── Fair Work ───────────────────────────────────────────────────────────────
function FairWorkWidget() {
  const [data, setData] = useState(null);
  useEffect(() => {
    authedFetch('/api/doug/fairwork').then(r => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <WidgetShell colour="#60a5fa" label="FAIR WORK · ACTIVE" icon="⚖" accent="gold">
      {data ? (
        <div>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: 13, color: data.status === 'CLEAR' ? '#3dd68c' : '#f59e0b', marginBottom: 6, letterSpacing: 2, textShadow: `0 0 10px ${data.status === 'CLEAR' ? '#3dd68c' : '#f59e0b'}80` }}>{data.status}</div>
          {data.alerts?.length
            ? data.alerts.slice(0, 2).map((a, i) => (
                <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#60a5fa', lineHeight: 1.6 }}>{a}</div>
              ))
            : <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.4)' }}>No active alerts</div>
          }
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(96,165,250,0.4)' }}>LOADING...</div>
      )}
    </WidgetShell>
  );
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
function LeaderboardWidget() {
  const [reps, setReps] = useState([]);
  useEffect(() => {
    authedFetch('/api/sales/rep-stats').then(r => r.json())
      .then(d => setReps(Array.isArray(d?.reps) ? d.reps.slice(0, 5) : []))
      .catch(() => {});
  }, []);
  const MEDALS = ['🥇', '🥈', '🥉', '  ', '  '];
  return (
    <WidgetShell colour="#f59e0b" label="LEADERBOARD · RILEY" icon="◈" rowSpan={2}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {reps.length ? reps.map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '5px 7px',
            background: i === 0 ? 'rgba(245,158,11,0.06)' : 'transparent',
            border:     i === 0 ? '1px solid rgba(245,158,11,0.15)' : '1px solid transparent',
            borderRadius: 3,
          }}>
            <span style={{ fontSize: 11, width: 18 }}>{MEDALS[i]}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b8d4e8', flex: 1 }}>{r.name || r.rep_name || '—'}</span>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 13, color: '#3dd68c', fontWeight: 700, textShadow: '0 0 8px #3dd68c80' }}>{r.sales ?? r.total_sales ?? '—'}</span>
          </div>
        )) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(245,158,11,0.35)' }}>LOADING DATA...</div>
        )}
      </div>
    </WidgetShell>
  );
}

// ─── Weather ─────────────────────────────────────────────────────────────────
function WeatherWidget() {
  const [wx, setWx] = useState(null);
  const WMO = { 0: '☀ Clear', 1: '🌤 Mostly Clear', 2: '⛅ Partly Cloudy', 3: '☁ Overcast', 45: '🌫 Foggy', 51: '🌦 Drizzle', 61: '🌧 Rain', 65: '⛈ Heavy Rain', 80: '🌦 Showers', 95: '⛈ Storm' };
  useEffect(() => {
    fetch('/api/weather').then(r => r.json()).then(setWx).catch(() => {});
  }, []);
  return (
    <WidgetShell colour="#00d4ff" label="HUA HIN · ENVIRONMENT" icon="🌡">
      {wx ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 36, fontWeight: 100, color: '#00d4ff', lineHeight: 1, textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
              {wx.temp}°
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.6)', lineHeight: 1.4 }}>
              {WMO[wx.code] || wx.desc}
            </span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,212,255,0.4)', marginTop: 7, lineHeight: 1.9, letterSpacing: 0.5 }}>
            <div>FEELS {wx.feels}°  ·  WIND {wx.wind} km/h</div>
            <div>RAIN {wx.rain}%  ·  HUMIDITY {wx.humidity ?? '—'}%</div>
          </div>
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.35)' }}>ACQUIRING SENSOR DATA...</div>
      )}
    </WidgetShell>
  );
}

// ─── Markets ──────────────────────────────────────────────────────────────────
function MarketsWidget() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/markets').then(r => r.json()).then(setData).catch(() => {});
  }, []);
  const tickers = data ? [
    { sym: 'S&P', val: data.sp500,  chg: data.sp500_chg  },
    { sym: 'ASX', val: data.asx200, chg: data.asx200_chg },
    { sym: 'BTC', val: data.btc,    chg: data.btc_chg    },
    { sym: 'OIL', val: data.oil,    chg: data.oil_chg    },
  ] : [];
  return (
    <WidgetShell colour="#f59e0b" label="GLOBAL MARKETS" icon="▲">
      {data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {tickers.map(t => {
            const up  = (t.chg ?? 0) >= 0;
            const col = up ? '#3dd68c' : '#ef4444';
            return (
              <div key={t.sym} style={{ padding: '4px 0', borderBottom: '1px solid rgba(0,212,255,0.06)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(0,212,255,0.4)', letterSpacing: 2 }}>{t.sym}</div>
                <div style={{ fontFamily: 'var(--font-hud)', fontSize: 13, color: '#b8d4e8', marginTop: 1 }}>
                  {t.val != null ? (t.val > 999 ? t.val.toLocaleString('en', { maximumFractionDigits: 0 }) : t.val.toFixed(2)) : '—'}
                </div>
                {t.chg != null && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: col }}>
                    {up ? '▲' : '▼'} {Math.abs(t.chg).toFixed(2)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(245,158,11,0.35)' }}>LOADING...</div>
      )}
    </WidgetShell>
  );
}

// ─── Job Matches ──────────────────────────────────────────────────────────────
function JobMatchesWidget() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/jobs/search?limit=4').then(r => r.json())
      .then(d => { setJobs(Array.isArray(d?.jobs) ? d.jobs : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  return (
    <WidgetShell colour="#3dd68c" label="JOB MATCHES · SUSAN" icon="◈" rowSpan={2}>
      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(61,214,140,0.4)' }}>SCANNING TARGETS...</div>
      ) : jobs.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {jobs.slice(0, 4).map((j, i) => (
            <div key={i} style={{
              padding: '7px 9px',
              background: 'rgba(61,214,140,0.04)',
              border: '1px solid rgba(61,214,140,0.1)',
              borderLeft: '2px solid #3dd68c',
              borderRadius: 3,
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b8d4e8' }}>{j.title || j.job_title || '—'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,212,255,0.4)' }}>{j.company || '—'}</span>
                {j.fit_score != null && (
                  <span style={{ fontFamily: 'var(--font-hud)', fontSize: 11, color: '#3dd68c', fontWeight: 700, textShadow: '0 0 8px #3dd68c80' }}>{j.fit_score}%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(61,214,140,0.35)' }}>NO ACTIVE TARGETS</div>
      )}
    </WidgetShell>
  );
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
function TasksWidget() {
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    authedFetch('/api/friday/tasks?limit=5').then(r => r.json())
      .then(d => setTasks(Array.isArray(d?.tasks) ? d.tasks : [])).catch(() => {});
  }, []);
  const STATUS_C = { queued: '#60a5fa', running: '#f59e0b', done: '#3dd68c', blocked: '#ef4444', void: 'rgba(0,212,255,0.25)' };
  const STATUS_ICON = { queued: '◌', running: '◉', done: '✓', blocked: '✕', void: '—' };
  return (
    <WidgetShell colour="#60a5fa" label="TASK QUEUE · DOUG" icon="▦" rowSpan={2}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {tasks.length ? tasks.slice(0, 5).map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '5px 7px',
            background: 'rgba(96,165,250,0.03)',
            border: '1px solid rgba(96,165,250,0.07)',
            borderRadius: 3,
          }}>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 10, color: STATUS_C[t.status] || '#60a5fa', flexShrink: 0, textShadow: `0 0 6px ${STATUS_C[t.status] || '#60a5fa'}80` }}>
              {STATUS_ICON[t.status] || '◌'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b8d4e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title || t.name || '—'}</div>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: 6.5, color: STATUS_C[t.status] || '#60a5fa', letterSpacing: 1.5, marginTop: 2 }}>{(t.status || '').toUpperCase()}</div>
            </div>
          </div>
        )) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(96,165,250,0.35)' }}>NO ACTIVE TASKS</div>
        )}
      </div>
    </WidgetShell>
  );
}

// ─── System Status ────────────────────────────────────────────────────────────
function SystemWidget() {
  const [uptime, setUptime] = useState(0);
  const [gaze,   setGaze]   = useState(null);

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const check = () => fetch('/api/tools/gaze-status').then(r => r.json()).then(d => setGaze(d.active)).catch(() => setGaze(false));
    check();
    const id = setInterval(check, 8000);
    return () => clearInterval(id);
  }, []);

  const fmt = s => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const systems = [
    { label: 'BRAIN',  val: 'SONNET 4.6', ok: true  },
    { label: 'VOICE',  val: 'ELEVENLABS', ok: true  },
    { label: 'MEMORY', val: 'SUPABASE',   ok: true  },
    { label: 'GAZE',   val: gaze === null ? '...' : gaze ? 'ACTIVE' : 'OFFLINE', ok: !!gaze },
    { label: 'UPTIME', val: fmt(uptime),   ok: true  },
  ];

  return (
    <WidgetShell colour="#00d4ff" label="SYSTEM STATUS" icon="⬡">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {systems.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.ok ? '#3dd68c' : '#ef4444', boxShadow: `0 0 5px ${s.ok ? '#3dd68c' : '#ef4444'}`, flexShrink: 0, animation: !s.ok ? 'hudThreatPulse 1.5s ease-in-out infinite' : 'none' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(0,212,255,0.4)', width: 48 }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: s.ok ? 'rgba(184,212,232,0.8)' : '#ef4444' }}>{s.val}</span>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

// ─── COCKPIT GRID ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridAutoRows: 'minmax(130px, auto)',
      gap: 10,
      padding: '12px 14px',
      height: '100%',
      boxSizing: 'border-box',
      overflowY: 'auto',
      alignContent: 'start',
    }}>
      {/* Row 1–2: Hero widgets */}
      <VoiceWidget />
      <AgentsWidget />

      {/* Row 3: KPIs + Fair Work */}
      <SalesKpiWidgets />
      <FairWorkWidget />

      {/* Row 4–5: Secondary data */}
      <LeaderboardWidget />
      <WeatherWidget />
      <MarketsWidget />
      <JobMatchesWidget />

      {/* Row 6+: Tasks + System */}
      <TasksWidget />
      <SystemWidget />
    </div>
  );
}
