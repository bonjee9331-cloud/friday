'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const ACCENT       = '#ff6b35';
const ACCENT_DIM   = 'rgba(255,107,53,0.55)';
const ACCENT_FAINT = 'rgba(255,107,53,0.12)';

const MUSIC_ID       = 'XXswgVBbTjU';
const MUSIC_START    = 200;
const MUSIC_END      = 243;
const MUSIC_DURATION = (MUSIC_END - MUSIC_START) * 1000;
const FADE_DURATION  = 2500;
const START_VOL      = 70;

const CHECKS = [
  'INITIALISING FRIDAY...',
  'Sales Floor         [ ONLINE ]',
  'Memory              [ ONLINE ]',
  'Voice               [ ONLINE ]',
  'Jobs                [ ONLINE ]',
  'Fair Work           [ ACTIVE ]',
  'ALL SYSTEMS NOMINAL',
];

export default function BootSequence({ onComplete }) {
  const canvasRef   = useRef(null);
  const animRef     = useRef(null);
  const playerRef   = useRef(null);
  const phaseRef    = useRef(0);
  const playerIdRef = useRef(`yt-${Math.random().toString(36).slice(2)}`);

  const fadeTimeoutRef  = useRef(null);
  const fadeIntervalRef = useRef(null);
  const finishRef       = useRef(null);
  const speakRef        = useRef(null);
  const doneRef         = useRef(null);
  const hardStopRef     = useRef(null);

  const [phase,        setPhase]        = useState(0);
  const [lines,        setLines]        = useState([]);
  const [weather,      setWeather]      = useState(null);
  const [news,         setNews]         = useState([]);
  const [showData,     setShowData]     = useState(false);
  const [musicDone,    setMusicDone]    = useState(false);
  const [briefingDone, setBriefingDone] = useState(false);
  const [voiceStarted, setVoiceStarted] = useState(false);
  const [statusMsg,    setStatusMsg]    = useState('');
  const [opacity,      setOpacity]      = useState(1);

  // ── mark music finished (idempotent) ─────────────────────────────────────
  const markMusicDone = useCallback(() => setMusicDone(prev => prev || true), []);

  // ── fetch data ────────────────────────────────────────────────────────────
  useEffect(() => {
    let live = true;
    fetch('/api/weather').then(r => r.json()).then(d => { if (live) setWeather(d); }).catch(() => {});
    fetch('/api/news').then(r => r.json()).then(d => { if (live && d?.headlines) setNews(d.headlines); }).catch(() => {});
    return () => { live = false; };
  }, []);

  // ── boot checklist (staggered) ────────────────────────────────────────────
  useEffect(() => {
    const timers = CHECKS.map((line, i) =>
      setTimeout(() => setLines(prev => [...prev, line]), 600 + i * 340)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── phases ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = [
      setTimeout(() => { phaseRef.current = 1; setPhase(1); }, 800),
      setTimeout(() => { phaseRef.current = 2; setPhase(2); }, 2500),
      setTimeout(() => { phaseRef.current = 3; setPhase(3); }, 5000),
      setTimeout(() => { phaseRef.current = 4; setPhase(4); setShowData(true); }, 8000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  // ── YouTube music ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const setupPlayer = () => {
      if (cancelled || playerRef.current || !window.YT?.Player) return;
      const el = document.getElementById(playerIdRef.current);
      if (!el) return;

      playerRef.current = new window.YT.Player(playerIdRef.current, {
        height: '1', width: '1',
        videoId: MUSIC_ID,
        playerVars: { autoplay:1, controls:0, disablekb:1, fs:0, modestbranding:1, playsinline:1, rel:0, start:MUSIC_START, end:MUSIC_END },
        events: {
          onReady(e) {
            try { e.target.setVolume(START_VOL); e.target.seekTo(MUSIC_START, true); e.target.playVideo(); }
            catch { markMusicDone(); return; }

            fadeTimeoutRef.current = setTimeout(() => {
              let vol = START_VOL;
              fadeIntervalRef.current = setInterval(() => {
                vol -= 5;
                try { playerRef.current?.setVolume(Math.max(0, vol)); } catch {}
                if (vol <= 0) {
                  clearInterval(fadeIntervalRef.current);
                  try { playerRef.current?.stopVideo(); } catch {}
                  markMusicDone();
                }
              }, 180);
            }, Math.max(0, MUSIC_DURATION - FADE_DURATION));

            finishRef.current = setTimeout(() => {
              try { playerRef.current?.stopVideo(); } catch {}
              markMusicDone();
            }, MUSIC_DURATION + 600);
          },
          onError: () => markMusicDone(),
          onStateChange(e) { if (e.data === 0) markMusicDone(); },
        },
      });
    };

    if (window.YT?.Player) {
      setupPlayer();
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const s = document.createElement('script');
        s.id  = 'yt-iframe-api';
        s.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(s);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (typeof prev === 'function') prev(); setupPlayer(); };
    }

    return () => { cancelled = true; };
  }, [markMusicDone]);

  // ── speak briefing ────────────────────────────────────────────────────────
  const speakBrowserFallback = useCallback((text) => new Promise(resolve => {
    if (!window.speechSynthesis || !text?.trim()) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onend = u.onerror = () => resolve();
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(x => /en-au|en-gb/i.test(x.lang)) || voices[0];
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }), []);

  const speak = useCallback(async (text) => {
    if (voiceStarted) return;
    setVoiceStarted(true);
    if (!text?.trim()) { setBriefingDone(true); return; }

    try {
      const res = await fetch('/api/friday/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('voice api failed');
      const buf = await res.arrayBuffer();
      const AC  = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('no audio ctx');
      const ac  = new AC();
      const src = ac.createBufferSource();
      src.buffer = await ac.decodeAudioData(buf.slice(0));
      src.connect(ac.destination);
      src.start(0);
      src.onended = () => { setBriefingDone(true); ac.close().catch(() => {}); };
    } catch {
      await speakBrowserFallback(text);
      setBriefingDone(true);
    }
  }, [speakBrowserFallback, voiceStarted]);

  // ── trigger speak when music done + phase 4 ───────────────────────────────
  useEffect(() => {
    if (phase < 4 || !musicDone || voiceStarted) return;
    setStatusMsg('DELIVERING MORNING BRIEFING...');

    speakRef.current = setTimeout(async () => {
      try {
        const r = await fetch('/api/briefing');
        const d = await r.json();
        await speak(d?.briefing || 'Good morning Ben. All systems are online.');
      } catch {
        await speak('Good morning Ben. All systems are online.');
      }
    }, 400);

    return () => clearTimeout(speakRef.current);
  }, [phase, musicDone, voiceStarted, speak]);

  // ── complete when briefing done ───────────────────────────────────────────
  useEffect(() => {
    if (!briefingDone || phase < 4) return;
    setStatusMsg('BRIEFING COMPLETE — LAUNCHING FRIDAY');
    doneRef.current = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => { sessionStorage.setItem('friday_booted', '1'); onComplete(); }, 600);
    }, 1200);
    return () => clearTimeout(doneRef.current);
  }, [briefingDone, phase, onComplete]);

  // ── hard stop at 50s ──────────────────────────────────────────────────────
  useEffect(() => {
    hardStopRef.current = setTimeout(() => setBriefingDone(true), 50000);
    return () => clearTimeout(hardStopRef.current);
  }, []);

  // ── canvas animation ──────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;
    let w = (canvas.width  = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const resize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);

    const drawHexGrid = () => {
      const HEX = 38, cx = w / 2, cy = h / 2;
      const cols = Math.ceil(w / (HEX * 1.5)) + 2;
      const rows = Math.ceil(h / (HEX * 1.732)) + 2;
      for (let col = -1; col < cols; col++) {
        for (let row = -1; row < rows; row++) {
          const px = col * HEX * 1.5;
          const py = row * HEX * 1.732 + (col % 2 ? HEX * 0.866 : 0);
          const dist = Math.hypot(px - cx, py - cy);
          const pulse = Math.sin(t * 0.008 - dist * 0.005) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(255,107,53,${0.028 + pulse * 0.022})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = (k * Math.PI) / 3;
            const hx = px + HEX * 0.82 * Math.cos(a);
            const hy = py + HEX * 0.82 * Math.sin(a);
            k === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    };

    const drawGlobe = () => {
      const cx = w / 2, cy = h / 2;
      const R  = Math.min(w, h) * 0.29;
      const spin = t * 0.004;
      ctx.save();
      ctx.translate(cx, cy);
      for (let lat = -75; lat <= 75; lat += 25) {
        const phi = (lat * Math.PI) / 180;
        const r2d = R * Math.cos(phi);
        const y2d = R * Math.sin(phi);
        ctx.strokeStyle = 'rgba(255,107,53,0.11)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.ellipse(0, y2d, r2d, r2d * 0.18, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      for (let lon = 0; lon < 180; lon += 30) {
        [spin + (lon * Math.PI) / 180, spin + (lon * Math.PI) / 180 + Math.PI / 2].forEach(theta => {
          ctx.strokeStyle = 'rgba(255,107,53,0.09)';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          for (let a = 0; a <= Math.PI * 2; a += 0.05) {
            const x = R * Math.sin(a) * Math.cos(theta);
            const y = -R * Math.cos(a);
            a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.stroke();
        });
      }
      ctx.strokeStyle = 'rgba(255,107,53,0.2)';
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

      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 3.5);
      glow.addColorStop(0, 'rgba(255,107,53,0.38)');
      glow.addColorStop(0.4, 'rgba(255,107,53,0.07)');
      glow.addColorStop(1, 'rgba(255,107,53,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(cx, cy, R * 3.5, 0, Math.PI * 2); ctx.fill();

      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      core.addColorStop(0, '#fff8f5');
      core.addColorStop(0.3, ACCENT);
      core.addColorStop(1, 'rgba(255,107,53,0.25)');
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

      ctx.strokeStyle = ACCENT_DIM; ctx.lineWidth = 1; ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.ellipse(cx, cy, 70, 20, t * 0.01, 0, Math.PI * 2); ctx.stroke();

      ctx.strokeStyle = 'rgba(255,107,53,0.28)'; ctx.lineWidth = 0.8; ctx.setLineDash([2, 8]);
      ctx.beginPath(); ctx.ellipse(cx, cy, 95, 28, -t * 0.008 + 0.8, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      const nx = cx + 70 * Math.cos(t * 0.022);
      const ny = cy + 20 * Math.sin(t * 0.022);
      ctx.fillStyle = ACCENT; ctx.shadowColor = ACCENT; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(nx, ny, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    };

    const draw = () => {
      t++;
      const ph = phaseRef.current;
      ctx.fillStyle = ph < 2 ? 'rgba(11,13,18,0.35)' : 'rgba(11,13,18,0.16)';
      ctx.fillRect(0, 0, w, h);

      if (ph >= 1) drawHexGrid();
      drawGlobe();
      drawOrb();

      // corner brackets
      const bLen = 28;
      ctx.strokeStyle = ACCENT_DIM; ctx.lineWidth = 1.5;
      [[0,0,1,1],[w,0,-1,1],[0,h,1,-1],[w,h,-1,-1]].forEach(([bx,by,dx,dy]) => {
        ctx.beginPath();
        ctx.moveTo(bx + dx*bLen, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + dy*bLen);
        ctx.stroke();
      });

      // clock
      const ts = new Date().toLocaleTimeString('en-AU', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      ctx.font = '300 11px monospace'; ctx.fillStyle = ACCENT_DIM;
      ctx.textAlign = 'right'; ctx.fillText(ts, w - 20, h - 18); ctx.textAlign = 'left';

      // title (phases 1+)
      if (ph >= 1) {
        const yPos = ph >= 3 ? 58 : h / 2 - 60;
        ctx.font = `300 ${ph >= 2 ? '36' : '46'}px monospace`;
        ctx.fillStyle = ACCENT; ctx.shadowColor = ACCENT; ctx.shadowBlur = 30;
        ctx.textAlign = 'center'; ctx.fillText('FRIDAY', w / 2, yPos); ctx.shadowBlur = 0;
        ctx.font = '300 10px monospace'; ctx.fillStyle = ACCENT_DIM;
        ctx.fillText('PERSONAL AI SYSTEM', w / 2, yPos + 22); ctx.textAlign = 'left';
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // ── cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => {
    [fadeTimeoutRef, fadeIntervalRef, finishRef, speakRef, doneRef, hardStopRef].forEach(r => {
      if (r.current) (r.current.constructor === Number ? clearTimeout : clearTimeout)(r.current);
    });
    try { playerRef.current?.destroy(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  const WMO = {0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',51:'Drizzle',61:'Rain',65:'Heavy Rain',80:'Showers',95:'Storm'};

  return (
    <div style={{ position:'fixed', inset:0, background:'#0b0d12', overflow:'hidden', fontFamily:'monospace', opacity, transition:'opacity 0.6s ease' }}>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0 }} />

      {/* hidden YouTube player */}
      <div id={playerIdRef.current} style={{ position:'absolute', width:1, height:1, opacity:0.01, top:0, left:0, pointerEvents:'none' }} />

      {/* boot log — left side */}
      <div style={{
        position:'absolute', top:90, left:44, zIndex:10,
        fontSize:11, letterSpacing:2, lineHeight:2, color:ACCENT_DIM,
        opacity: phase >= 1 ? 1 : 0, transition:'opacity 1s',
      }}>
        {lines.map((line, i) => {
          const good = line.includes('[ ONLINE ]') || line.includes('[ ACTIVE ]') || line.includes('NOMINAL');
          return (
            <div key={i} style={{ display:'flex', gap:10, color: good ? '#3dd68c' : ACCENT_DIM, animation:'slideIn 0.25s ease-out' }}>
              <span style={{ color:ACCENT_FAINT }}>›</span>
              <span>{line}</span>
              {good && line !== 'ALL SYSTEMS NOMINAL' && <span style={{ marginLeft:'auto', paddingLeft:16, color:'#3dd68c' }}>✓</span>}
            </div>
          );
        })}
      </div>

      {/* data panels — right side */}
      {showData && (
        <div style={{ position:'absolute', inset:0, zIndex:10, pointerEvents:'none' }}>
          {/* weather */}
          <div style={{
            position:'absolute', top:90, right:44,
            border:'1px solid rgba(255,107,53,0.25)', background:'rgba(11,13,18,0.88)',
            padding:'16px 20px', borderRadius:4, color:ACCENT, minWidth:220,
            animation:'slideInRight 0.8s ease-out',
          }}>
            <div style={{ fontSize:9, letterSpacing:4, marginBottom:10, color:ACCENT_DIM }}>HUA HIN WEATHER</div>
            {weather ? (
              <>
                <div style={{ fontSize:34, fontWeight:100 }}>{weather.temp}°C</div>
                <div style={{ fontSize:11, marginTop:4, color:ACCENT }}>{WMO[weather.code] || weather.desc}</div>
                <div style={{ fontSize:10, marginTop:8, color:ACCENT_DIM }}>Feels {weather.feels}°C · Wind {weather.wind}km/h · Rain {weather.rain}%</div>
              </>
            ) : <div style={{ fontSize:10, color:ACCENT_DIM }}>LOADING...</div>}
          </div>

          {/* news */}
          <div style={{
            position:'absolute', top:260, right:44,
            border:'1px solid rgba(255,107,53,0.18)', background:'rgba(11,13,18,0.88)',
            padding:'14px 18px', borderRadius:4, color:ACCENT, width:300,
            animation:'slideInRight 1s ease-out',
          }}>
            <div style={{ fontSize:9, letterSpacing:4, marginBottom:10, color:ACCENT_DIM }}>LIVE HEADLINES</div>
            {news.length ? news.slice(0, 5).map((h, i) => (
              <div key={i} style={{
                fontSize:10, lineHeight:1.6,
                borderBottom: i < 4 ? '1px solid rgba(255,107,53,0.08)' : 'none',
                paddingBottom:6, marginBottom:6, color:'rgba(255,180,140,0.85)',
              }}>
                <span style={{ color:ACCENT_FAINT, marginRight:6 }}>{i+1}.</span>{h}
              </div>
            )) : <div style={{ fontSize:10, color:ACCENT_DIM }}>LOADING...</div>}
          </div>

          {/* status */}
          {statusMsg && (
            <div style={{
              position:'absolute', bottom:60, left:'50%', transform:'translateX(-50%)',
              fontSize:11, letterSpacing:3, color:'#3dd68c', whiteSpace:'nowrap',
              animation:'pulse 2s infinite',
            }}>{statusMsg}</div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideIn      { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse        { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
