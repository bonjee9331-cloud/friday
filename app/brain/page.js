'use client';

import { useState } from 'react';

const MAYA = '#c084fc';

export default function BrainPage() {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function analyzeJob() {
    if (!jobDescription.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/brain/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobTitle, company, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1 style={{ color: MAYA }}>Brain — Application Analysis</h1>
        <p>Paste a job description · get fit score, key requirements, and a tailored application angle</p>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>Job Title</div>
            <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Sales Manager"
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
          </div>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>Company</div>
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Acme Corp"
              style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>Job Description</div>
          <textarea rows={12} value={jobDescription} onChange={e => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12, resize: 'vertical', lineHeight: 1.6 }} />
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="btn" onClick={analyzeJob} disabled={loading || !jobDescription.trim()}
            style={{ background: MAYA, border: 'none', color: '#000', fontWeight: 700, padding: '10px 24px' }}>
            {loading ? 'Analysing...' : 'Analyse Job'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card" style={{ borderColor: '#ef4444' }}>
          <div style={{ color: '#ef4444', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{error}</div>
        </div>
      )}

      {result && (
        <div className="stack">
          {/* Fit score */}
          {result.fitScore != null && (
            <div className="card" style={{ borderLeft: `3px solid ${result.fitScore >= 80 ? '#3dd68c' : result.fitScore >= 60 ? '#f59e0b' : '#ef4444'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 48, fontWeight: 700, color: result.fitScore >= 80 ? '#3dd68c' : result.fitScore >= 60 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>{result.fitScore}</div>
                <div>
                  <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>Fit Score</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>{result.fitSummary || result.summary}</div>
                </div>
              </div>
            </div>
          )}

          {/* Key requirements */}
          {result.keyRequirements?.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 9, letterSpacing: 2, color: MAYA, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 10 }}>Key Requirements</div>
              {result.keyRequirements.map((req, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: i < result.keyRequirements.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ color: MAYA, fontSize: 10, paddingTop: 2, flexShrink: 0 }}>▸</span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{req}</span>
                </div>
              ))}
            </div>
          )}

          {/* Gaps */}
          {result.gaps?.length > 0 && (
            <div className="card">
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#f59e0b', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 10 }}>Gaps to Address</div>
              {result.gaps.map((g, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: i < result.gaps.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ color: '#f59e0b', fontSize: 10, paddingTop: 2, flexShrink: 0 }}>⚠</span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{g}</span>
                </div>
              ))}
            </div>
          )}

          {/* Application angle */}
          {(result.applicationAngle || result.coverLetterAngle) && (
            <div className="card">
              <div style={{ fontSize: 9, letterSpacing: 2, color: '#00d4ff', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 10 }}>Recommended Angle</div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{result.applicationAngle || result.coverLetterAngle}</div>
            </div>
          )}

          {/* Raw fallback */}
          {!result.fitScore && !result.keyRequirements && (
            <div className="card">
              <pre style={{ fontSize: 11, color: 'var(--text-dim)', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
