'use client';

import { useState, useEffect } from 'react';

const SUSAN = '#3dd68c';

const DEFAULT_TITLES = [
  'Sales Manager', 'Sales Operations Manager', 'Sales Team Leader',
  'Contact Center Manager', 'Remote Sales Manager', 'Outbound Sales Manager',
].join('\n');

const DEFAULT_EXCLUDED = ['finance', 'investment', 'real estate', 'car sales', 'automotive sales'].join('\n');

function stripHtml(v) {
  return String(v || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function JobsPage() {
  const [tab, setTab] = useState('search');
  const [targetTitles, setTargetTitles] = useState(DEFAULT_TITLES);
  const [preferredLocations, setPreferredLocations] = useState('Australia\nNew Zealand');
  const [location, setLocation] = useState('');
  const [minSalary, setMinSalary] = useState('70000');
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [excludedKeywords, setExcludedKeywords] = useState(DEFAULT_EXCLUDED);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  useEffect(() => { if (tab === 'pipeline') loadApplications(); }, [tab]);

  async function loadApplications() {
    try {
      const res = await fetch('/api/packages');
      const data = await res.json();
      setApplications(data.packages || []);
    } catch { setApplications([]); }
  }

  async function runSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setJobs([]);
    try {
      const res = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTitles: targetTitles.split('\n').map(x => x.trim()).filter(Boolean),
          preferredLocations: preferredLocations.split('\n').map(x => x.trim()).filter(Boolean),
          location,
          minSalary: Number(minSalary || 0),
          remoteOnly,
          excludedKeywords: excludedKeywords.split('\n').map(x => x.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Search failed');
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const STATUS_C = { new: '#60a5fa', applied: '#f59e0b', interview: '#c084fc', offer: '#3dd68c', rejected: '#ef4444' };

  return (
    <div className="stack">
      <div className="page-head">
        <h1 style={{ color: SUSAN }}>SUSAN — Job Hunt</h1>
        <p>Autopilot job search · multi-source scraping · fit scoring · application pipeline</p>
      </div>

      {/* Stats */}
      <div className="grid">
        {[
          ['Results', jobs.length, 'from last search'],
          ['Applied', applications.filter(a => a.status !== 'new').length, 'in pipeline'],
          ['Interviews', applications.filter(a => a.status === 'interview').length, 'active'],
          ['Offers', applications.filter(a => a.status === 'offer').length, 'received'],
        ].map(([label, val, sub]) => (
          <div key={label} className="card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: val > 0 ? SUSAN : 'var(--text-dim)' }}>{val}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[['search', 'Search'], ['pipeline', 'Pipeline']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px 16px', fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: 2, textTransform: 'uppercase',
            color: tab === key ? SUSAN : 'var(--text-dim)',
            borderBottom: tab === key ? `2px solid ${SUSAN}` : '2px solid transparent',
            marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      {/* Search tab */}
      {tab === 'search' && (
        <div className="stack">
          <form onSubmit={runSearch}>
            <div className="card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>Target Titles</div>
                  <textarea rows={7} value={targetTitles} onChange={e => setTargetTitles(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, resize: 'vertical' }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>Excluded Keywords</div>
                  <textarea rows={7} value={excludedKeywords} onChange={e => setExcludedKeywords(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, resize: 'vertical' }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>Preferred Locations</div>
                  <textarea rows={3} value={preferredLocations} onChange={e => setPreferredLocations(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>Min Salary</div>
                    <input value={minSalary} onChange={e => setMinSalary(e.target.value)} placeholder="70000"
                      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>Location Filter</div>
                    <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Leave blank for broad"
                      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 11 }} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={remoteOnly} onChange={e => setRemoteOnly(e.target.checked)} />
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Remote only</span>
                  </label>
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <button type="submit" disabled={loading} className="btn"
                  style={{ background: SUSAN, border: 'none', color: '#000', fontWeight: 700, padding: '10px 24px' }}>
                  {loading ? 'Scanning sources...' : 'Run SUSAN'}
                </button>
              </div>
            </div>
          </form>

          {error && <div className="card" style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: 13 }}>{error}</div>}

          {jobs.length > 0 && (
            <div className="stack">
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{jobs.length} results</div>
              {jobs.map(job => (
                <div key={`${job.source}-${job.external_id}`} className="card" style={{ borderLeft: `3px solid ${job.fit_score >= 80 ? SUSAN : job.fit_score >= 60 ? '#f59e0b' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6 }}>{job.company} · {job.location} · {job.remote ? 'Remote' : 'On-site'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{stripHtml(job.description).slice(0, 300)}{stripHtml(job.description).length > 300 ? '...' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                      <span className="badge" style={{ color: job.fit_score >= 80 ? SUSAN : '#f59e0b', borderColor: 'currentColor' }}>
                        {job.fit_score}% fit
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{job.source}</span>
                      {job.apply_url && (
                        <a href={job.apply_url} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: 10, padding: '4px 10px' }}>Apply →</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pipeline tab */}
      {tab === 'pipeline' && (
        <div className="stack">
          {applications.length === 0 && <div className="card" style={{ color: 'var(--text-dim)', fontSize: 13 }}>No applications in pipeline yet.</div>}
          {applications.map(a => (
            <div key={a.id} className="card" style={{ borderLeft: `3px solid ${STATUS_C[a.status] || 'var(--border)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.jobTitle || a.job_title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{a.company}</div>
                </div>
                <span className="badge" style={{ color: STATUS_C[a.status] || 'var(--text-dim)', borderColor: 'currentColor' }}>{a.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
