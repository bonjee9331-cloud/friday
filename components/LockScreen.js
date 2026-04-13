'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

export default function LockScreen({ onUnlock }) {
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const recRef     = useRef(null);
  const [status, setStatus]       = useState('CLICK ARM MICROPHONE TO BEGIN');
  const [unlocking, setUnlocking] = useState(false);
  const [armed, setArmed]         = useState(false);
  const [heard, setHeard]         = useState('');
  const [textInput, setTextInput] = useState('');

  const doUnlock = useCallback(() => {
    if (unlocking) return;
    setUnlocking(true);
    setStatus('PASSPHRASE ACCEPTED — INITIALISING');
    if (recRef.current) { try { recRef.current.abort(); } catch(e){} }
    setTimeout(onUnlock, 1800);
  }, [onUnlock, unlocking]);

  const checkPhrase = useCallback((txt) => {
    const t = txt.toLowerCase().replace(/[^a-z\s]/g, ' ');
    if (
      t.includes('biblical') ||
      t.includes('lets get') ||
      t.includes("let's get")
    ) { doUnlock(); }
  }, [doUnlock]);

  const armMic = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setStatus('MIC NOT SUPPORTED — TYPE PASSPHRASE BELOW'); return; }
    const rec = new SR();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.lang           = 'en-AU';
    rec.onstart  = () => { setArmed(true); setStatus('LISTENING — SPEAK NOW'); };
    rec.onerror  = (e) => { setStatus('MIC BLOCKED — ALLOW ACCESS OR TYPE BELOW'); };
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setHeard(t.slice(-60));
      checkPhrase(t);
    };
    rec.onend = () => { if (!unlocking) { try { rec.start(); } catch(e){} } };
    recRef.current = rec;
    try { rec.start(); } catch(e) { setStatus('MIC ERROR — TYPE BELOW'); }
  }, [checkPhrase, unlocking]);

  // canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;
    let w = canvas.width  = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const particles = Array.from({length: 60}, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vy: -(0.2 + Math.random() * 0.4),
      size: 1 + Math.random() * 2, alpha: 0.1 + Math.random() * 0.3,
    }));

    const draw = () => {
      t++;
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.fillRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;

      // rings
      for (let i = 0; i < 7; i++) {
        const r   = 80 + i * 70 + Math.sin(t * 0.018 + i) * 10;
        const alp = 0.05 + 0.03 * Math.sin(t * 0.025 + i);
        ctx.strokeStyle = 'rgba(0,180,255,' + alp + ')';
        ctx.lineWidth = 1; ctx.setLineDash([8,14]);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
      }
      ctx.setLineDash([]);

      // hex grid
      const HEX = 30;
      const gc = Math.ceil(w / (HEX * 1.5)) + 2;
      const gr = Math.ceil(h / (HEX * 1.732)) + 2;
      for (let col = -1; col < gc; col++) {
        for (let row = -1; row < gr; row++) {
          const px = col * HEX * 1.5;
          const py = row * HEX * 1.732 + (col % 2 ? HEX * 0.866 : 0);
          const dist = Math.hypot(px - cx, py - cy);
          const pulse = Math.sin(t * 0.012 - dist * 0.008) * 0.5 + 0.5;
          ctx.strokeStyle = 'rgba(0,100,255,' + (0.02 + pulse * 0.04) + ')';
          ctx.lineWidth = 0.5; ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const ang = k * Math.PI / 3;
            ctx.lineTo(px + HEX * 0.85 * Math.cos(ang), py + HEX * 0.85 * Math.sin(ang));
          }
          ctx.closePath(); ctx.stroke();
        }
      }

      // particles
      particles.forEach(p => {
        p.y += p.vy;
        if (p.y < 0) { p.y = h; p.x = Math.random() * w; }
        ctx.fillStyle = 'rgba(0,200,255,' + p.alpha + ')';
        ctx.fillRect(p.x, p.y, p.size, p.size * 3);
      });

      // corner brackets
      const bL = 26;
      ctx.strokeStyle = 'rgba(0,180,255,0.45)'; ctx.lineWidth = 1.5;
      [[0,0,1,1],[w,0,-1,1],[0,h,1,-1],[w,h,-1,-1]].forEach(([bx,by,dx,dy]) => {
        ctx.beginPath();
        ctx.moveTo(bx+dx*bL,by); ctx.lineTo(bx,by); ctx.lineTo(bx,by+dy*bL); ctx.stroke();
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{ position:'fixed', inset:0, background: unlocking ? '#001428' : '#000010', overflow:'hidden', transition:'background 1.5s' }}>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0 }} />

      <div style={{
        position:'relative', zIndex:10, height:'100%',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        fontFamily:'monospace', color:'#00b4ff', gap:0,
      }}>
        <div style={{ fontSize:10, letterSpacing:8, color:'rgba(0,180,255,0.4)', marginBottom:10 }}>FRIDAY OS  v2.0</div>
        <div style={{ fontSize:52, fontWeight:100, letterSpacing:20, textShadow:'0 0 40px rgba(0,180,255,0.9)', marginBottom:6 }}>FRIDAY</div>
        <div style={{ fontSize:10, letterSpacing:5, color:'rgba(0,180,255,0.5)', marginBottom:50 }}>PERSONAL AI SYSTEM — SECURE MODE</div>

        {/* lock icon */}
        <div style={{ marginBottom:28, opacity: unlocking ? 0 : 1, transition:'opacity 1s' }}>
          <svg width='38' height='48' viewBox='0 0 38 48' fill='none'>
            <rect x='3' y='21' width='32' height='23' rx='3' stroke='#00b4ff' strokeWidth='1.5'/>
            <path d='M9 21V14a10 10 0 0 1 20 0v7' stroke='#00b4ff' strokeWidth='1.5' fill='none'/>
            <circle cx='19' cy='32' r='3' fill='#00b4ff'/>
            <line x1='19' y1='32' x2='19' y2='38' stroke='#00b4ff' strokeWidth='1.5'/>
          </svg>
        </div>

        {/* status */}
        <div style={{ fontSize:11, letterSpacing:4, color: unlocking ? '#00ffaa' : armed ? '#00eaff' : '#00b4ff', marginBottom:12, transition:'color 0.5s', textAlign:'center' }}>
          {status}
        </div>

        {/* last heard */}
        {heard && !unlocking && (
          <div style={{ fontSize:10, color:'rgba(0,180,255,0.5)', marginBottom:10, maxWidth:340, textAlign:'center', letterSpacing:1 }}>
            LAST HEARD: "{heard.slice(-50)}"
          </div>
        )}

        {/* waveform */}
        <div style={{ display:'flex', gap:4, marginBottom:32, alignItems:'center', height:30 }}>
          {[1,1.8,1.2,2.5,1.5,2.2,1,1.8,2.4,1.3,2,1.6].map((v,i) => (
            <div key={i} style={{
              width:3, background: armed ? 'linear-gradient(to top,#00ffaa,#00eaff)' : 'linear-gradient(to top,#00b4ff,#00eaff)',
              borderRadius:2, opacity:0.7,
              animationName:'wave', animationDuration:(0.4+i*0.07)+'s',
              animationIterationCount:'infinite', animationDirection:'alternate',
              animationTimingFunction:'ease-in-out',
              height:(v*8)+'px',
            }} />
          ))}
        </div>

        {/* ARM button */}
        {!armed && !unlocking && (
          <button onClick={armMic} style={{
            background:'rgba(0,180,255,0.12)',
            border:'1px solid rgba(0,180,255,0.6)',
            color:'#00eaff', fontSize:11, letterSpacing:4,
            padding:'12px 32px', cursor:'pointer', borderRadius:3,
            fontFamily:'monospace', marginBottom:24,
            boxShadow:'0 0 20px rgba(0,180,255,0.2)',
            transition:'all 0.2s',
          }}>
            ARM MICROPHONE
          </button>
        )}

        {/* text fallback */}
        {!unlocking && (
          <form onSubmit={e => { e.preventDefault(); checkPhrase(textInput); setTextInput(''); }}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <div style={{ fontSize:9, letterSpacing:3, color:'rgba(0,180,255,0.35)', marginBottom:2 }}>OR TYPE PASSPHRASE</div>
            <div style={{ display:'flex', gap:8 }}>
              <input
                type='password'
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder='enter passphrase...'
                style={{
                  background:'rgba(0,180,255,0.04)',
                  border:'1px solid rgba(0,180,255,0.25)',
                  color:'#00b4ff', padding:'8px 14px',
                  fontFamily:'monospace', fontSize:13, letterSpacing:1,
                  outline:'none', borderRadius:2, width:230,
                }}
              />
              <button type='submit' style={{
                background:'rgba(0,180,255,0.08)',
                border:'1px solid rgba(0,180,255,0.35)',
                color:'#00b4ff', padding:'8px 14px',
                fontFamily:'monospace', fontSize:10, letterSpacing:3,
                cursor:'pointer', borderRadius:2,
              }}>ENTER</button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes wave { from { transform:scaleY(1); } to { transform:scaleY(3); } }
      `}</style>
    </div>
  );
}