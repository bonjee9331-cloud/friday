'use client';

import { useState, useEffect, useCallback } from 'react';
import { authedFetch } from '../lib/client-auth';

const PRIORITY_META = {
  urgent: { colour: '#ff4444', label: 'URGENT' },
  high:   { colour: '#f59e0b', label: 'HIGH'   },
  normal: { colour: '#60a5fa', label: 'NORMAL' },
  low:    { colour: 'rgba(255,255,255,0.3)', label: 'LOW' },
};

const STATUS_META = {
  new:         { colour: '#60a5fa', label: 'QUEUED'  },
  in_progress: { colour: '#f59e0b', label: 'RUNNING' },
  blocked:     { colour: '#ff4444', label: 'BLOCKED' },
  done:        { colour: '#3dd68c', label: 'DONE'    },
  cancelled:   { colour: 'rgba(255,255,255,0.25)', label: 'VOID' },
};

const C = '#60a5fa'; // tasks tab colour

export default function TasksView() {
  const [tasks,       setTasks]       = useState([]);
  const [filter,      setFilter]      = useState('all');
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [priority,    setPriority]    = useState('normal');
  const [busy,        setBusy]        = useState(false);
  const [running,     setRunning]     = useState(null);
  const [error,       setError]       = useState('');
  const [mock,        setMock]        = useState(false);

  const load = useCallback(async () => {
    const url = filter === 'all' ? '/api/friday/tasks' : `/api/friday/tasks?status=${filter}`;
    try {
      const res  = await authedFetch(url);
      const data = await res.json();
      setTasks(data.tasks || []);
      setMock(!!data.mock);
    } catch { /* silently ignore */ }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function createTask(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError('');
    try {
      const res = await authedFetch('/api/friday/tasks', {
        method: 'POST',
        body: JSON.stringify({ title, description, priority }),
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

  async function patch(id, fields) {
    await authedFetch('/api/friday/tasks', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...fields }),
    });
    await load();
  }

  async function runTask(task) {
    setRunning(task.id);
    await patch(task.id, { status: 'in_progress' });
    try {
      const res  = await authedFetch('/api/friday/agent', {
        method: 'POST',
        body: JSON.stringify({
          agentKey: 'doug',
          message: `Execute this task: ${task.title}. Details: ${task.description || 'none'}. Report back concisely with what was done.`,
        }),
      });
      const data = await res.json();
      await patch(task.id, { status: 'done', result: data.reply });
    } catch (err) {
      await patch(task.id, { status: 'blocked', result: err.message });
    } finally {
      setRunning(null);
    }
  }

  const counts = {
    all:         tasks.length,
    new:         tasks.filter(t => t.status === 'new').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    blocked:     tasks.filter(t => t.status === 'blocked').length,
    done:        tasks.filter(t => t.status === 'done').length,
  };

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
            DOUG · TASK RUNNER
          </div>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: 18, color: C, textShadow: `0 0 20px ${C}60` }}>
            TASK QUEUE
          </div>
        </div>
        {mock && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#f59e0b', letterSpacing: 2 }}>
            ⚠ MOCK MODE — SUPABASE OFFLINE
          </div>
        )}
      </div>

      {/* Filter strip */}
      <div style={{ padding: '12px 20px 0', display: 'flex', gap: 6, flexShrink: 0 }}>
        {['all', 'new', 'in_progress', 'blocked', 'done'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 12px',
              fontFamily: 'var(--font-hud)',
              fontSize: 8,
              letterSpacing: 2,
              background: filter === f ? `${C}18` : 'transparent',
              border: `1px solid ${filter === f ? C : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 2,
              color: filter === f ? C : 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {f.replace('_', ' ').toUpperCase()}
            <span style={{ marginLeft: 5, opacity: 0.6 }}>{counts[f] ?? ''}</span>
          </button>
        ))}
      </div>

      {/* Main area — split layout */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', gap: 16, padding: '12px 20px 16px' }}>

        {/* Left — task list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {error && (
            <div style={{
              padding: '8px 12px',
              border: '1px solid #ff444460',
              background: '#ff444410',
              borderRadius: 3,
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              color: '#ff4444',
            }}>{error}</div>
          )}

          {tasks.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 180,
              border: `1px dashed ${C}25`,
              borderRadius: 4,
              gap: 8,
            }}>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: 9, letterSpacing: 3, color: `${C}40` }}>
                QUEUE EMPTY
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>
                Add a task or tell DOUG via voice
              </div>
            </div>
          ) : tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              running={running === task.id}
              onRun={() => runTask(task)}
              onDone={() => patch(task.id, { status: 'done' })}
              onCancel={() => patch(task.id, { status: 'cancelled' })}
            />
          ))}
        </div>

        {/* Right — new task panel */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <form onSubmit={createTask} style={{
            background: 'rgba(4,14,24,0.95)',
            border: `1px solid ${C}30`,
            borderRadius: 4,
            padding: '16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Corner accents */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: 10, height: 10, borderTop: `1px solid ${C}`, borderLeft: `1px solid ${C}` }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderBottom: `1px solid ${C}`, borderRight: `1px solid ${C}` }} />

            <div style={{ fontFamily: 'var(--font-hud)', fontSize: 9, letterSpacing: 3, color: C, marginBottom: 14 }}>
              + NEW TASK
            </div>

            <input
              type="text"
              placeholder="Task title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={inputStyle}
            />

            <textarea
              rows={4}
              placeholder="Details (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', marginTop: 8, minHeight: 70 }}
            />

            <div style={{ marginTop: 8 }}>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: 7, letterSpacing: 2, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>
                PRIORITY
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['low', 'normal', 'high', 'urgent'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontFamily: 'var(--font-hud)',
                      fontSize: 7,
                      letterSpacing: 1,
                      background: priority === p ? `${PRIORITY_META[p].colour}20` : 'transparent',
                      border: `1px solid ${priority === p ? PRIORITY_META[p].colour : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 2,
                      color: priority === p ? PRIORITY_META[p].colour : 'rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                    }}
                  >
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !title.trim()}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '9px 0',
                fontFamily: 'var(--font-hud)',
                fontSize: 9,
                letterSpacing: 3,
                background: busy || !title.trim() ? 'rgba(255,255,255,0.05)' : `${C}20`,
                border: `1px solid ${busy || !title.trim() ? 'rgba(255,255,255,0.1)' : C}`,
                borderRadius: 2,
                color: busy || !title.trim() ? 'rgba(255,255,255,0.25)' : C,
                cursor: busy || !title.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {busy ? 'CREATING...' : 'QUEUE TASK'}
            </button>
          </form>

          {/* Quick stats */}
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { label: 'QUEUED',  val: counts.new,         col: '#60a5fa' },
              { label: 'RUNNING', val: counts.in_progress, col: '#f59e0b' },
              { label: 'BLOCKED', val: counts.blocked,     col: '#ff4444' },
              { label: 'DONE',    val: counts.done,        col: '#3dd68c' },
            ].map(({ label, val, col }) => (
              <div key={label} style={{
                background: 'rgba(4,14,24,0.9)',
                border: `1px solid ${col}20`,
                borderRadius: 3,
                padding: '8px 10px',
              }}>
                <div style={{ fontFamily: 'var(--font-hud)', fontSize: 18, color: col, lineHeight: 1 }}>{val}</div>
                <div style={{ fontFamily: 'var(--font-hud)', fontSize: 7, letterSpacing: 2, color: `${col}60`, marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCard({ task, running, onRun, onDone, onCancel }) {
  const [expanded, setExpanded] = useState(false);
  const sm = STATUS_META[task.status]   || STATUS_META.new;
  const pm = PRIORITY_META[task.priority] || PRIORITY_META.normal;

  return (
    <div
      onClick={() => setExpanded(x => !x)}
      style={{
        background: 'rgba(4,14,24,0.9)',
        border: `1px solid ${sm.colour}25`,
        borderLeft: `3px solid ${sm.colour}`,
        borderRadius: 3,
        padding: '10px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.2s',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'var(--font-hud)',
            fontSize: 10,
            color: 'rgba(255,255,255,0.85)',
            letterSpacing: 0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {running && <span style={{ color: '#f59e0b', marginRight: 6, animation: 'pulse-dot 0.8s ease-in-out infinite' }}>◉</span>}
            {task.title}
          </div>
          {task.description && !expanded && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {task.description}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-hud)', fontSize: 7, letterSpacing: 2, color: pm.colour, border: `1px solid ${pm.colour}50`, padding: '2px 6px', borderRadius: 2 }}>
            {pm.label}
          </span>
          <span style={{ fontFamily: 'var(--font-hud)', fontSize: 7, letterSpacing: 2, color: sm.colour, border: `1px solid ${sm.colour}50`, padding: '2px 6px', borderRadius: 2 }}>
            {sm.label}
          </span>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 10 }} onClick={e => e.stopPropagation()}>
          {task.description && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 8 }}>
              {task.description}
            </div>
          )}
          {task.result && (
            <div style={{
              padding: '8px 10px',
              background: 'rgba(96,165,250,0.07)',
              border: '1px solid rgba(96,165,250,0.2)',
              borderRadius: 3,
              fontFamily: 'var(--font-mono)',
              fontSize: 8,
              color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.6,
              marginBottom: 8,
            }}>
              <div style={{ color: '#60a5fa', marginBottom: 4, letterSpacing: 2 }}>DOUG REPORT ·</div>
              {task.result}
            </div>
          )}
          <div style={{ display: 'flex', gap: 6 }}>
            {task.status === 'new' && (
              <ActionBtn onClick={onRun} col="#f59e0b" disabled={running}>
                {running ? 'RUNNING...' : '▶ RUN'}
              </ActionBtn>
            )}
            {task.status !== 'done' && task.status !== 'cancelled' && (
              <ActionBtn onClick={onDone} col="#3dd68c">✓ DONE</ActionBtn>
            )}
            {task.status !== 'cancelled' && task.status !== 'done' && (
              <ActionBtn onClick={onCancel} col="rgba(255,255,255,0.3)">✕ VOID</ActionBtn>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ children, onClick, col, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '5px 12px',
        fontFamily: 'var(--font-hud)',
        fontSize: 8,
        letterSpacing: 2,
        background: `${col}15`,
        border: `1px solid ${col}50`,
        borderRadius: 2,
        color: col,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(96,165,250,0.2)',
  borderRadius: 2,
  color: 'rgba(255,255,255,0.8)',
  outline: 'none',
  boxSizing: 'border-box',
};
