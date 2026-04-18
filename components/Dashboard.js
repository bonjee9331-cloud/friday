'use client';

import { useEffect, useState } from 'react';

const ACCENT = '#ff6b35';
const ACCENT_DIM = 'rgba(255,107,53,0.6)';
const PANEL_STYLE = {
  background: 'rgba(255,107,53,0.04)',
  border: '1px solid rgba(255,107,53,0.18)',
  borderRadius: 6,
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  minHeight: 220,
  overflow: 'hidden',
};
const LABEL = { fontSize: 9, letterSpacing: 4, color: ACCENT_DIM, marginBottom: 4 };
const STATUS_COLORS = {
  applied: '#4f8cff',
  interview: '#ff6b35',
  offer: '#3dd68c',
  rejected: '#ff4444',
  saved: 'rgba(255,255,255,0.4)',
};

function PanelTitle({ children }) {
  return (
    <div style={{ fontSize: 10, letterSpacing: 4, color: ACCENT, borderBottom: '1px solid rgba(255,107,53,0.15)', paddingBottom: 8, marginBottom: 4 }}>
      {children}
    </div>
  );
}

function SalesPanel() {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bob/brief')
      .then(r => r.json())
      .then(d => { setBrief(d?.briefing || d?.brief || ''); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={PANEL_STYLE}>
      <PanelTitle>SALES FLOOR</PanelTitle>
      {loading ? (
        <div style={{ color: ACCENT_DIM, fontSize: 11 }}>Loading briefing...</div>
      ) : brief ? (
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, overflow: 'auto', flex: 1 }}>{brief}</div>
      ) : (
        <div style={{ color: ACCENT_DIM, fontSize: 11 }}>No briefing available.</div>
      )}
    </div>
  );
}

function JobsPanel() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/jobs/search?limit=5')
      .then(r => r.json())
      .then(d => { setJobs(Array.isArray(d?.jobs) ? d.jobs : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={PANEL_STYLE}>
      <PanelTitle>JOB AUTOPILOT</PanelTitle>
      {loading ? (
        <div style={{ color: ACCENT_DIM, fontSize: 11 }}>Loading jobs...</div>
      ) : jobs.length ? jobs.map((j, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,107,53,0.08)', paddingBottom: 6 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>{j.title || j.job_title || '—'}</div>
            <div style={{ fontSize: 10, color: ACCENT_DIM }}>{j.company || '—'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {j.fit_score != null && (
              <span style={{ fontSize: 10, color: '#3dd68c' }}>{j.fit_score}%</span>
            )}
            {j.pipeline_status && (
              <span style={{ fontSize: 9, color: STATUS_COLORS[j.pipeline_status] || ACCENT_DIM, letterSpacing: 1 }}>
                {j.pipeline_status.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      )) : (
        <div style={{ color: ACCENT_DIM, fontSize: 11 }}>No jobs found.</div>
      )}
    </div>
  );
}

function MemoryPanel() {
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/friday/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: '__history__', module: 'memory' }) })
      .then(r => r.json())
      .then(d => { setMsgs(Array.isArray(d?.history) ? d.history.slice(-5) : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={PANEL_STYLE}>
      <PanelTitle>MEMORY</PanelTitle>
      {loading ? (
        <div style={{ color: ACCENT_DIM, fontSize: 11 }}>Loading memory...</div>
      ) : msgs.length ? msgs.map((m, i) => (
        <div key={i} style={{ fontSize: 10, color: m.role === 'user' ? 'rgba(255,255,255,0.7)' : ACCENT_DIM, lineHeight: 1.5, borderBottom: '1px solid rgba(255,107,53,0.07)', paddingBottom: 5 }}>
          <span style={{ color: ACCENT, marginRight: 6 }}>{m.role === 'user' ? 'BEN' : 'FRI'}›</span>
          {(m.content || '').slice(0, 140)}
        </div>
      )) : (
        <div style={{ color: ACCENT_DIM, fontSize: 11 }}>No recent conversations.</div>
      )}
    </div>
  );
}

function VoicePanel() {
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');

  const startListening = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setStatus('unsupported');
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-AU';
    rec.interimResults = false;
    setStatus('listening');
    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setStatus('thinking');
      try {
        const r = await fetch('/api/friday/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const d = await r.json();
        const reply = d?.reply || d?.message || '';
        setResponse(reply);
        setStatus('speaking');
        const va = await fetch('/api/friday/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: reply }),
        });
        if (va.ok) {
          const buf = await va.arrayBuffer();
          const ac = new (window.AudioContext || window.webkitAudioContext)();
          const decoded = await ac.decodeAudioData(buf);
          const src = ac.createBufferSource();
          src.buffer = decoded;
          src.connect(ac.destination);
          src.start(0);
          src.onended = () => { setStatus('idle'); ac.close(); };
        } else {
          setStatus('idle');
        }
      } catch { setStatus('idle'); }
    };
    rec.onerror = () => setStatus('idle');
    rec.start();
  };

  return (
    <div style={PANEL_STYLE}>
      <PanelTitle>VOICE</PanelTitle>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        <button
          onClick={startListening}
          disabled={status !== 'idle'}
          style={{
            width: 64, height: 64, borderRadius: '50%',
            border: `2px solid ${status === 'listening' ? ACCENT : 'rgba(255,107,53,0.3)'}`,
            background: status === 'listening' ? 'rgba(255,107,53,0.15)' : 'transparent',
            cursor: status === 'idle' ? 'pointer' : 'default',
            color: ACCENT, fontSize: 22,
            transition: 'all 0.2s',
            boxShadow: status === 'listening' ? `0 0 20px rgba(255,107,53,0.4)` : 'none',
          }}
        >
          {status === 'listening' ? '◉' : status === 'thinking' ? '⟳' : status === 'speaking' ? '▶' : '🎙'}
        </button>
        <div style={{ fontSize: 9, letterSpacing: 3, color: ACCENT_DIM }}>
          {status === 'idle' ? 'TAP TO SPEAK' : status.toUpperCase()}
        </div>
        {transcript && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', maxWidth: 200 }}>"{transcript}"</div>}
        {response && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center', maxWidth: 200, lineHeight: 1.5 }}>{response.slice(0, 120)}</div>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: '1fr 1fr',
      gap: 16,
      padding: 20,
      height: '100%',
      boxSizing: 'border-box',
    }}>
      <SalesPanel />
      <JobsPanel />
      <MemoryPanel />
      <VoicePanel />
    </div>
  );
}
