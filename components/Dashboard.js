'use client';

import { useEffect, useState, useRef } from 'react';
import { authedFetch } from '../lib/client-auth';

// ─── Shared UI ──────────────────────────────────────────────
function DataBar({ value, max = 100, colour }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: colour, boxShadow: `0 0 5px ${colour}`, borderRadius: 1, transition: 'width 1s ease' }} />
    </div>
  );
}

function WidgetShell({ colour = '#00d4ff', label, icon, children, span = 1, rowSpan = 1 }) {
  return (
    <div className="hud-widget" style={{
      gridColumn: span > 1 ? `span ${span}` : undefined,
      gridRow:    rowSpan > 1 ? `span ${rowSpan}` : undefined,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, borderBottom: `1px solid ${colour}18`, paddingBottom: 7 }}>
        <span style={{ fontSize: 12, filter: `drop-shadow(0 0 5px ${colour})` }}>{icon}</span>
        <span style={{ fontFamily: 'var(--font-hud)', fontSize: 8, letterSpacing: 3, color: colour, flex: 1 }}>{label}</span>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: colour, boxShadow: `0 0 5px ${colour}`, animation: 'pulse-dot 2s ease-in-out infinite', flexShrink: 0 }} />
      </div>
      {children}
    </div>
  );
}

// ─── B1 / B2 / CANX widgets ──────────────────────────────────
function SalesKpiWidgets() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    authedFetch('/api/sales/rep-stats').then(r => r.json()).then(setStats).catch(() => {});
    const id = setInterval(() => authedFetch('/api/sales/rep-stats').then(r => r.json()).then(setStats).catch(() => {}), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  const t = stats?.team;
  const kpis = [
    { label: 'B1 RATE',    val: t?.b1,   target: 90,  max: 100, ok: (t?.b1 ?? 0) >= 90,  colour: '#3dd68c' },
    { label: 'B2 RATE',    val: t?.b2,   target: 65,  max: 100, ok: (t?.b2 ?? 0) >= 65,  colour: t?.b2 >= 65 ? '#3dd68c' : '#f59e0b' },
    { label: 'CANX 24H',   val: t?.canx, target: 10,  max: 25,  ok: (t?.canx ?? 99) <= 10, colour: (t?.canx ?? 99) <= 10 ? '#3dd68c' : '#ef4444', invert: true },
  ];
  return kpis.map(k => (
    <WidgetShell key={k.label} colour={k.colour} label={k.label} icon="📊">
      <div style={{ fontFamily: 'var(--font-hud)', fontSize: 30, fontWeight: 700, color: k.colour, lineHeight: 1, textShadow: `0 0 14px ${k.colour}70` }}>
        {k.val ?? '—'}{typeof k.val === 'number' ? '%' : ''}
      </div>
      <DataBar value={k.invert ? (100 - (k.val ?? 0)) : (k.val ?? 0)} max={k.max} colour={k.colour} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,212,255,0.35)', marginTop: 5 }}>
        TGT {k.invert ? `<${k.target}` : `≥${k.target}`}%
      </div>
    </WidgetShell>
  ));
}

// ─── FairWork widget ─────────────────────────────────────────
function FairWorkWidget() {
  const [data, setData] = useState(null);
  useEffect(() => {
    authedFetch('/api/doug/fairwork').then(r => r.json()).then(setData).catch(() => {});
  }, []);
  return (
    <WidgetShell colour="#60a5fa" label="FAIR WORK" icon="⚖">
      {data ? (
        <div>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: 11, color: data.status === 'CLEAR' ? '#3dd68c' : '#f59e0b', marginBottom: 4 }}>{data.status}</div>
          {data.alerts?.length ? (
            data.alerts.slice(0, 2).map((a, i) => (
              <div key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#60a5fa', lineHeight: 1.5 }}>{a}</div>
            ))
          ) : (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.4)' }}>No active alerts</div>
          )}
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(96,165,250,0.4)' }}>LOADING...</div>
      )}
    </WidgetShell>
  );
}

// ─── Leaderboard widget ──────────────────────────────────────
function LeaderboardWidget() {
  const [reps, setReps] = useState([]);
  useEffect(() => {
    authedFetch('/api/sales/rep-stats').then(r => r.json())
      .then(d => setReps(Array.isArray(d?.reps) ? d.reps.slice(0, 5) : [])).catch(() => {});
  }, []);
  return (
    <WidgetShell colour="#f59e0b" label="LEADERBOARD" icon="🏆" rowSpan={2}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {reps.length ? reps.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 9, color: i === 0 ? '#f59e0b' : 'rgba(0,212,255,0.35)', width: 14 }}>{i + 1}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b8d4e8', flex: 1 }}>{r.name || r.rep_name || '—'}</span>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 11, color: '#3dd68c' }}>{r.sales ?? r.total_sales ?? '—'}</span>
          </div>
        )) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(245,158,11,0.35)' }}>LOADING...</div>
        )}
      </div>
    </WidgetShell>
  );
}

// ─── Agents widget ───────────────────────────────────────────
function AgentsWidget() {
  const AGENTS = [
    { key: 'BOB',   colour: '#ff6b35', role: 'Orchestrator'   },
    { key: 'RILEY', colour: '#f59e0b', role: 'Sales Monitor'  },
    { key: 'SUSAN', colour: '#3dd68c', role: 'Job Autopilot'  },
    { key: 'DOUG',  colour: '#60a5fa', role: 'Task Runner'    },
    { key: 'MAYA',  colour: '#c084fc', role: 'Researcher'     },
  ];
  return (
    <WidgetShell colour="#c084fc" label="AGENTS ONLINE" icon="◎">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {AGENTS.map((a, i) => (
          <div key={a.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: a.colour, boxShadow: `0 0 5px ${a.colour}`, animation: 'pulse-dot 2.5s ease-in-out infinite', animationDelay: `${i * 0.28}s`, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, fontWeight: 600, color: a.colour, width: 46, letterSpacing: 0.5 }}>{a.key}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,212,255,0.35)' }}>{a.role}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#3dd68c', marginLeft: 'auto' }}>ONLINE</span>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

// ─── Weather widget ──────────────────────────────────────────
function WeatherWidget() {
  const [wx, setWx] = useState(null);
  const WMO = { 0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',51:'Drizzle',61:'Rain',65:'Heavy Rain',80:'Showers',95:'Storm' };
  useEffect(() => {
    fetch('/api/weather').then(r => r.json()).then(setWx).catch(() => {});
  }, []);
  return (
    <WidgetShell colour="#00d4ff" label="HUA HIN WEATHER" icon="🌡">
      {wx ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 28, fontWeight: 100, color: '#00d4ff', lineHeight: 1 }}>{wx.temp}°</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.55)' }}>{WMO[wx.code] || wx.desc}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,212,255,0.4)', marginTop: 5, lineHeight: 1.7 }}>
            <div>Feels {wx.feels}°  ·  Wind {wx.wind}km/h</div>
            <div>Rain {wx.rain}%  ·  Humidity {wx.humidity ?? '—'}%</div>
          </div>
        </div>
      ) : (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.35)' }}>LOADING...</div>
      )}
    </WidgetShell>
  );
}

// ─── Job Matches widget ──────────────────────────────────────
function JobMatchesWidget() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch('/api/jobs/search?limit=4').then(r => r.json())
      .then(d => { setJobs(Array.isArray(d?.jobs) ? d.jobs : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  return (
    <WidgetShell colour="#3dd68c" label="JOB MATCHES · SUSAN" icon="💼" rowSpan={2}>
      {loading ? (
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(61,214,140,0.4)' }}>SCANNING...</div>
      ) : jobs.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {jobs.slice(0, 4).map((j, i) => (
            <div key={i} style={{
              padding: '6px 8px',
              background: 'rgba(61,214,140,0.03)',
              border: '1px solid rgba(61,214,140,0.08)',
              borderRadius: 2,
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b8d4e8' }}>{j.title || j.job_title || '—'}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,212,255,0.35)' }}>{j.company || '—'}</span>
                {j.fit_score != null && (
                  <span style={{ fontFamily: 'var(--font-hud)', fontSize: 10, color: '#3dd68c', fontWeight: 700 }}>{j.fit_score}%</span>
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

// ─── Tasks widget ────────────────────────────────────────────
function TasksWidget() {
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    authedFetch('/api/tasks?limit=5').then(r => r.json())
      .then(d => setTasks(Array.isArray(d?.tasks) ? d.tasks : [])).catch(() => {});
  }, []);
  const STATUS_C = { queued: '#60a5fa', running: '#f59e0b', done: '#3dd68c', blocked: '#ef4444', void: 'rgba(0,212,255,0.25)' };
  return (
    <WidgetShell colour="#60a5fa" label="TASKS · DOUG" icon="▦" rowSpan={2}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {tasks.length ? tasks.slice(0, 5).map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: STATUS_C[t.status] || '#60a5fa', flexShrink: 0, marginTop: 4 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b8d4e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title || t.name || '—'}</div>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: 7, color: STATUS_C[t.status] || '#60a5fa', letterSpacing: 1 }}>{(t.status || '').toUpperCase()}</div>
            </div>
          </div>
        )) : (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(96,165,250,0.35)' }}>NO ACTIVE TASKS</div>
        )}
      </div>
    </WidgetShell>
  );
}

// ─── Markets widget ──────────────────────────────────────────
function MarketsWidget() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/markets').then(r => r.json()).then(setData).catch(() => {});
  }, []);
  const tickers = data ? [
    { sym: 'S&P',  val: data.sp500,  chg: data.sp500_chg  },
    { sym: 'ASX',  val: data.asx200, chg: data.asx200_chg },
    { sym: 'BTC',  val: data.btc,    chg: data.btc_chg    },
    { sym: 'OIL',  val: data.oil,    chg: data.oil_chg    },
  ] : [];
  return (
    <WidgetShell colour="#f59e0b" label="MARKETS" icon="▲">
      {data ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {tickers.map(t => {
            const up  = (t.chg ?? 0) >= 0;
            const col = up ? '#3dd68c' : '#ef4444';
            return (
              <div key={t.sym}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(0,212,255,0.4)', letterSpacing: 1.5 }}>{t.sym}</div>
                <div style={{ fontFamily: 'var(--font-hud)', fontSize: 12, color: '#b8d4e8' }}>
                  {t.val != null ? (t.val > 999 ? t.val.toLocaleString('en', { maximumFractionDigits: 0 }) : t.val.toFixed(2)) : '—'}
                </div>
                {t.chg != null && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: col }}>
                    {up ? '+' : ''}{t.chg.toFixed(2)}%
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

// ─── System Status widget ────────────────────────────────────
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
  const fmt = s => `${String(Math.floor(s/3600)).padStart(2,'0')}:${String(Math.floor((s%3600)/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const systems = [
    { label: 'BRAIN',  val: 'SONNET 4.6',     ok: true  },
    { label: 'VOICE',  val: 'ELEVENLABS',      ok: true  },
    { label: 'MEMORY', val: 'SUPABASE',        ok: true  },
    { label: 'GAZE',   val: gaze === null ? '...' : gaze ? 'ACTIVE' : 'OFFLINE', ok: !!gaze },
    { label: 'UPTIME', val: fmt(uptime),       ok: true  },
  ];
  return (
    <WidgetShell colour="#00d4ff" label="SYSTEM STATUS" icon="⬡">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {systems.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: s.ok ? '#3dd68c' : '#ef4444', boxShadow: `0 0 4px ${s.ok ? '#3dd68c' : '#ef4444'}`, flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(0,212,255,0.4)', width: 44 }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: s.ok ? 'rgba(184,212,232,0.75)' : '#ef4444' }}>{s.val}</span>
          </div>
        ))}
      </div>
    </WidgetShell>
  );
}

// ─── Voice Orb widget ────────────────────────────────────────
function VoiceWidget() {
  const [status, setStatus] = useState('idle');
  const [response, setResponse] = useState('');
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const col = '#00d4ff';

  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d');
    let t = 0;
    const frame = () => {
      t++;
      const w = cv.width, h = cv.height, cx = w / 2, cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      const active = status !== 'idle';
      const spd = status === 'listening' ? 0.12 : 0.02;
      const pulse = 1 + Math.sin(t * spd) * (active ? 0.07 : 0.015);
      [[28, 0.002, 0.5],[18, -0.004, 0.7],[10, 0.007, 1.0]].forEach(([r, s, a]) => {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * s * (active ? 4 : 1));
        ctx.beginPath(); ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = col; ctx.globalAlpha = a * (active ? 0.9 : 0.35);
        ctx.lineWidth = 0.8;
        if (r === 28) ctx.setLineDash([4, 8]);
        if (r === 18) ctx.setLineDash([8, 4]);
        ctx.stroke(); ctx.restore();
      });
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 7);
      g.addColorStop(0, '#fff'); g.addColorStop(0.4, col); g.addColorStop(1, 'transparent');
      ctx.save(); ctx.globalAlpha = active ? 1 : 0.4;
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = g; ctx.fill(); ctx.restore();
      animRef.current = requestAnimationFrame(frame);
    };
    frame();
    return () => cancelAnimationFrame(animRef.current);
  }, [status]);

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR(); rec.lang = 'en-AU'; rec.interimResults = false;
    setStatus('listening');
    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setStatus('processing');
      try {
        const r = await authedFetch('/api/friday/agent', { method: 'POST', body: JSON.stringify({ message: text }) });
        const d = await r.json();
        setResponse((d?.reply || '').slice(0, 120));
        setStatus('speaking');
        const va = await authedFetch('/api/friday/voice', { method: 'POST', body: JSON.stringify({ text: d?.reply || '' }) });
        if (va.ok) {
          const buf = await va.arrayBuffer();
          const ac = new (window.AudioContext || window.webkitAudioContext)();
          const src = ac.createBufferSource(); src.buffer = await ac.decodeAudioData(buf);
          src.connect(ac.destination); src.start(0);
          src.onended = () => { setStatus('idle'); ac.close(); };
        } else setStatus('idle');
      } catch { setStatus('idle'); }
    };
    rec.onerror = () => setStatus('idle');
    rec.start();
  };

  const LABELS = { idle: 'STANDBY', listening: 'LISTENING', processing: 'PROCESSING', speaking: 'TRANSMITTING' };

  return (
    <WidgetShell colour={col} label="VOICE — BOB" icon="🎙">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ cursor: status === 'idle' ? 'pointer' : 'default' }} onClick={status === 'idle' ? startListening : undefined}>
          <canvas ref={canvasRef} width={70} height={70} style={{ display: 'block' }} />
        </div>
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: 7, letterSpacing: 3, color: col }}>{LABELS[status] || 'STANDBY'}</div>
        {response && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text)', textAlign: 'center', lineHeight: 1.5 }}>{response}</div>}
      </div>
    </WidgetShell>
  );
}

// ─── COCKPIT GRID ────────────────────────────────────────────
export default function Dashboard() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridAutoRows: 'minmax(140px, auto)',
      gap: 10,
      padding: '14px 16px',
      height: '100%',
      boxSizing: 'border-box',
      overflowY: 'auto',
      alignContent: 'start',
    }}>
      <SalesKpiWidgets />
      <FairWorkWidget />
      <LeaderboardWidget />
      <AgentsWidget />
      <WeatherWidget />
      <MarketsWidget />
      <JobMatchesWidget />
      <TasksWidget />
      <VoiceWidget />
      <SystemWidget />
    </div>
  );
}
