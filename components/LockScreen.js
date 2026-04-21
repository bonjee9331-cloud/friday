'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export default function LockScreen({ onUnlock }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const recRef    = useRef(null);

  const [status,    setStatus]    = useState('AUTHENTICATION REQUIRED');
  const [unlocking, setUnlocking] = useState(false);
  const [armed,     setArmed]     = useState(false);
  const [heard,     setHeard]     = useState('');
  const [input,     setInput]     = useState('');

  const doUnlock = useCallback(async () => {
    if (unlocking) return;
    setUnlocking(true);
    setStatus('IDENTITY CONFIRMED — INITIALISING');

    if (recRef.current) {
      try { recRef.current.onend = null; recRef.current.stop(); } catch {}
    }

    // ElevenLabs confirmation
    try {
      const res = await fetch('/api/friday/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Identity confirmed. Welcome back, Ben.' }),
      });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const AC  = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          const ac  = new AC();
          const src = ac.createBufferSource();
          src.buffer = await ac.decodeAudioData(buf.slice(0));
          src.connect(ac.destination);
          src.start(0);
          src.onended = () => { ac.close().catch(() => {}); onUnlock(); };
          return;
        }
      }
    } catch {}

    setTimeout(onUnlock, 1800);
  }, [onUnlock, unlocking]);

  const checkPhrase = useCallback(async (txt) => {
    if (typeof txt !== 'string' || unlocking) return;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passphrase: txt }),
      });
      if (res.ok) {
        doUnlock();
      } else {
        setStatus('ACCESS DENIED — TRY AGAIN');
        setTimeout(() => setStatus(armed ? 'LISTENING — SPEAK PASSPHRASE' : 'AUTHENTICATION REQUIRED'), 2000);
      }
    } catch {
      // Fallback: allow if server unreachable (dev mode)
      const t = txt.toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (t.includes('biblical')) doUnlock();
    }
  }, [doUnlock, unlocking, armed]);

  const armMic = useCallback(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus('VOICE UNAVAILABLE — TYPE BELOW'); return; }

    if (recRef.current) {
      try { recRef.current.onend = null; recRef.current.stop(); } catch {}
      recRef.current = null;
    }

    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = 'en-AU';
    rec.onstart  = () => { setArmed(true); setStatus('LISTENING — SPEAK PASSPHRASE'); };
    rec.onerror  = () => { setArmed(false); setStatus('MIC BLOCKED — ALLOW ACCESS OR TYPE BELOW'); };
    rec.onresult = (e) => {
      const t = Array.from(e.results || [])
        .map(r => r?.[0]?.transcript || '').join(' ').trim();
      setHeard(t.slice(-80));
      checkPhrase(t);
    };
    rec.onend = () => {
      if (!unlocking) { try { rec.start(); } catch { setArmed(false); setStatus('MIC STOPPED — CLICK AGAIN'); } }
    };
    recRef.current = rec;
    try { rec.start(); } catch { setArmed(false); setStatus('MIC ERROR — TYPE BELOW'); }
  }, [checkPhrase, unlocking]);

  // Canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;
    let w = canvas.width  = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vy: -(0.15 + Math.random() * 0.35),
      size: 1 + Math.random() * 1.5,
      alpha: 0.08 + Math.random() * 0.22,
    }));

    const draw = () => {
      t++;
      ctx.fillStyle = 'rgba(2,10,14,0.15)';
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2, cy = h / 2;

      // Hex grid
      const HEX = 32, gc = Math.ceil(w / (HEX * 1.5)) + 2, gr = Math.ceil(h / (HEX * 1.732)) + 2;
      for (let col = -1; col < gc; col++) {
        for (let row = -1; row < gr; row++) {
          const px = col * HEX * 1.5;
          const py = row * HEX * 1.732 + (col % 2 ? HEX * 0.866 : 0);
          const dist = Math.hypot(px - cx, py - cy);
          const pulse = Math.sin(t * 0.012 - dist * 0.007) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(0,212,255,${0.018 + pulse * 0.03})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const ang = (k * Math.PI) / 3;
            const hx = px + HEX * 0.84 * Math.cos(ang);
            const hy = py + HEX * 0.84 * Math.sin(ang);
            k === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
          }
          ctx.closePath(); ctx.stroke();
        }
      }

      // Concentric rings
      for (let i = 0; i < 6; i++) {
        const r = 100 + i * 80 + Math.sin(t * 0.016 + i) * 8;
        const alp = 0.04 + 0.025 * Math.sin(t * 0.022 + i);
        ctx.strokeStyle = `rgba(0,212,255,${alp})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 14]); ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.setLineDash([]);

      // Particles
      particles.forEach(p => {
        p.y += p.vy;
        if (p.y < 0) { p.y = h; p.x = Math.random() * w; }
        ctx.fillStyle = `rgba(0,212,255,${p.alpha})`;
        ctx.fillRect(p.x, p.y, p.size, p.size * 3);
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => () => {
    try { recRef.current?.stop(); } catch {}
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: unlocking ? '#001428' : '#020a0e',
      overflow: 'hidden', transition: 'background 1.5s',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.012) 2px, rgba(0,212,255,0.012) 4px)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 10,
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 22,
        fontFamily: 'var(--font-mono)', color: '#00d4ff',
      }}>

        {/* Version tag */}
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: 8, letterSpacing: 6, color: 'rgba(0,212,255,0.28)' }}>
          FRIDAY OS · v8.0
        </div>

        {/* Arc reactor instead of padlock */}
        <div className="arc-reactor" style={{ opacity: unlocking ? 0.5 : 1, transition: 'opacity 1s' }}>
          <div className="arc-ring ring-1" />
          <div className="arc-ring ring-2" />
          <div className="arc-ring ring-3" />
          <div className="arc-ring ring-4" />
          <div className="arc-glow" />
          <div className="arc-core" />
        </div>

        {/* Title */}
        <div style={{
          fontFamily: 'var(--font-hud)', fontSize: 46, fontWeight: 900,
          letterSpacing: 18, color: '#00d4ff',
          textShadow: '0 0 40px rgba(0,212,255,0.8)',
          lineHeight: 1, marginBottom: -8,
        }}>FRIDAY</div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 5, color: 'rgba(0,212,255,0.4)' }}>
          SECURE MODE — AUTHENTICATION REQUIRED
        </div>

        {/* Status */}
        <div style={{
          fontFamily: 'var(--font-hud)', fontSize: 10, letterSpacing: 3,
          color: unlocking ? '#3dd68c' : armed ? '#00eaff' : 'rgba(0,212,255,0.7)',
          transition: 'color 0.4s', textAlign: 'center', maxWidth: 320,
        }}>
          {status}
        </div>

        {/* Heard transcript */}
        {heard && !unlocking && (
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'rgba(0,212,255,0.4)', maxWidth: 300,
            textAlign: 'center', letterSpacing: 1,
          }}>
            HEARD: "{heard.slice(-60)}"
          </div>
        )}

        {/* Voice bars */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 24 }}>
          {[1, 1.8, 1.2, 2.5, 1.5, 2.2, 1, 1.8, 2.4, 1.3, 2, 1.6].map((v, i) => (
            <div key={i} style={{
              width: 2, borderRadius: 1, opacity: 0.65,
              background: armed ? 'linear-gradient(to top,#00ffaa,#00eaff)' : 'linear-gradient(to top,#005f77,#00a8cc)',
              animationName: armed ? 'wave' : 'none',
              animationDuration: `${0.4 + i * 0.07}s`,
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationTimingFunction: 'ease-in-out',
              height: `${v * 7}px`,
            }} />
          ))}
        </div>

        {/* ARM MICROPHONE button */}
        {!armed && !unlocking && (
          <button
            onClick={armMic}
            style={{
              background: 'rgba(0,212,255,0.07)',
              border: '1px solid rgba(0,212,255,0.35)',
              color: '#00d4ff',
              fontFamily: 'var(--font-hud)',
              fontSize: 9, letterSpacing: 4,
              padding: '10px 28px',
              cursor: 'pointer', borderRadius: 3,
              boxShadow: '0 0 18px rgba(0,212,255,0.12)',
              transition: 'all 0.18s',
            }}
          >
            ARM MICROPHONE
          </button>
        )}

        {/* Text input */}
        {!unlocking && (
          <form
            onSubmit={(e) => { e.preventDefault(); checkPhrase(input); setInput(''); }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 3, color: 'rgba(0,212,255,0.3)' }}>
              OR TYPE PASSPHRASE
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="password"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="enter passphrase..."
                style={{
                  background: 'rgba(0,212,255,0.04)',
                  border: '1px solid rgba(0,212,255,0.22)',
                  color: '#00d4ff',
                  padding: '8px 12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12, letterSpacing: 1,
                  outline: 'none', borderRadius: 2,
                  width: 220, transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,212,255,0.55)'; }}
                onBlur={e  => { e.target.style.borderColor = 'rgba(0,212,255,0.22)'; }}
              />
              <button type="submit" style={{
                background: 'rgba(0,212,255,0.07)',
                border: '1px solid rgba(0,212,255,0.3)',
                color: 'rgba(0,212,255,0.7)',
                fontFamily: 'var(--font-hud)',
                fontSize: 8, letterSpacing: 3,
                padding: '8px 14px',
                cursor: 'pointer', borderRadius: 2,
              }}>ENTER</button>
            </div>
          </form>
        )}
      </div>

      <style>{`@keyframes wave { from{transform:scaleY(1)} to{transform:scaleY(3)} }`}</style>
    </div>
  );
}
