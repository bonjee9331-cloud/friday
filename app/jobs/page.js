'use client';

import { useState } from 'react';

const defaultTitles = [
  'Sales Manager',
  'Sales Operations Manager',
  'Sales Team Leader',
  'Contact Center Manager',
  'Contact Centre Manager',
  'Remote Sales Manager',
  'Telesales Manager',
  'Outbound Sales Manager',
  'Inside Sales Manager'
].join('\n');

const defaultExcluded = [
  'finance',
  'investment',
  'real estate',
  'car sales',
  'automotive sales'
].join('\n');

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function JobsPage() {
  const [targetTitles, setTargetTitles] = useState(defaultTitles);
  const [preferredLocations, setPreferredLocations] = useState('Australia\nNew Zealand');
  const [location, setLocation] = useState('');
  const [minSalary, setMinSalary] = useState('70000');
  const [remoteOnly, setRemoteOnly] = useState(true);
  const [excludedKeywords, setExcludedKeywords] = useState(defaultExcluded);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [debug, setDebug] = useState(null);

  async function runSearch(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setJobs([]);
    setDebug(null);

    try {
      const response = await fetch('/api/jobs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetTitles: targetTitles.split('\n').map((x) => x.trim()).filter(Boolean),
          preferredLocations: preferredLocations.split('\n').map((x) => x.trim()).filter(Boolean),
          location,
          minSalary: Number(minSalary || 0),
          remoteOnly,
          excludedKeywords: excludedKeywords.split('\n').map((x) => x.trim()).filter(Boolean)
        })
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server returned non-JSON response');
      }

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setJobs(data.jobs || []);
      setDebug(data.debug || null);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="stack">
      <section className="hero">
        <h1>Multi-Source Job Search</h1>
        <p>Search across multiple sources, filter aggressively, and save matched jobs into your pipeline.</p>
      </section>

      <section className="card">
        <form onSubmit={runSearch} className="form-grid">
          <label>
            Target titles
            <textarea
              rows="8"
              value={targetTitles}
              onChange={(e) => setTargetTitles(e.target.value)}
            />
          </label>

          <label>
            Preferred locations
            <textarea
              rows="8"
              value={preferredLocations}
              onChange={(e) => setPreferredLocations(e.target.value)}
            />
          </label>

          <label>
            Specific location filter
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Leave blank for broader results"
            />
          </label>

          <label>
            Minimum salary
            <input
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="70000"
            />
          </label>

          <label>
            Excluded keywords
            <textarea
              rows="6"
              value={excludedKeywords}
              onChange={(e) => setExcludedKeywords(e.target.value)}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
            />
            Remote only
          </label>

          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" disabled={loading}>
              {loading ? 'Searching...' : 'Search live jobs'}
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <section className="card">
          <h2>Error</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {debug ? (
        <section className="card">
          <h2>Debug</h2>
          <p><strong>Enabled sources:</strong> {(debug.enabledSources || []).join(', ')}</p>
          <p><strong>Before dedupe:</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(debug.countsBeforeDedupe || {}, null, 2)}
          </pre>
          <p><strong>After filtering:</strong></p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(debug.countsAfterFiltering || {}, null, 2)}
          </pre>
        </section>
      ) : null}

      <section className="card">
        <h2>Results</h2>
        {!jobs.length ? (
          <p>No jobs loaded yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {jobs.map((job) => (
              <article
                key={`${job.source}-${job.external_id}`}
                style={{ border: '1px solid #ddd', borderRadius: '10px', padding: '14px' }}
              >
                <h3>{job.title}</h3>
                <p><strong>Company:</strong> {job.company}</p>
                <p><strong>Location:</strong> {job.location}</p>
                <p><strong>Source:</strong> {job.source}</p>
                <p><strong>Fit score:</strong> {job.fit_score}</p>
                <p><strong>Matched title:</strong> {job.matched_title || 'None'}</p>
                <p><strong>Salary:</strong> {job.salary_text || 'Not listed'}</p>
                <p><strong>Remote:</strong> {job.remote ? 'Yes' : 'No'}</p>
                <p style={{ whiteSpace: 'pre-wrap' }}>
                  {stripHtml(job.description).slice(0, 500)}
                  {stripHtml(job.description).length > 500 ? '...' : ''}
                </p>
                {job.apply_url ? (
                  <a href={job.apply_url} target="_blank" rel="noreferrer">
                    Open job
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
