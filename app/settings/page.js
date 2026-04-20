'use client';

import { useState, useEffect } from 'react';

const INTEGRATIONS = [
  { key: 'ANTHROPIC_API_KEY',           label: 'Anthropic (Claude)',      required: true  },
  { key: 'SUPABASE_URL',                label: 'Supabase URL',            required: true  },
  { key: 'SUPABASE_ANON_KEY',           label: 'Supabase Anon Key',       required: true  },
  { key: 'ELEVENLABS_VOICE_ID',         label: 'ElevenLabs Voice',        required: false },
  { key: 'MANAGER_AUTH_KEY',            label: 'Auth Key (security)',     required: false },
  { key: 'METRICOOL_API_KEY',           label: 'Metricool (S3 analytics)',required: false },
];

export default function SettingsPage() {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/s3/integrations')
      .then(r => r.json())
      .then(data => { setIntegrations(data.integrations || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  function getStatus(key) {
    const found = integrations.find(i => i.key === key);
    if (found) return found.status;
    return 'unknown';
  }

  const statusColour = { connected: '#3dd68c', missing: '#ef4444', unknown: 'var(--text-dim)' };
  const statusLabel  = { connected: 'CONNECTED', missing: 'MISSING', unknown: '—' };

  return (
    <div className="stack">
      <div className="page-head">
        <h1 style={{ color: '#4a6080' }}>Config — System Settings</h1>
        <p>API keys · integrations · candidate profile</p>
      </div>

      {/* Integrations */}
      <div className="card">
        <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 14 }}>Integrations</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {INTEGRATIONS.map(({ key, label, required }) => {
            const status = loading ? 'unknown' : getStatus(key);
            return (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    {key} {required ? '' : '· optional'}
                  </div>
                </div>
                <span className="badge" style={{ color: statusColour[status] || 'var(--text-dim)', borderColor: 'currentColor', fontSize: 9 }}>
                  {loading ? '...' : (statusLabel[status] || status.toUpperCase())}
                </span>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-dim)' }}>
          Set env vars in Netlify → Site configuration → Environment variables, then redeploy.
        </div>
      </div>

      {/* Candidate profile */}
      <div className="card">
        <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 14 }}>Candidate Profile</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            ['Name', 'Ben Lynch'],
            ['Location', 'Bangkok, Thailand'],
            ['Target roles', 'Sales Manager · Sales Ops · Team Lead'],
            ['Salary target', 'AUD $70,000+ / remote'],
            ['Notice period', 'Immediate'],
            ['LinkedIn', 'linkedin.com/in/ben-lynch'],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
              <div style={{ fontSize: 9, color: '#4a6080', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 3, textTransform: 'uppercase' }}>{k}</div>
              <div style={{ fontSize: 12, color: 'var(--text)' }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent roster */}
      <div className="card">
        <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 14 }}>Agent Roster</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['RILEY', '#f59e0b', 'Sales Ops · D2MS HelloFresh floor monitor · B1/B2/Canx KPIs'],
            ['SUSAN', '#3dd68c', 'Job Hunt · multi-source scraper · fit scoring · pipeline autopilot'],
            ['DOUG',  '#60a5fa', 'Tasks · daily runner · break down and execute anything'],
            ['MAYA',  '#c084fc', 'Brain · job analysis · application angle · cover letter assist'],
            ['S3',    '#D4352C', 'Savage Sales School · content pipeline · script generation · agent runs'],
          ].map(([name, colour, desc]) => (
            <div key={name} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: colour, boxShadow: `0 0 6px ${colour}`, flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: colour, minWidth: 40 }}>{name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
