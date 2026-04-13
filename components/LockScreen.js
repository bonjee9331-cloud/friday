'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

export default function LockScreen({ onUnlock }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const recRef    = useRef(null);
  const [status, setStatus]     = useState('SPEAK TO AUTHENTICATE');
  const [unlocking, setUnlocking] = useState(false);
  const [showText, setShowText]   = useState(false);
  const [textInput, setTextInput] = useState('');

  const doUnlock = useCallback(() => {
    setUnlocking(true);
    setStatus('PASSPHRASE ACCEPTED — INITIALISING');
    setTimeout(onUnlock, 2000);
  }, [onUnlock]);

  const checkPhrase = useCallback((txt) => {
    const t = txt.toLowerCase();
    if (t.includes("let's get biblical") || t.includes('lets get biblical')) {
      doUnlock();
    }
  }, [doUnlock]);

  // speech recognition — continuous loop
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (\!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-AU';
    rec.onstart  = () => setStatus('LISTENING');
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join(' ');
      checkPhrase(transcript);
    };
    rec.onend = () => { if (\!unlocking) { try { rec.start(); } catch(err){} } };
    try { rec.start(); } catch(err) {}
    recRef.current = rec;
    return () => { try { rec.stop(); } catch(err){} };
  }, [checkPhrase, unlocking]);

  // canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (\!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;
    let w = canvas.width  = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const particles = Array.from({length: 80}, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vy: -(0.3 + Math.random() * 0.5),
      size: 1 + Math.random() * 2,
      alpha: 0.1 + Math.random() * 0.4,
    }));

    const resize = () => {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    const draw = () => {
      t++;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;

      // pulsing rings
      for (let i = 0; i < 7; i++) {
        const r   = 80 + i * 70 + Math.sin(t * 0.018 + i) * 12;
        const alp = 0.06 + 0.04 * Math.sin(t * 0.025 + i);
        ctx.strokeStyle = 'rgba(0,180,255,' + alp + ')';
        ctx.lineWidth = 1;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // hex grid
      const HEX = 30;
      const cols = Math.ceil(w / (HEX * 1.5)) + 2;
      const rows = Math.ceil(h / (HEX * 1.732)) + 2;
      for (let col = -1; col < cols; col++) {
        for (let row = -1; row < rows; row++) {
          const px = col * HEX * 1.5;
          const py = row * HEX * 1.732 + (col % 2 ? HEX * 0.866 : 0);
          const dist = Math.hypot(px - cx, py - cy);
          const pulse = Math.sin(t * 0.012 - dist * 0.008) * 0.5 + 0.5;
          ctx.strokeStyle = 'rgba(0,100,255,' + (0.02 + pulse * 0.04) + ')';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const ang = k * Math.PI / 3;
            const hx = px + HEX * 0.85 * Math.cos(ang);
            const hy = py + HEX * 0.85 * Math.sin(ang);
            k === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }

      // particles
      particles.forEach(p => {
        p.y += p.vy;
        if (p.y < 0) { p.y = h; p.x = Math.random() * w; }
        ctx.fillStyle = 'rgba(0,200,255,' + p.alpha + ')';
        ctx.fillRect(p.x, p.y, p.size, p.size * 3);
      });

      // lock icon center-top
      const lockR = 42;
      const glow  = Math.sin(t * 0.04) * 0.3 + 0.7;
      ctx.shadowColor = '#00b4ff';
      ctx.shadowBlur  = 25 * glow;
      ctx.strokeStyle = 'rgba(0,180,255,' + glow + ')';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const ang = k * Math.PI / 3 - Math.PI / 6;
        const hx = cx + lockR * Math.cos(ang);
        const hy = cy - 90 + lockR * Math.sin(ang);
        k === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: unlocking ? 'rgba(0,20,40,0.98)' : '#000010',
      overflow: 'hidden',
      transition: 'background 1.5s ease',
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      <div style={{
        position: 'relative', zIndex: 10, height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'monospace', color: '#00b4ff',
      }}>

        <div style={{ fontSize: 10, letterSpacing: 8, color: 'rgba(0,180,255,0.45)', marginBottom: 10 }}>
          FRIDAY OS  v2.0
        </div>
        <div style={{
          fontSize: 56, fontWeight: 100, letterSpacing: 22,
          textShadow: '0 0 40px rgba(0,180,255,0.9)',
          marginBottom: 6,
        }}>FRIDAY</div>
        <div style={{ fontSize: 10, letterSpacing: 5, color: 'rgba(0,180,255,0.5)', marginBottom: 70 }}>
          PERSONAL AI SYSTEM — SECURE MODE
        </div>

        {/* lock SVG */}
        <div style={{ marginBottom: 36, opacity: unlocking ? 0 : 1, transition: 'opacity 1s' }}>
          <svg width='42' height='52' viewBox='0 0 42 52' fill='none'>
            <rect x='4' y='22' width='34' height='26' rx='3' stroke='#00b4ff' strokeWidth='1.5'/>
            <path d='M11 22V15a10 10 0 0 1 20 0v7' stroke='#00b4ff' strokeWidth='1.5' fill='none'/>
            <circle cx='21' cy='35' r='3' fill='#00b4ff'/>
            <line x1='21' y1='35' x2='21' y2='41' stroke='#00b4ff' strokeWidth='1.5'/>
          </svg>
        </div>

        <div style={{
          fontSize: 11, letterSpacing: 4,
          color: unlocking ? '#00ffaa' : '#00b4ff',
          marginBottom: 28,
          transition: 'color 0.5s',
        }}>
          {status}
        </div>

        {/* waveform bars */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 44, alignItems: 'center', height: 36 }}>
          {[1,1.8,1.2,2.5,1.5,2.2,1,1.8,2.4,1.3,2,1.6].map((h, i) => (
            <div key={i} style={{
              width: 3,
              background: 'linear-gradient(to top, #00b4ff, #00eaff)',
              borderRadius: 2, opacity: 0.7,
              animationName: 'wave',
              animationDuration: (0.4 + i * 0.07) + 's',
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationTimingFunction: 'ease-in-out',
              height: (h * 8) + 'px',
            }} />
          ))}
        </div>

        {\!showText && (
          <button onClick={() => setShowText(true)} style={{
            background: 'none',
            border: '1px solid rgba(0,180,255,0.25)',
            color: 'rgba(0,180,255,0.4)', fontSize: 9, letterSpacing: 3,
            padding: '7px 20px', cursor: 'pointer', borderRadius: 2,
            fontFamily: 'monospace',
          }}>
            TYPE PASSPHRASE
          </button>
        )}
        {showText && (
          <form onSubmit={e => { e.preventDefault(); checkPhrase(textInput); }}
            style={{ display: 'flex', gap: 8 }}>
            <input
              type='password'
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder='enter passphrase'
              autoFocus
              style={{
                background: 'rgba(0,180,255,0.04)',
                border: '1px solid rgba(0,180,255,0.35)',
                color: '#00b4ff', padding: '8px 16px',
                fontFamily: 'monospace', fontSize: 13, letterSpacing: 2,
                outline: 'none', borderRadius: 2, width: 280,
              }}
            />
            <button type='submit' style={{
              background: 'rgba(0,180,255,0.08)',
              border: '1px solid rgba(0,180,255,0.4)',
              color: '#00b4ff', padding: '8px 16px',
              fontFamily: 'monospace', fontSize: 10, letterSpacing: 3,
              cursor: 'pointer', borderRadius: 2,
            }}>ENTER</button>
          </form>
        )}
      </div>

      <style>{`
        @keyframes wave {
          from { transform: scaleY(1); }
          to   { transform: scaleY(3); }
        }
      `}</style>
    </div>
  );
}