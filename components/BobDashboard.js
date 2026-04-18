'use client';

import { useState, useEffect } from 'react';

function trendBadge(t) {
  const colors = {
    improving: 'var(--green)',
    stable: 'var(--green)',
    declining: 'var(--amber)',
    dropping: 'var(--red)',
    collapsed: 'var(--red)',
    mixed: 'var(--amber)',
    limited: 'var(--text-dim)'
  };
  return (
    <span className="badge" style={{ color: colors[t] || 'var(--text-dim)', borderColor: 'currentColor' }}>
      {t}
    </span>
  );
}

function cellStyle(value, target, higherBetter = true) {
  const pass = higherBetter ? value >= target : value <= target;
  return { color: pass ? 'var(--green)' : 'var(--red)', fontWeight: 600 };
}

export default function BobDashboard() {
  const [brief, setBrief] = useState('');
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [repData, setRepData] = useState(null);
  const [loadingReps, setLoadingReps] = useState(true);
  const [rileyInput, setRileyInput] = useState('');
  const [rileyReply, setRileyReply] = useState('');
  const [rileyBusy, setRileyBusy] = useState(false);

  async function loadBrief() {
    setLoadingBrief(true);
    try {
      const res = await fetch('/api/bob/brief');
      const data = await res.json();
      setBrief(data.brief || data.error || 'No brief available');
    } catch (err) {
      setBrief('Error loading brief: ' + err.message);
    } finally {
      setLoadingBrief(false);
    }
  }

  async function loadRepStats() {
    setLoadingReps(true);
    try {
      const res = await fetch('/api/sales/rep-stats');
      const data = await res.json();
      setRepData(data);
    } catch {
      setRepData(null);
    } finally {
      setLoadingReps(false);
    }
  }

  async function askRiley() {
    if (!rileyInput.trim() || rileyBusy) return;
    setRileyBusy(true);
    try {
      const res = await fetch('/api/friday/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: rileyInput, agentKey: 'RILEY' })
      });
      const data = await res.json();
      setRileyReply(data.reply || data.error || '');
      setRileyInput('');
    } catch (err) {
      setRileyReply('Error: ' + err.message);
    } finally {
      setRileyBusy(false);
    }
  }

  useEffect(() => { loadBrief(); loadRepStats(); }, []);

  const team = repData?.team;
  const reps = repData?.reps || [];
  const alerts = repData?.alerts || [];

  function statColour(val, target, higherBetter = true) {
    if (val == null) return 'var(--text-dim)';
    const pass = higherBetter ? val >= target : val <= target;
    return pass ? 'var(--green)' : 'var(--red)';
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>BOB — Sales Ops</h1>
        <p>D2MS HelloFresh AU · 17-rep outbound floor · Live performance dashboard</p>
      </div>

      {/* Team KPIs */}
      <div className="grid">
        <div className="card">
          <h2>Team B1%</h2>
          <p style={{ fontSize: 32, color: statColour(team?.b1, 90), fontWeight: 700 }}>
            {loadingReps ? '...' : `${team?.b1 ?? '—'}%`}
          </p>
          <p className="small">Target ≥90%</p>
        </div>
        <div className="card">
          <h2>Team B2%</h2>
          <p style={{ fontSize: 32, color: statColour(team?.b2, 65), fontWeight: 700 }}>
            {loadingReps ? '...' : `${team?.b2 ?? '—'}%`}
          </p>
          <p className="small">Target ≥65%</p>
        </div>
        <div className="card">
          <h2>24h Canx</h2>
          <p style={{ fontSize: 32, color: statColour(team?.canx, 10, false), fontWeight: 700 }}>
            {loadingReps ? '...' : `${team?.canx ?? '—'}%`}
          </p>
          <p className="small">Target &lt;10%</p>
        </div>
        <div className="card">
          <h2>Floor SPH</h2>
          <p style={{ fontSize: 32, color: 'var(--amber)', fontWeight: 700 }}>0.38</p>
          <p className="small">Target ≥0.60</p>
        </div>
      </div>

      {/* Riley — coaching alerts */}
      {alerts.length > 0 && (
        <div className="card" style={{ borderColor: 'var(--amber)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <h2 style={{ margin: 0, color: '#f59e0b' }}>RILEY — Coaching Alerts</h2>
            <span className="badge" style={{ color: '#f59e0b', borderColor: '#f59e0b', marginLeft: 4 }}>{alerts.length} reps need attention</span>
          </div>
          {alerts.map(a => (
            <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{a.name}</span>
              <div style={{ textAlign: 'right' }}>
                {a.issues.map(issue => (
                  <div key={issue} className="small" style={{ color: 'var(--red)' }}>{issue}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Riley quick chat */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 18 }}>📊</span>
          <h2 style={{ margin: 0, color: '#f59e0b' }}>Ask RILEY</h2>
          <span className="small" style={{ color: 'var(--text-dim)' }}>Sales floor intelligence</span>
        </div>
        {rileyReply && (
          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-dim)', fontSize: 13, marginBottom: 12, padding: '10px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: 6, borderLeft: '3px solid #f59e0b' }}>
            {rileyReply}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={rileyInput}
            onChange={e => setRileyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && askRiley()}
            placeholder="Who needs coaching today? Who's on fire?"
            style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 13 }}
          />
          <button className="btn" onClick={askRiley} disabled={rileyBusy || !rileyInput.trim()}>
            {rileyBusy ? '...' : 'Ask'}
          </button>
        </div>
      </div>

      {/* Today's briefing */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2>Today's briefing</h2>
          <button className="btn" onClick={loadBrief} disabled={loadingBrief}>
            {loadingBrief ? 'Thinking...' : 'Refresh'}
          </button>
        </div>
        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-dim)', fontSize: 14 }}>
          {brief || 'Loading...'}
        </div>
      </div>

      {/* Rep table */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Rep performance</h2>
        <button className="btn" onClick={loadRepStats} disabled={loadingReps} style={{ fontSize: 12 }}>
          {loadingReps ? '...' : 'Refresh'}
        </button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Rep</th>
            <th>B1%</th>
            <th>B2%</th>
            <th>Canx%</th>
            <th>Trend</th>
          </tr>
        </thead>
        <tbody>
          {reps.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td style={{ color: statColour(r.b1, 90), fontWeight: 600 }}>{r.b1}%</td>
              <td style={{ color: statColour(r.b2, 65), fontWeight: 600 }}>{r.b2}%</td>
              <td style={{ color: statColour(r.canx, 10, false), fontWeight: 600 }}>{r.canx}%</td>
              <td>
                <span className="badge" style={{
                  color: { improving:'var(--green)', stable:'var(--green)', declining:'var(--amber)', dropping:'var(--red)', collapsed:'var(--red)', mixed:'var(--amber)' }[r.trend] || 'var(--text-dim)',
                  borderColor: 'currentColor'
                }}>{r.trend}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
