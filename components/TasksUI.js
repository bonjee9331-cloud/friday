'use client';

import { useState, useEffect } from 'react';

const STATUS_COLORS = {
  new: 'var(--text-dim)',
  in_progress: 'var(--accent)',
  blocked: 'var(--amber)',
  done: 'var(--green)',
  cancelled: 'var(--red)'
};

export default function TasksUI() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  async function load() {
    try {
      const url = filter === 'all' ? '/api/friday/tasks' : `/api/friday/tasks?status=${filter}`;
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data.tasks || []);
      if (data.mock) setError('Supabase not configured. Tasks are running in mock mode.');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [filter]);

  async function createTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/friday/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, priority })
      });
      if (!res.ok) throw new Error((await res.json()).error || 'create failed');
      setTitle('');
      setDescription('');
      setPriority('normal');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await fetch('/api/friday/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function runTask(task) {
    await updateStatus(task.id, 'in_progress');
    try {
      const res = await fetch('/api/friday/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          module: 'tasks',
          message: `Do this task... ${task.title}. Details: ${task.description || '(none)'}. Report back with what you did.`
        })
      });
      const data = await res.json();
      await fetch('/api/friday/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, status: 'done', result: data.reply })
      });
      await load();
    } catch (err) {
      setError(err.message);
      await updateStatus(task.id, 'blocked');
    }
  }

  return (
    <div className="stack">
      <div className="page-head">
        <h1>Tasks</h1>
        <p>Assign anything. Friday will break it down and work through it.</p>
      </div>

      {error && <div className="card" style={{ borderColor: 'var(--amber)' }}>{error}</div>}

      <form className="card" onSubmit={createTask}>
        <h2>New task</h2>
        <div className="stack" style={{ gap: 12, marginTop: 12 }}>
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            rows={3}
            placeholder="Details (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="small">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{ padding: '8px 10px', background: 'var(--panel)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8 }}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <button type="submit" className="btn" disabled={busy || !title.trim()}>
              {busy ? 'Creating...' : 'Add task'}
            </button>
          </div>
        </div>
      </form>

      <div style={{ display: 'flex', gap: 6 }}>
        {['all', 'new', 'in_progress', 'blocked', 'done'].map((f) => (
          <button
            key={f}
            className={'pill ' + (filter === f ? 'active' : '')}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="stack" style={{ gap: 10 }}>
        {tasks.length === 0 && <div className="card"><p>No tasks yet. Add one above or say "Hey Friday, add a task to..."</p></div>}
        {tasks.map((t) => (
          <div key={t.id} className="task-item">
            <div>
              <div className="title">{t.title}</div>
              {t.description && <div className="desc">{t.description}</div>}
              {t.result && <div className="desc" style={{ marginTop: 6, color: 'var(--text)' }}>Result: {t.result}</div>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge" style={{ color: STATUS_COLORS[t.status], borderColor: 'currentColor' }}>
                {t.status}
              </span>
              {t.status === 'new' && (
                <button className="btn" onClick={() => runTask(t)}>Run</button>
              )}
              {t.status !== 'done' && t.status !== 'cancelled' && (
                <button className="pill" onClick={() => updateStatus(t.id, 'done')}>Done</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
