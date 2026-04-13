'use client';

import { useState, useEffect } from 'react';

const REPS = [
  { name: 'Aaron Longmate', b1: 83.2, b2: 61.5, canx: 16.8, trend: 'declining' },
  { name: 'Antony Sweeney', b1: 73.2, b2: 57.7, canx: 26.8, trend: 'declining' },
  { name: 'Danny Pachano', b1: 75.6, b2: 52.2, canx: 24.4, trend: 'declining' },
  { name: 'Glen Clarkson', b1: 78.0, b2: 73.0, canx: 15.0, trend: 'stable' },
  { name: 'Henri Rosalino', b1: 73.6, b2: 69.2, canx: 26.4, trend: 'limited' },
  { name: 'Jackson Leahy', b1: 76.1, b2: 74.4, canx: 23.9, trend: 'improving' },
  { name: 'JJ Fourie', b1: 72.0, b2: 65.3, canx: 28.0, trend: 'mixed' },
  { name: 'Kyran Drake', b1: 68.8, b2: 62.1, canx: 31.2, trend: 'declining' },
  { name: 'Michael Birch', b1: 60.0, b2: 6.7, canx: 40.0, trend: 'collapsed' },
  { name: 'Oscar Penkethman', b1: 74.4, b2: 67.1, canx: 25.6, trend: 'declining' },
  { name: 'Peter Cloy', b1: 75.8, b2: 59.6, canx: 24.2, trend: 'declining' },
  { name: 'Rahool Bhatt', b1: 78.1, b2: 46.4, canx: 21.9, trend: 'dropping' },
  { name: 'Samuel Bailey', b1: 74.8, b2: 58.2, canx: 25.2, trend: 'declining' },
  { name: 'Samuel Daly', b1: 71.2, b2: 56.0, canx: 28.8, trend: 'improving' }
];

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

  useEffect(() => { loadBrief(); }, []);

  return (
    <div className="stack">
      <div className="page-head">
        <h1>BOB Sales Ops</h1>
        <p>D2MS HelloFresh AU outbound floor. Real time rep performance and daily briefings.</p>
      </div>

      <div className="grid">
        <div className="card">
          <h2>Team B1%</h2>
          <p style={{ fontSize: 32, color: 'var(--red)', fontWeight: 700 }}>74.1%</p>
          <p className="small">Target 90% and above</p>
        </div>
        <div className="card">
          <h2>Team B2%</h2>
          <p style={{ fontSize: 32, color: 'var(--red)', fontWeight: 700 }}>58.1%</p>
          <p className="small">Target 65% and above</p>
        </div>
        <div className="card">
          <h2>24h Canx</h2>
          <p style={{ fontSize: 32, color: 'var(--red)', fontWeight: 700 }}>25.9%</p>
          <p className="small">Target 10% and below</p>
        </div>
        <div className="card">
          <h2>Floor SPH</h2>
          <p style={{ fontSize: 32, color: 'var(--amber)', fontWeight: 700 }}>0.38</p>
          <p className="small">Target 0.60 plus</p>
        </div>
      </div>

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

      <h2 className="section-title">Rep performance</h2>
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
          {REPS.map((r) => (
            <tr key={r.name}>
              <td>{r.name}</td>
              <td style={cellStyle(r.b1, 90, true)}>{r.b1}%</td>
              <td style={cellStyle(r.b2, 65, true)}>{r.b2}%</td>
              <td style={cellStyle(r.canx, 10, false)}>{r.canx}%</td>
              <td>{trendBadge(r.trend)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
