'use client';

import { useState, useCallback } from 'react';
import { authedFetch } from '../lib/client-auth';

const C = '#3dd68c'; // jobs tab colour

const DEFAULT_TITLES = [
  'Sales Manager',
  'Sales Operations Manager',
  'Sales Team Leader',
  'Contact Centre Manager',
  'Outbound Sales Manager',
  'Inside Sales Manager',
];

export default function JobsView() {
  const [jobs,      setJobs]      = useState([]);
  const [scanning,  setScanning]  = useState(false);
  const [error,     setError]     = useState('');
  const [searched,  setSearched]  = useState(false);
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [minSalary,  setMinSalary]  = useState(70000);
  const [location,   setLocation]   = useState('Australia');
  const [debug,      setDebug]      = useState(null);
  const [expanded,   setExpanded]   = useState(null);

  const scan = useCallback(async () => {
    setScanning(true);
    setError('');
    setJobs([]);
    setDebug(null);
    try {
      const res  = await authedFetch('/api/jobs/search', {
        method: 'POST',
        body: JSON.stringify({ remoteOnly, minSalary, location }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Search failed');
      setJobs(data.jobs || []);
      setDebug(data.debug || null);
      setSearched(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setScanning(false);
    }
  }, [remoteOnly, minSalary, location]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '14px 20px 0',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: 10, letterSpacing: 4, color: `${C}80`, marginBottom: 2 }}>
            SUSAN · JOBS AUTOPILOT
          </div>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: 18, color: C, textShadow: `0 0 20px ${C}60` }}>
            JOB HUNT
          </div>
        </div>
        {searched && !scanning && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: `${C}80`, letterSpacing: 2 }}>
            {jobs.length} POSITIONS FOUND
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{
        padding: '12px 20px',
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        flexShrink: 0,
        borderBottom: '1px solid rgba(61,214,140,0.1)',
      }}>
        <div style={controlGroup}>
          <span style={labelStyle}>LOCATION</span>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            style={{ ...smallInput, width: 130 }}
            placeholder="Australia"
          />
        </div>

        <div style={controlGroup}>
          <span style={labelStyle}>MIN SALARY</span>
          <input
            type="number"
            value={minSalary}
            onChange={e => setMinSalary(Number(e.target.value))}
            style={{ ...smallInput, width: 90 }}
            step={5000}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={labelStyle}>REMOTE ONLY</span>
          <button
            onClick={() => setRemoteOnly(x => !x)}
            style={{
              padding: '4px 10px',
              fontFamily: 'var(--font-hud)',
              fontSize: 8,
              letterSpacing: 2,
              background: remoteOnly ? `${C}20` : 'transparent',
              border: `1px solid ${remoteOnly ? C : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 2,
              color: remoteOnly ? C : 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
            }}
          >
            {remoteOnly ? 'ON' : 'OFF'}
          </button>
        </div>

        <button
          onClick={scan}
          disabled={scanning}
          style={{
            marginLeft: 'auto',
            padding: '7px 20px',
            fontFamily: 'var(--font-hud)',
            fontSize: 9,
            letterSpacing: 3,
            background: scanning ? 'rgba(61,214,140,0.05)' : `${C}18`,
            border: `1px solid ${scanning ? `${C}40` : C}`,
            borderRadius: 2,
            color: scanning ? `${C}60` : C,
            cursor: scanning ? 'not-allowed' : 'pointer',
            textShadow: scanning ? 'none' : `0 0 10px ${C}60`,
            transition: 'all 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {scanning && <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: C, animation: 'pulse-dot 0.8s ease-in-out infinite' }} />}
          {scanning ? 'SCANNING...' : '◎ RUN SCAN'}
        </button>
      </div>

      {/* Target roles */}
      <div style={{ padding: '8px 20px', display: 'flex', gap: 5, flexWrap: 'wrap', flexShrink: 0 }}>
        {DEFAULT_TITLES.map(t => (
          <span key={t} style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 7,
            letterSpacing: 1,
            color: `${C}60`,
            border: `1px solid ${C}20`,
            borderRadius: 2,
            padding: '2px 7px',
          }}>{t}</span>
        ))}
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '0 20px 16px' }}>
        {error && (
          <div style={{
            padding: '8px 12px',
            border: '1px solid #ff444460',
            background: '#ff444410',
            borderRadius: 3,
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: '#ff4444',
            marginBottom: 10,
          }}>{error}</div>
        )}

        {!searched && !scanning && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: 32, color: `${C}15` }}>◎</div>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: 9, letterSpacing: 4, color: `${C}40` }}>
              AWAITING SCAN
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
              Hit RUN SCAN to search 6 job boards simultaneously
            </div>
          </div>
        )}

        {scanning && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: 9, letterSpacing: 4, color: C, animation: 'glow-pulse 1.5s ease-in-out infinite' }}>
              SCANNING JOB BOARDS
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['ADZUNA', 'MUSE', 'REMOTIVE', 'HIMALAYAS', 'GREENHOUSE', 'JOOBLE'].map((src, i) => (
                <div key={src} style={{
                  fontFamily: 'var(--font-hud)',
                  fontSize: 7,
                  letterSpacing: 1.5,
                  color: `${C}60`,
                  border: `1px solid ${C}30`,
                  borderRadius: 2,
                  padding: '3px 7px',
                  animation: `pulse-dot 1s ease-in-out ${i * 0.15}s infinite`,
                }}>{src}</div>
              ))}
            </div>
          </div>
        )}

        {!scanning && jobs.length > 0 && (
          <>
            {debug && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexShrink: 0 }}>
                {Object.entries(debug.countsBeforeDedupe || {}).filter(([k]) => k !== 'total').map(([src, n]) => (
                  <div key={src} style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: n > 0 ? `${C}80` : 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
                    {src.toUpperCase()} {n}
                  </div>
                ))}
              </div>
            )}
            <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {jobs.map((job, i) => (
                <JobCard
                  key={job.external_id || i}
                  job={job}
                  expanded={expanded === i}
                  onToggle={() => setExpanded(expanded === i ? null : i)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function JobCard({ job, expanded, onToggle }) {
  const fitPct = job.fit_score ? Math.round(job.fit_score * 100) : null;
  const fitCol = fitPct >= 80 ? '#3dd68c' : fitPct >= 60 ? '#f59e0b' : '#60a5fa';

  return (
    <div
      onClick={onToggle}
      style={{
        background: 'rgba(4,14,24,0.9)',
        border: `1px solid ${C}20`,
        borderLeft: `3px solid ${C}`,
        borderRadius: 3,
        padding: '10px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: 0.5, marginBottom: 3 }}>
            {job.title}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: `${C}70`, letterSpacing: 1 }}>
            {job.company}
            {job.location ? ` · ${job.location}` : ''}
            {job.remote ? ' · REMOTE' : ''}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {job.salary_min && (
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 8, color: '#f59e0b', letterSpacing: 1 }}>
              ${Math.round(job.salary_min / 1000)}k{job.salary_max ? `–${Math.round(job.salary_max / 1000)}k` : '+'}
            </span>
          )}
          {fitPct !== null && (
            <span style={{
              fontFamily: 'var(--font-hud)',
              fontSize: 8,
              letterSpacing: 1,
              color: fitCol,
              border: `1px solid ${fitCol}50`,
              padding: '2px 7px',
              borderRadius: 2,
            }}>
              {fitPct}%
            </span>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, border: '1px solid rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 2 }}>
            {job.source?.toUpperCase() || 'EXT'}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
          {job.description && (
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.7,
              marginBottom: 10,
              maxHeight: 120,
              overflowY: 'auto',
            }}>
              {job.description.slice(0, 500)}{job.description.length > 500 ? '...' : ''}
            </div>
          )}
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                padding: '5px 14px',
                fontFamily: 'var(--font-hud)',
                fontSize: 8,
                letterSpacing: 2,
                background: `${C}15`,
                border: `1px solid ${C}50`,
                borderRadius: 2,
                color: C,
                textDecoration: 'none',
              }}
            >
              VIEW LISTING ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const controlGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
};

const labelStyle = {
  fontFamily: 'var(--font-hud)',
  fontSize: 7,
  letterSpacing: 2,
  color: 'rgba(255,255,255,0.3)',
};

const smallInput = {
  padding: '5px 8px',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(61,214,140,0.2)',
  borderRadius: 2,
  color: 'rgba(255,255,255,0.75)',
  outline: 'none',
};
