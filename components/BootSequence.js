'use client';

import { useEffect, useRef, useState } from 'react';

const ACCENT = '#ff6b35';
const ACCENT_DIM = 'rgba(255,107,53,0.5)';
const ACCENT_FAINT = 'rgba(255,107,53,0.15)';

const CHECKS = [
  'INITIALISING BOB...',
  'Sales Floor         [ ONLINE ]',
  'Memory              [ ONLINE ]',
  'Voice               [ ONLINE ]',
  'Jobs                [ ONLINE ]',
  'Fair Work           [ ACTIVE ]',
  'ALL SYSTEMS NOMINAL',
];

export default function BootSequence({ onComplete }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [lines, setLines] = useState([]);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    let i = 0;
    const timers = [];

    CHECKS.forEach((line, idx) => {
      const t = setTimeout(() => {
        setLines(prev => [...prev, line]);
        i = idx + 1;
      }, 400 + idx * 280);
      timers.push(t);
    });

    const doneTimer = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => {
        sessionStorage.setItem('friday_booted', '1');
        onComplete();
      }, 600);
    }, 3000);
    timers.push(doneTimer);

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const drawHexGrid = () => {
      const HEX = 38;
      const cols = Math.ceil(w / (HEX * 1.5)) + 2;
      const rows = Math.ceil(h / (HEX * 1.732)) + 2;
      const cx = w / 2, cy = h / 2;
      for (let col = -1; col < cols; col++) {
        for (let row = -1; row < rows; row++) {
          const px = col * HEX * 1.5;
          const py = row * HEX * 1.732 + (col % 2 ? HEX * 0.866 : 0);
          const dist = Math.hypot(px - cx, py - cy);
          const pulse = Math.sin(t * 0.008 - dist * 0.005) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(255,107,53,${0.03 + pulse * 0.025})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const ang = (k * Math.PI) / 3;
            const hx = px + HEX * 0.82 * Math.cos(ang);
            const hy = py + HEX * 0.82 * Math.sin(ang);
            k === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    };

    const drawGlobe = () => {
      const cx = w / 2, cy = h / 2;
      const R = Math.min(w, h) * 0.28;
      const spin = t * 0.004;

      ctx.save();
      ctx.translate(cx, cy);

      // latitude lines
      for (let lat = -75; lat <= 75; lat += 25) {
        const phi = (lat * Math.PI) / 180;
        const r2d = R * Math.cos(phi);
        const y2d = R * Math.sin(phi);
        ctx.strokeStyle = `rgba(255,107,53,0.12)`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.ellipse(0, y2d, r2d, r2d * 0.18, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // longitude lines
      for (let lon = 0; lon < 180; lon += 30) {
        const theta = (lon * Math.PI) / 180 + spin;
        ctx.strokeStyle = `rgba(255,107,53,0.1)`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.05) {
          const x = R * Math.sin(a) * Math.cos(theta);
          const y = -R * Math.cos(a);
          a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        const theta2 = theta + Math.PI / 2;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.05) {
          const x = R * Math.sin(a) * Math.cos(theta2);
          const y = -R * Math.cos(a);
          a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // equator highlight
      ctx.strokeStyle = `rgba(255,107,53,0.22)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, R, R * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    };

    const drawOrb = () => {
      const cx = w / 2, cy = h / 2;
      const pulse = Math.sin(t * 0.05) * 0.12 + 1;
      const R = 28 * pulse;

      // glow
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 3.5);
      glow.addColorStop(0, 'rgba(255,107,53,0.35)');
      glow.addColorStop(0.4, 'rgba(255,107,53,0.08)');
      glow.addColorStop(1, 'rgba(255,107,53,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 3.5, 0, Math.PI * 2);
      ctx.fill();

      // core
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      core.addColorStop(0, '#fff8f5');
      core.addColorStop(0.3, ACCENT);
      core.addColorStop(1, 'rgba(255,107,53,0.3)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // orbit ring 1
      ctx.strokeStyle = ACCENT_DIM;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 70, 20, t * 0.01, 0, Math.PI * 2);
      ctx.stroke();

      // orbit ring 2
      ctx.strokeStyle = 'rgba(255,107,53,0.3)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 8]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, 95, 28, -t * 0.008 + 0.8, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([]);

      // orbiting node
      const nx = cx + 70 * Math.cos(t * 0.02);
      const ny = cy + 20 * Math.sin(t * 0.02);
      ctx.fillStyle = '#ff6b35';
      ctx.shadowColor = ACCENT;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    const draw = () => {
      t++;
      ctx.fillStyle = 'rgba(11,13,18,0.18)';
      ctx.fillRect(0, 0, w, h);

      drawHexGrid();
      drawGlobe();
      drawOrb();

      // corner brackets
      const bLen = 28;
      ctx.strokeStyle = ACCENT_DIM;
      ctx.lineWidth = 1.5;
      [[0,0,1,1],[w,0,-1,1],[0,h,1,-1],[w,h,-1,-1]].forEach(([bx,by,dx,dy]) => {
        ctx.beginPath();
        ctx.moveTo(bx + dx*bLen, by);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx, by + dy*bLen);
        ctx.stroke();
      });

      // clock
      const timeStr = new Date().toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      ctx.font = '300 11px monospace';
      ctx.fillStyle = ACCENT_DIM;
      ctx.textAlign = 'right';
      ctx.fillText(timeStr, w - 20, h - 18);
      ctx.textAlign = 'left';

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div style={{ position:'fixed', inset:0, background:'#0b0d12', overflow:'hidden', fontFamily:'monospace', opacity, transition:'opacity 0.6s' }}>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0 }} />

      <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:10, pointerEvents:'none' }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:32 }}>
          {/* Title */}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:13, letterSpacing:8, color:ACCENT_DIM, marginBottom:6 }}>PERSONAL AI SYSTEM</div>
            <div style={{ fontSize:48, fontWeight:100, letterSpacing:12, color:ACCENT, textShadow:`0 0 40px ${ACCENT}` }}>FRIDAY</div>
          </div>

          {/* Boot log */}
          <div style={{ minWidth:320, fontSize:11, letterSpacing:2, lineHeight:2, color:ACCENT_DIM }}>
            {lines.map((line, i) => {
              const isGood = line.includes('[ ONLINE ]') || line.includes('[ ACTIVE ]') || line.includes('NOMINAL');
              return (
                <div key={i} style={{ display:'flex', gap:10, animation:'slideIn 0.25s ease-out', color: isGood ? '#3dd68c' : ACCENT_DIM }}>
                  <span style={{ color:ACCENT_FAINT }}>›</span>
                  <span>{line}</span>
                  {isGood && line !== 'ALL SYSTEMS NOMINAL' && <span style={{ marginLeft:'auto', color:'#3dd68c' }}>✓</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform:translateX(-10px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>
    </div>
  );
}
