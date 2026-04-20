'use client';

import { useState, useEffect } from 'react';

const PILLARS = ['Rise and Shine', 'Objection Rebuttals', 'Framework Drops', 'Sales Floor Truths', 'Badass Identity', 'Proof and Payoff'];
const STATUSES = ['drafted', 'approved', 'produced', 'scheduled', 'posted', 'rejected'];
const STATUS_COLOURS = {
  drafted:   '#60a5fa',
  approved:  '#3dd68c',
  produced:  '#c084fc',
  scheduled: '#f59e0b',
  posted:    '#00d4ff',
  rejected:  '#ef4444',
};
const ACTIONS = [
  { key: 'generateScripts',   label: 'Generate Scripts',    hint: 'AI writes new scripts',        params: { pillar: 'Objection Rebuttals', count: 3, platform: 'all', dayOffset: 8 } },
  { key: 'researchTrends',    label: 'Research Trends',     hint: 'Scan platform trends',          params: { platform: 'TikTok', window: '7d' } },
  { key: 'analyseCompetitor', label: 'Analyse Competitor',  hint: 'Competitor content audit',      params: { handle: '@salesleadership', platform: 'TikTok' } },
  { key: 'reviewMetrics',     label: 'Review Metrics',      hint: 'Performance analysis',          params: { period: 'last_7_days' } },
  { key: 'draftWeeklyReport', label: 'Draft Weekly Report', hint: 'Full week summary',             params: {} },
];

export default function S3Page() {
  const [tab, setTab] = useState('pipeline');
  const [scripts, setScripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState([]);
  const [runLoading, setRunLoading] = useState(false);
  const [agentOutput, setAgentOutput] = useState(null);

  useEffect(() => { loadScripts(); loadRuns(); }, []);

  async function loadScripts() {
    setLoading(true);
    try {
      const res = await fetch('/api/s3/scripts');
      const data = await res.json();
      setScripts(data.scripts || []);
    } catch { setScripts([]); }
    setLoading(false);
  }

  async function loadRuns() {
    try {
      const res = await fetch('/api/s3/agent');
      const data = await res.json();
      setRuns(data.runs || []);
    } catch { setRuns([]); }
  }

  async function updateStatus(id, status) {
    await fetch('/api/s3/scripts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    loadScripts();
  }

  async function runAgent(action, params) {
    setRunLoading(true);
    setAgentOutput(null);
    try {
      const res = await fetch('/api/s3/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, params }),
      });
      const data = await res.json();
      setAgentOutput({ runId: data.runId, message: `Run started (ID: ${data.runId}). Check logs for output.` });
      setTimeout(() => { loadRuns(); }, 3000);
    } catch (err) {
      setAgentOutput({ error: err.message });
    }
    setRunLoading(false);
  }

  const byDay = scripts.reduce((acc, s) => {
    const d = `Day ${s.day_offset}`;
    if (!acc[d]) acc[d] = [];
    acc[d].push(s);
    return acc;
  }, {});

  const pillarsInDb = [...new Set(scripts.map(s => s.pillar))];
  const approved = scripts.filter(s => s.status === 'approved').length;
  const total = scripts.length;

  return (
    <div className="stack">
      {/* Header */}
      <div className="page-head">
        <h1 style={{ color: '#D4352C' }}>S3 — Savage Sales School</h1>
        <p>Tactics over theatre · {total} scripts · {approved} approved</p>
      </div>

      {/* Stats row */}
      <div className="grid">
        {PILLARS.map(p => {
          const count = scripts.filter(s => s.pillar === p).length;
          return (
            <div key={p} className="card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>{p}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: count > 0 ? '#D4352C' : 'var(--text-dim)' }}>{count}</div>
              <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>scripts</div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[['pipeline','Content Pipeline'],['agent','Agent'],['brand','Brand Assets']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '8px 16px',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
              textTransform: 'uppercase',
              color: tab === key ? '#D4352C' : 'var(--text-dim)',
              borderBottom: tab === key ? '2px solid #D4352C' : '2px solid transparent',
              marginBottom: -1,
            }}
          >{label}</button>
        ))}
      </div>

      {/* Content Pipeline */}
      {tab === 'pipeline' && (
        <div className="stack">
          {loading && <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>Loading scripts...</div>}
          {!loading && Object.entries(byDay).map(([day, dayScripts]) => (
            <div key={day}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>{day}</div>
              {dayScripts.map(s => (
                <div key={s.id} className="card" style={{ marginBottom: 8, borderLeft: `3px solid ${STATUS_COLOURS[s.status] || 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 9, letterSpacing: 2, color: '#D4352C', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{s.pillar}</span>
                        <span style={{ fontSize: 9, letterSpacing: 1, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Slot {s.slot} · {s.duration_target}s</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--text)' }}>{s.hook}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 6 }}>{s.body}</div>
                      <div style={{ fontSize: 11, color: 'var(--cyan)', fontStyle: 'italic' }}>{s.payoff}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                      <span className="badge" style={{ color: STATUS_COLOURS[s.status], borderColor: STATUS_COLOURS[s.status], whiteSpace: 'nowrap' }}>{s.status}</span>
                      {s.status === 'drafted' && (
                        <button className="btn" style={{ fontSize: 10, padding: '4px 10px', background: '#D4352C', border: 'none', color: '#fff' }}
                          onClick={() => updateStatus(s.id, 'approved')}>Approve</button>
                      )}
                      {s.status === 'approved' && (
                        <button className="btn" style={{ fontSize: 10, padding: '4px 10px' }}
                          onClick={() => updateStatus(s.id, 'produced')}>Mark Produced</button>
                      )}
                      {!['posted','rejected'].includes(s.status) && (
                        <button className="btn" style={{ fontSize: 10, padding: '4px 10px', color: '#ef4444', borderColor: '#ef4444' }}
                          onClick={() => updateStatus(s.id, 'rejected')}>Reject</button>
                      )}
                    </div>
                  </div>
                  {s.on_screen_text && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(212,53,44,0.06)', borderRadius: 4, fontSize: 11, color: 'var(--text-dim)' }}>
                      <span style={{ color: '#D4352C' }}>On-screen:</span> {s.on_screen_text} &nbsp;·&nbsp; <span style={{ color: '#D4352C' }}>B-roll:</span> {s.b_roll_brief}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          {!loading && scripts.length === 0 && (
            <div className="card" style={{ color: 'var(--text-dim)', fontSize: 13 }}>No scripts yet. Use the Agent tab to generate Week 2+.</div>
          )}
        </div>
      )}

      {/* Agent */}
      {tab === 'agent' && (
        <div className="stack">
          <div className="grid">
            {ACTIONS.map(a => (
              <div key={a.key} className="card">
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>{a.hint}</div>
                <button
                  className="btn"
                  disabled={runLoading}
                  onClick={() => runAgent(a.key, a.params)}
                  style={{ fontSize: 11, background: '#D4352C', border: 'none', color: '#fff', width: '100%' }}
                >
                  {runLoading ? 'Running...' : 'Run'}
                </button>
              </div>
            ))}
          </div>

          {agentOutput && (
            <div className="card" style={{ borderColor: agentOutput.error ? '#ef4444' : '#3dd68c' }}>
              <div style={{ fontSize: 12, color: agentOutput.error ? '#ef4444' : '#3dd68c' }}>
                {agentOutput.error || agentOutput.message}
              </div>
            </div>
          )}

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Recent Runs</div>
            {runs.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No runs yet.</div>}
            {runs.map(r => (
              <div key={r.id} className="card" style={{ marginBottom: 6, padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)' }}>{r.capability}</span>
                  <span className="badge" style={{
                    color: r.status === 'completed' ? '#3dd68c' : r.status === 'failed' ? '#ef4444' : '#f59e0b',
                    borderColor: 'currentColor', fontSize: 9,
                  }}>{r.status}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
                  {new Date(r.started_at).toLocaleString()}
                </div>
                {r.error && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>{r.error}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brand Assets */}
      {tab === 'brand' && (
        <div className="stack">
          <div className="card">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 12 }}>Brand Palette</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[['Iron Black','#0A0A0A'],['Bone','#F5F1E8'],['Blood Red','#D4352C'],['Brass','#C9A961'],['Gunmetal','#2A2A2A']].map(([name, hex]) => (
                <div key={hex} style={{ textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 6, background: hex, border: '1px solid var(--border)', marginBottom: 6 }} />
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{name}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{hex}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 12 }}>Value Ladder</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['Free','Lead magnet: 30 Objection Rebuttals PDF'],
                ['£47','BMF (Build My Flow) — script system course'],
                ['£197','S3 Academy — full training + templates'],
                ['£997','Done-With-You — 8-week live cohort'],
              ].map(([price, desc]) => (
                <div key={price} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#D4352C', fontWeight: 700, minWidth: 40 }}>{price}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 12 }}>Compliance</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                ['AI Disclosure','Required on every script and post'],
                ['Music','Epidemic Sound only — no RATM, AC/DC, Metallica, Rocky'],
                ['Profanity','Savage cut (TikTok/IG) vs Clean cut (YT/FB) — no profanity in hooks'],
                ['EU AI Act Art. 50','Mandatory from Aug 2 2026 — label from day 1'],
                ['Auto-post','Never. All scripts require human approval.'],
              ].map(([rule, desc]) => (
                <div key={rule} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#3dd68c', minWidth: 120, paddingTop: 1 }}>{rule}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 12 }}>Production Specs</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['Format','1080×1920, H.264, 30fps'],
                ['Loudness','-14 LUFS (YT) / -10 to -12 LUFS (TikTok/IG)'],
                ['Captions','Submagic · Anton font · Blood Red accent'],
                ['Watermark','S3 mark top-right · 40% opacity · 80×80px'],
                ['Target duration','62-70s (TikTok Creator Rewards)'],
                ['Adam (TikTok)','Register from UK SIM — Thai SIM blocked'],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                  <div style={{ fontSize: 9, color: '#D4352C', fontFamily: 'var(--font-mono)', letterSpacing: 1, marginBottom: 3 }}>{k}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
