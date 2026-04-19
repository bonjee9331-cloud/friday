'use client';

import { useEffect, useState, useRef } from 'react';
import { authedFetch } from '../lib/client-auth';

// ─── Shared UI primitives ───────────────────────────────────
function PanelHeader({ icon, label, colour = 'var(--cyan)', live = false, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      borderBottom: `1px solid ${colour}22`,
      paddingBottom: 10, marginBottom: 14,
    }}>
      <span style={{ fontSize: 16, filter: `drop-shadow(0 0 6px ${colour})` }}>{icon}</span>
      <span style={{
        fontFamily: 'var(--font-hud)',
        fontSize: 10, fontWeight: 700,
        letterSpacing: 3,
        color: colour,
        textShadow: `0 0 12px ${colour}80`,
        flex: 1,
      }}>{label}</span>
      {live && (
        <span style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--green)',
          letterSpacing: 1,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: 'var(--green)',
            boxShadow: '0 0 6px var(--green)',
            animation: 'pulse-dot 1.5s ease-in-out infinite',
            display: 'inline-block',
          }} />
          LIVE
        </span>
      )}
      {children}
    </div>
  );
}

function DataBar({ value, max = 100, colour, width = '100%' }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{
      width, height: 3, background: 'rgba(255,255,255,0.06)',
      borderRadius: 2, overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: `linear-gradient(90deg, ${colour}, ${colour}cc)`,
        boxShadow: `0 0 6px ${colour}`,
        borderRadius: 2,
        transition: 'width 1s ease',
      }} />
    </div>
  );
}

// ─── Sales Panel ────────────────────────────────────────────
function SalesPanel() {
  const [stats, setStats] = useState(null);
  const [brief, setBrief] = useState('');

  useEffect(() => {
    authedFetch('/api/sales/rep-stats').then(r => r.json()).then(setStats).catch(() => {});
    authedFetch('/api/bob/brief').then(r => r.json()).then(d => setBrief(d?.brief || '')).catch(() => {});
  }, []);

  const t = stats?.team;
  const kpis = t ? [
    { label: 'B1%',  val: t.b1,   target: 90,  colour: t.b1  >= 90  ? 'var(--green)' : 'var(--red)'  },
    { label: 'B2%',  val: t.b2,   target: 65,  colour: t.b2  >= 65  ? 'var(--green)' : 'var(--amber)' },
    { label: 'CANX', val: t.canx, target: 10,  colour: t.canx <= 10 ? 'var(--green)' : 'var(--red)',  invert: true },
    { label: 'SPH',  val: 0.38,   target: 0.60,colour: 'var(--amber)', max: 1 },
  ] : [];

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: 4,
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden',
      gridColumn: 'span 2',
    }}>
      {/* Corner glow */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 120, height: 120,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <PanelHeader icon="📊" label="RILEY — SALES FLOOR INTELLIGENCE" colour="var(--amber)" live>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)' }}>
          D2MS · HFR AU · {stats?.reps?.length ?? 14} REPS
        </span>
      </PanelHeader>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {kpis.map(k => (
          <div key={k.label} style={{
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${k.colour}30`,
            borderRadius: 3, padding: '10px 12px',
          }}>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: 8, letterSpacing: 3, color: 'var(--text-dim)', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: 24, fontWeight: 700, color: k.colour, lineHeight: 1, textShadow: `0 0 16px ${k.colour}80` }}>
              {k.val ?? '—'}{typeof k.val === 'number' && k.val < 2 ? '' : '%'}
            </div>
            <div style={{ marginTop: 6 }}>
              <DataBar value={k.invert ? (100 - (k.val ?? 0)) : (k.val ?? 0)} max={k.max ? k.max * 100 : 100} colour={k.colour} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-dim)', marginTop: 4 }}>
              TGT {k.invert ? `<${k.target}` : `≥${k.target}`}{k.max ? '' : '%'}
            </div>
          </div>
        ))}
      </div>

      {/* Brief */}
      {brief && (
        <div style={{
          fontSize: 11, fontFamily: 'var(--font-mono)',
          color: 'rgba(255,255,255,0.6)', lineHeight: 1.7,
          borderTop: '1px solid rgba(245,158,11,0.1)',
          paddingTop: 10,
          maxHeight: 70, overflow: 'hidden',
          maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
        }}>{brief}</div>
      )}
    </div>
  );
}

// ─── Jobs Panel ─────────────────────────────────────────────
function JobsPanel() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs/search?limit=6')
      .then(r => r.json())
      .then(d => { setJobs(Array.isArray(d?.jobs) ? d.jobs : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const STATUS_C = {
    applied: 'var(--cyan)', interview: 'var(--orange)',
    offer: 'var(--green)', rejected: 'var(--red)', saved: 'var(--text-dim)'
  };

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid rgba(61,214,140,0.2)',
      borderRadius: 4, padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(61,214,140,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <PanelHeader icon="💼" label="SUSAN — JOB AUTOPILOT" colour="var(--green)" live />
      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: 1 }}>SCANNING TARGETS...</div>
      ) : jobs.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {jobs.slice(0, 5).map((j, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '6px 10px',
              background: 'rgba(61,214,140,0.03)',
              border: '1px solid rgba(61,214,140,0.08)',
              borderRadius: 2,
              transition: 'background 0.15s',
            }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)' }}>{j.title || j.job_title || '—'}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 1 }}>{j.company || '—'}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                {j.fit_score != null && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-hud)', fontSize: 14, color: 'var(--green)', fontWeight: 700 }}>{j.fit_score}%</div>
                    <DataBar value={j.fit_score} colour="var(--green)" width="40px" />
                  </div>
                )}
                {j.pipeline_status && (
                  <span style={{ fontFamily: 'var(--font-hud)', fontSize: 8, letterSpacing: 1, color: STATUS_C[j.pipeline_status] || 'var(--text-dim)', border: `1px solid currentColor`, padding: '2px 6px', borderRadius: 2 }}>
                    {j.pipeline_status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>NO ACTIVE TARGETS</div>
      )}
    </div>
  );
}

// ─── Voice Panel ────────────────────────────────────────────
function VoicePanel() {
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [agent, setAgent] = useState('BOB');
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const AGENT_COLOURS = { BOB:'#ff6b35', SUSAN:'#3dd68c', DOUG:'#60a5fa', RILEY:'#f59e0b', MAYA:'#c084fc' };
  const col = AGENT_COLOURS[agent] || '#00d4ff';

  // Canvas ring animation
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    let t = 0;
    const frame = () => {
      t += 1;
      const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      const active = status !== 'idle';
      const spd = status === 'listening' ? 0.12 : status === 'processing' ? 0.07 : 0.02;
      const pulse = 1 + Math.sin(t * spd) * (active ? 0.06 : 0.015);

      // Rings
      [[32, 0.0018, 0.6], [22, -0.003, 0.8], [14, 0.005, 1.0]].forEach(([r, s, a]) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * s * (active ? 3 : 1));
        ctx.beginPath();
        ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = col;
        ctx.globalAlpha = a * (active ? 0.9 : 0.4);
        ctx.lineWidth = 1;
        if (r === 32) ctx.setLineDash([4, 8]);
        if (r === 22) ctx.setLineDash([8, 4]);
        ctx.stroke();
        ctx.restore();
      });

      // Core dot
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
      g.addColorStop(0, '#fff');
      g.addColorStop(0.4, col);
      g.addColorStop(1, 'transparent');
      ctx.save(); ctx.globalAlpha = active ? 1 : 0.5;
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill(); ctx.restore();

      animRef.current = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(animRef.current);
  }, [status, col]);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus('idle'); return; }
    const rec = new SR(); rec.lang = 'en-AU'; rec.interimResults = false;
    setStatus('listening');
    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text); setStatus('processing');
      try {
        const r = await authedFetch('/api/friday/agent', {
          method: 'POST', body: JSON.stringify({ message: text })
        });
        const d = await r.json();
        setResponse(d?.reply || ''); setAgent(d?.agentKey || 'BOB'); setStatus('speaking');
        const va = await authedFetch('/api/friday/voice', { method: 'POST', body: JSON.stringify({ text: d?.reply || text }) });
        if (va.ok) {
          const buf = await va.arrayBuffer();
          const ac = new (window.AudioContext || window.webkitAudioContext)();
          const decoded = await ac.decodeAudioData(buf);
          const src = ac.createBufferSource(); src.buffer = decoded;
          src.connect(ac.destination); src.start(0);
          src.onended = () => { setStatus('idle'); ac.close(); };
        } else setStatus('idle');
      } catch { setStatus('idle'); }
    };
    rec.onerror = () => setStatus('idle');
    rec.start();
  };

  const STATUS_LABELS = { idle: 'STANDBY', listening: 'LISTENING', processing: 'PROCESSING', speaking: 'TRANSMITTING' };

  return (
    <div style={{
      background: 'var(--panel)',
      border: `1px solid ${col}30`,
      borderRadius: 4, padding: '18px 20px',
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.5s',
    }}>
      <PanelHeader icon="🎙" label={`VOICE — ${agent}`} colour={col} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <div style={{ position: 'relative', cursor: status === 'idle' ? 'pointer' : 'default' }} onClick={status === 'idle' ? startListening : undefined}>
          <canvas ref={canvasRef} width={90} height={90} style={{ display: 'block' }} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 20,
            filter: `drop-shadow(0 0 8px ${col})`,
          }}>
            {status === 'idle' ? '🎙' : status === 'listening' ? '◉' : status === 'processing' ? '⟳' : '▶'}
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: 9, letterSpacing: 3, color: col }}>{STATUS_LABELS[status] || 'STANDBY'}</div>
        {transcript && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 180, lineHeight: 1.5 }}>"{transcript}"</div>}
        {response && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', textAlign: 'center', maxWidth: 180, lineHeight: 1.6 }}>{response.slice(0, 140)}</div>}
      </div>
    </div>
  );
}

// ─── System Status Panel ─────────────────────────────────────
function SystemPanel() {
  const [uptime,    setUptime]    = useState(0);
  const [gazeActive, setGazeActive] = useState(null); // null = loading

  useEffect(() => {
    const start = Date.now();
    const id = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const check = () =>
      fetch('/api/tools/gaze-status').then(r => r.json())
        .then(d => setGazeActive(d.active))
        .catch(() => setGazeActive(false));
    check();
    const id = setInterval(check, 8000);
    return () => clearInterval(id);
  }, []);

  const fmt = s => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const systems = [
    { label: 'BRAIN',       val: 'CLAUDE SONNET 4.6',                           ok: true },
    { label: 'VOICE',       val: 'ELEVENLABS TTS',                               ok: true },
    { label: 'MEMORY',      val: 'SUPABASE',                                     ok: true },
    { label: 'AGENTS',      val: '5 ONLINE',                                     ok: true },
    { label: 'GAZE CORRECT',val: gazeActive === null ? 'CHECKING...' : gazeActive ? 'ACTIVE' : 'OFFLINE', ok: !!gazeActive },
    { label: 'SESSION',     val: fmt(uptime),                                    ok: true },
  ];

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid rgba(0,212,255,0.18)',
      borderRadius: 4, padding: '18px 20px',
    }}>
      <PanelHeader icon="⬡" label="SYSTEM STATUS" colour="var(--cyan)" live />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {systems.map(s => (
          <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)' }}>{s.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: s.ok ? 'var(--green)' : 'var(--red)' }}>{s.val}</span>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.ok ? 'var(--green)' : 'var(--red)', boxShadow: s.ok ? '0 0 6px var(--green)' : '0 0 6px var(--red)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Hex decoration */}
      <div style={{ marginTop: 14, textAlign: 'center' }}>
        <svg width="80" height="70" style={{ opacity: 0.15 }}>
          {[0,1,2,3,4,5].map(i => {
            const a = (i * 60 - 90) * Math.PI / 180;
            const x1 = 40 + 28 * Math.cos(a), y1 = 35 + 28 * Math.sin(a);
            const a2 = ((i+1) * 60 - 90) * Math.PI / 180;
            const x2 = 40 + 28 * Math.cos(a2), y2 = 35 + 28 * Math.sin(a2);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00d4ff" strokeWidth="1"/>;
          })}
          <circle cx="40" cy="35" r="10" fill="none" stroke="#00d4ff" strokeWidth="1" />
          <circle cx="40" cy="35" r="4" fill="#00d4ff" />
        </svg>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────
export default function Dashboard() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: 'auto auto',
      gap: 16, padding: 20,
      height: '100%',
      boxSizing: 'border-box',
    }}>
      <SalesPanel />
      <JobsPanel />
      <VoicePanel />
      <SystemPanel />
    </div>
  );
}
