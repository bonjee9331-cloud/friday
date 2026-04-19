'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

const ORANGE = '#ff6b35';
const DEFAULT_SPEED = 1.2;   // px per frame at 60fps
const LS_SCRIPT = 'friday_teleprompter_script';
const LS_FONT   = 'friday_teleprompter_fontsize';

export default function TeleprompterPage() {
  const [phase,    setPhase]    = useState('setup');   // 'setup' | 'running'
  const [script,   setScript]   = useState('');
  const [speed,    setSpeed]    = useState(DEFAULT_SPEED);
  const [paused,   setPaused]   = useState(false);
  const [fontSize, setFontSize] = useState(36);
  const [mirror,   setMirror]   = useState(false);
  const [bgOpacity, setBgOpacity] = useState(0.85);
  const [savedScripts, setSavedScripts] = useState([]);
  const [saveName, setSaveName] = useState('');

  const scrollRef   = useRef(null);
  const rafRef      = useRef(null);
  const posRef      = useRef(0);
  const speedRef    = useRef(speed);
  const pausedRef   = useRef(false);

  // Keep refs in sync
  useEffect(() => { speedRef.current  = speed;  }, [speed]);
  useEffect(() => { pausedRef.current = paused;  }, [paused]);

  // Load from localStorage
  useEffect(() => {
    const s  = localStorage.getItem(LS_SCRIPT);
    const fs = localStorage.getItem(LS_FONT);
    if (s)  setScript(s);
    if (fs) setFontSize(Number(fs));
    loadSavedScripts();
  }, []);

  useEffect(() => { localStorage.setItem(LS_SCRIPT, script); }, [script]);
  useEffect(() => { localStorage.setItem(LS_FONT, String(fontSize)); }, [fontSize]);

  async function loadSavedScripts() {
    try {
      const res  = await fetch('/api/teleprompter');
      const data = await res.json();
      setSavedScripts(data.scripts || []);
    } catch { /* ignore */ }
  }

  async function saveScript() {
    if (!saveName.trim() || !script.trim()) return;
    await fetch('/api/teleprompter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: saveName.trim(), content: script }),
    });
    setSaveName('');
    loadSavedScripts();
  }

  // Animation loop
  const animate = useCallback(() => {
    if (!scrollRef.current) return;
    if (!pausedRef.current) {
      posRef.current += speedRef.current;
      scrollRef.current.style.transform = `translateY(-${posRef.current}px)`;

      // Stop at bottom (extra 200px padding)
      const maxScroll = scrollRef.current.scrollHeight - window.innerHeight + 200;
      if (posRef.current >= maxScroll) {
        posRef.current = maxScroll;
      }
    }
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (phase === 'running') {
      posRef.current = 0;
      if (scrollRef.current) scrollRef.current.style.transform = 'translateY(0px)';
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, animate]);

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'running') return;
    const handler = (e) => {
      if (e.code === 'Space')      { e.preventDefault(); setPaused(p => !p); }
      if (e.code === 'ArrowUp')    { e.preventDefault(); setSpeed(s => Math.min(s + 0.3, 6)); }
      if (e.code === 'ArrowDown')  { e.preventDefault(); setSpeed(s => Math.max(s - 0.3, 0.1)); }
      if (e.code === 'KeyR')       { restart(); }
      if (e.code === 'Escape')     { setPhase('setup'); setPaused(false); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase]);

  function restart() {
    posRef.current = 0;
    if (scrollRef.current) scrollRef.current.style.transform = 'translateY(0px)';
    setPaused(false);
  }

  function start() {
    if (!script.trim()) return;
    setPaused(false);
    setPhase('running');
  }

  // ── SETUP SCREEN ─────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#010509',
        color: '#fff',
        fontFamily: 'var(--font-hud)',
        padding: '32px 24px',
        overflowY: 'auto',
      }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 10, letterSpacing: 5, color: `${ORANGE}80`, marginBottom: 4 }}>
              FRIDAY · BROADCAST TOOLS
            </div>
            <div style={{ fontSize: 24, color: ORANGE, textShadow: `0 0 24px ${ORANGE}60` }}>
              TELEPROMPTER
            </div>
          </div>

          {/* Saved scripts */}
          {savedScripts.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 8, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
                SAVED SCRIPTS
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {savedScripts.map(s => (
                  <button
                    key={s.name}
                    onClick={() => setScript(s.content)}
                    style={{
                      padding: '5px 12px',
                      fontFamily: 'var(--font-hud)',
                      fontSize: 8,
                      letterSpacing: 2,
                      background: `${ORANGE}15`,
                      border: `1px solid ${ORANGE}50`,
                      borderRadius: 2,
                      color: ORANGE,
                      cursor: 'pointer',
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Script textarea */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 8, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
              SCRIPT
            </div>
            <textarea
              rows={14}
              value={script}
              onChange={e => setScript(e.target.value)}
              placeholder="Paste or type your script here..."
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'rgba(4,14,24,0.95)',
                border: `1px solid ${ORANGE}30`,
                borderRadius: 3,
                color: 'rgba(255,255,255,0.85)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 14,
                lineHeight: 1.7,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Save script row */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center' }}>
            <input
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveScript()}
              placeholder="Script name..."
              style={{
                padding: '6px 10px',
                background: 'rgba(4,14,24,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
                color: 'rgba(255,255,255,0.75)',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                width: 200,
                outline: 'none',
              }}
            />
            <button onClick={saveScript} style={ghostBtn}>SAVE SCRIPT</button>
            <div style={{ marginLeft: 'auto', fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
              {script.split(/\s+/).filter(Boolean).length} words
            </div>
          </div>

          {/* Settings grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>

            <SettingCard label="FONT SIZE">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setFontSize(s => Math.max(s - 4, 18))} style={ctrlBtn}>−</button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: ORANGE, width: 40, textAlign: 'center' }}>{fontSize}</span>
                <button onClick={() => setFontSize(s => Math.min(s + 4, 80))} style={ctrlBtn}>+</button>
              </div>
            </SettingCard>

            <SettingCard label="SCROLL SPEED">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setSpeed(s => Math.max(s - 0.3, 0.1))} style={ctrlBtn}>−</button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: ORANGE, width: 40, textAlign: 'center' }}>{speed.toFixed(1)}</span>
                <button onClick={() => setSpeed(s => Math.min(s + 0.3, 6))} style={ctrlBtn}>+</button>
              </div>
            </SettingCard>

            <SettingCard label="BACKGROUND OPACITY">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={bgOpacity}
                  onChange={e => setBgOpacity(Number(e.target.value))}
                  style={{ flex: 1, accentColor: ORANGE }}
                />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: ORANGE, width: 40 }}>
                  {Math.round(bgOpacity * 100)}%
                </span>
              </div>
            </SettingCard>

            <SettingCard label="MIRROR MODE">
              <button
                onClick={() => setMirror(m => !m)}
                style={{
                  padding: '6px 16px',
                  fontFamily: 'var(--font-hud)',
                  fontSize: 8, letterSpacing: 2,
                  background: mirror ? `${ORANGE}20` : 'transparent',
                  border: `1px solid ${mirror ? ORANGE : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 2,
                  color: mirror ? ORANGE : 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                }}
              >
                {mirror ? 'ON — MIRRORED' : 'OFF'}
              </button>
            </SettingCard>
          </div>

          {/* Keyboard hints */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
            {[
              ['SPACE', 'Pause / Resume'],
              ['↑ ↓', 'Speed'],
              ['R', 'Restart'],
              ['ESC', 'Back to setup'],
            ].map(([key, label]) => (
              <div key={key} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <kbd style={{
                  padding: '3px 8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 3,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: ORANGE,
                }}>{key}</kbd>
                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: 1 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Launch button */}
          <button
            onClick={start}
            disabled={!script.trim()}
            style={{
              padding: '14px 48px',
              fontFamily: 'var(--font-hud)',
              fontSize: 11, letterSpacing: 4,
              background: script.trim() ? `${ORANGE}20` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${script.trim() ? ORANGE : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 3,
              color: script.trim() ? ORANGE : 'rgba(255,255,255,0.2)',
              cursor: script.trim() ? 'pointer' : 'not-allowed',
              textShadow: script.trim() ? `0 0 14px ${ORANGE}60` : 'none',
              transition: 'all 0.15s',
            }}
          >
            ▶ START TELEPROMPTER
          </button>
        </div>
      </div>
    );
  }

  // ── RUNNING SCREEN ─────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: `rgba(1,5,9,${bgOpacity})`,
      overflow: 'hidden',
      cursor: 'none',
    }}>

      {/* Scrolling text */}
      <div style={{
        position: 'absolute',
        top: '60vh',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 820,
        padding: '0 40px',
        boxSizing: 'border-box',
      }}>
        <div
          ref={scrollRef}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: fontSize,
            lineHeight: 1.75,
            color: '#ffffff',
            textAlign: 'center',
            textShadow: '0 2px 20px rgba(0,0,0,0.9)',
            transform: mirror ? 'scaleX(-1)' : undefined,
            paddingBottom: '100vh',
            willChange: 'transform',
          }}
        >
          {script}
        </div>
      </div>

      {/* Center reading line */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 820,
        maxWidth: '100%',
        height: 2,
        background: `linear-gradient(90deg, transparent, ${ORANGE}40, transparent)`,
        pointerEvents: 'none',
      }} />

      {/* Floating control bar */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        background: 'rgba(1,5,9,0.92)',
        border: `1px solid ${ORANGE}40`,
        borderRadius: 40,
        backdropFilter: 'blur(12px)',
        zIndex: 10000,
        cursor: 'default',
      }}>
        <CtrlButton onClick={() => setPaused(p => !p)} active={!paused}>
          {paused ? '▶' : '⏸'}
        </CtrlButton>
        <CtrlButton onClick={restart}>⟳</CtrlButton>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
        <CtrlButton onClick={() => setSpeed(s => Math.max(s - 0.3, 0.1))}>−</CtrlButton>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: ORANGE, width: 28, textAlign: 'center' }}>
          {speed.toFixed(1)}
        </span>
        <CtrlButton onClick={() => setSpeed(s => Math.min(s + 0.3, 6))}>+</CtrlButton>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
        <CtrlButton onClick={() => setFontSize(s => Math.max(s - 4, 18))}>A−</CtrlButton>
        <CtrlButton onClick={() => setFontSize(s => Math.min(s + 4, 80))}>A+</CtrlButton>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
        <CtrlButton onClick={() => setMirror(m => !m)} active={mirror}>↔</CtrlButton>
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />
        <CtrlButton onClick={() => { setPhase('setup'); setPaused(false); }}>✕</CtrlButton>
      </div>

      {/* Pause overlay */}
      {paused && (
        <div style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-hud)',
          fontSize: 9,
          letterSpacing: 4,
          color: ORANGE,
          background: `${ORANGE}15`,
          border: `1px solid ${ORANGE}50`,
          borderRadius: 20,
          padding: '5px 16px',
          animation: 'pulse-dot 1.5s ease-in-out infinite',
        }}>
          PAUSED — SPACE TO RESUME
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>
    </div>
  );
}

function SettingCard({ label, children }) {
  return (
    <div style={{
      background: 'rgba(4,14,24,0.95)',
      border: '1px solid rgba(255,107,53,0.2)',
      borderRadius: 3,
      padding: '14px 16px',
    }}>
      <div style={{ fontFamily: 'var(--font-hud)', fontSize: 7, letterSpacing: 3, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function CtrlButton({ onClick, children, active }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 32, height: 32,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? `${ORANGE}25` : 'transparent',
        border: `1px solid ${active ? ORANGE : 'rgba(255,255,255,0.15)'}`,
        borderRadius: '50%',
        color: active ? ORANGE : 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
        transition: 'all 0.12s',
      }}
    >
      {children}
    </button>
  );
}

const ghostBtn = {
  padding: '6px 14px',
  fontFamily: 'var(--font-hud)',
  fontSize: 8, letterSpacing: 2,
  background: `${ORANGE}12`,
  border: `1px solid ${ORANGE}40`,
  borderRadius: 2,
  color: ORANGE,
  cursor: 'pointer',
};

const ctrlBtn = {
  width: 32, height: 32,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: `${ORANGE}12`,
  border: `1px solid ${ORANGE}40`,
  borderRadius: 2,
  color: ORANGE,
  cursor: 'pointer',
  fontSize: 16,
  fontFamily: 'var(--font-mono)',
};
