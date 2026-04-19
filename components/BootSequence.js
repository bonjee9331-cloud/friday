'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const CHECKS = [
  { text: 'NEURAL NET',    status: 'CONNECTED',  colour: '#3dd68c' },
  { text: 'SALES FLOOR',   status: 'ONLINE',     colour: '#3dd68c' },
  { text: 'MEMORY',        status: 'SYNCED',     colour: '#3dd68c' },
  { text: 'VOICE SYNTH',   status: 'READY',      colour: '#3dd68c' },
  { text: 'JOB AUTOPILOT', status: 'RUNNING',    colour: '#3dd68c' },
  { text: 'FAIR WORK',     status: 'ACTIVE',     colour: '#f59e0b' },
  { text: 'AGENTS',        status: '5 ONLINE',   colour: '#3dd68c' },
  { text: 'ALL SYSTEMS',   status: 'NOMINAL',    colour: '#00d4ff' },
];

const VOICE_SCRIPT = "Good morning, Ben. All systems are online. FRIDAY is ready.";

const MUSIC_ID    = 'XXswgVBbTjU';
const MUSIC_START = 200;
const MUSIC_END   = 243;
const START_VOL   = 65;
const FADE_DUR    = 2500;

export default function BootSequence({ onComplete }) {
  const playerRef   = useRef(null);
  const playerIdRef = useRef(`yt-${Math.random().toString(36).slice(2)}`);
  const fadeToRef   = useRef(null);
  const fadeIvRef   = useRef(null);
  const finishRef   = useRef(null);
  const speakRef    = useRef(null);
  const doneRef     = useRef(null);
  const hardRef     = useRef(null);

  const [lines,       setLines]       = useState([]);
  const [title,       setTitle]       = useState('');
  const [subtitle,    setSubtitle]    = useState('');
  const [musicDone,   setMusicDone]   = useState(false);
  const [voiceDone,   setVoiceDone]   = useState(false);
  const [voiceStart,  setVoiceStart]  = useState(false);
  const [opacity,     setOpacity]     = useState(1);
  const [statusMsg,   setStatusMsg]   = useState('');

  // ── title typewriter ─────────────────────────────────────────
  useEffect(() => {
    const full = 'FRIDAY';
    const sub  = 'PERSONAL AI SYSTEM · INITIALISING';
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setTitle(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(iv);
        let j = 0;
        const iv2 = setInterval(() => {
          j++;
          setSubtitle(sub.slice(0, j));
          if (j >= sub.length) clearInterval(iv2);
        }, 22);
      }
    }, 60);
    return () => clearInterval(iv);
  }, []);

  // ── boot checklist ────────────────────────────────────────────
  useEffect(() => {
    const timers = CHECKS.map((c, i) =>
      setTimeout(() => setLines(prev => [...prev, c]), 700 + i * 360)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── YouTube music ─────────────────────────────────────────────
  const markMusicDone = useCallback(() => setMusicDone(prev => prev || true), []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;

    const setup = () => {
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

            const dur = (MUSIC_END - MUSIC_START) * 1000;
            fadeToRef.current = setTimeout(() => {
              let v = START_VOL;
              fadeIvRef.current = setInterval(() => {
                v -= 4;
                try { playerRef.current?.setVolume(Math.max(0, v)); } catch {}
                if (v <= 0) {
                  clearInterval(fadeIvRef.current);
                  try { playerRef.current?.stopVideo(); } catch {}
                  markMusicDone();
                }
              }, 160);
            }, Math.max(0, dur - FADE_DUR));

            finishRef.current = setTimeout(() => {
              try { playerRef.current?.stopVideo(); } catch {}
              markMusicDone();
            }, dur + 600);
          },
          onError: () => markMusicDone(),
          onStateChange(e) { if (e.data === 0) markMusicDone(); },
        },
      });
    };

    if (window.YT?.Player) {
      setup();
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const s = document.createElement('script');
        s.id = 'yt-iframe-api';
        s.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(s);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (typeof prev === 'function') prev(); setup(); };
    }

    return () => { cancelled = true; };
  }, [markMusicDone]);

  // ── speak via ElevenLabs ──────────────────────────────────────
  const speak = useCallback(async (text) => {
    if (!text?.trim()) { setVoiceDone(true); return; }
    try {
      const res = await fetch('/api/friday/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('voice api');
      const buf = await res.arrayBuffer();
      const AC  = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('no audio ctx');
      const ac  = new AC();
      const src = ac.createBufferSource();
      src.buffer = await ac.decodeAudioData(buf.slice(0));
      src.connect(ac.destination);
      src.start(0);
      src.onended = () => { setVoiceDone(true); ac.close().catch(() => {}); };
    } catch {
      // Browser fallback
      try {
        if (window.speechSynthesis) {
          const u = new SpeechSynthesisUtterance(text);
          u.onend = u.onerror = () => setVoiceDone(true);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        } else setVoiceDone(true);
      } catch { setVoiceDone(true); }
    }
  }, []);

  // ── trigger speak after music + checks done ───────────────────
  useEffect(() => {
    if (!musicDone || voiceStart || lines.length < CHECKS.length) return;
    setVoiceStart(true);
    setStatusMsg('DELIVERING MORNING BRIEFING...');
    speakRef.current = setTimeout(async () => {
      try {
        const r = await fetch('/api/briefing');
        const d = await r.json();
        await speak(d?.briefing || VOICE_SCRIPT);
      } catch {
        await speak(VOICE_SCRIPT);
      }
    }, 500);
    return () => clearTimeout(speakRef.current);
  }, [musicDone, voiceStart, lines.length, speak]);

  // ── complete when voice done ──────────────────────────────────
  useEffect(() => {
    if (!voiceDone) return;
    setStatusMsg('FRIDAY ONLINE — LAUNCHING');
    doneRef.current = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => {
        sessionStorage.setItem('friday_booted', '1');
        onComplete();
      }, 700);
    }, 1000);
    return () => clearTimeout(doneRef.current);
  }, [voiceDone, onComplete]);

  // ── hard stop at 55s ──────────────────────────────────────────
  useEffect(() => {
    hardRef.current = setTimeout(() => setVoiceDone(true), 55000);
    return () => clearTimeout(hardRef.current);
  }, []);

  // ── cleanup ───────────────────────────────────────────────────
  useEffect(() => () => {
    [fadeToRef, fadeIvRef, finishRef, speakRef, doneRef, hardRef].forEach(r => {
      if (r.current != null) clearTimeout(r.current);
    });
    try { playerRef.current?.destroy(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  const handleSkip = () => {
    setOpacity(0);
    setTimeout(() => {
      sessionStorage.setItem('friday_booted', '1');
      onComplete();
    }, 500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: '#020a0e',
      overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity, transition: 'opacity 0.7s ease',
    }}>
      {/* Hidden YouTube player */}
      <div id={playerIdRef.current} style={{ position: 'absolute', width: 1, height: 1, opacity: 0.01, top: 0, left: 0, pointerEvents: 'none' }} />

      {/* SKIP button */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute', top: 16, right: 20,
          background: 'transparent',
          border: '1px solid rgba(0,212,255,0.2)',
          color: 'rgba(0,212,255,0.4)',
          fontFamily: 'var(--font-mono)',
          fontSize: 9, letterSpacing: 3,
          padding: '5px 12px',
          cursor: 'pointer', borderRadius: 2,
          transition: 'all 0.15s',
          zIndex: 10,
        }}
        onMouseEnter={e => { e.target.style.color = '#00d4ff'; e.target.style.borderColor = 'rgba(0,212,255,0.5)'; }}
        onMouseLeave={e => { e.target.style.color = 'rgba(0,212,255,0.4)'; e.target.style.borderColor = 'rgba(0,212,255,0.2)'; }}
      >
        SKIP ›
      </button>

      {/* Corner brackets */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          linear-gradient(to right, #00d4ff 30px, transparent 30px) top left / 30px 1px no-repeat,
          linear-gradient(to bottom,#00d4ff 30px, transparent 30px) top left / 1px 30px no-repeat,
          linear-gradient(to left,  #00d4ff 30px, transparent 30px) top right / 30px 1px no-repeat,
          linear-gradient(to bottom,#00d4ff 30px, transparent 30px) top right / 1px 30px no-repeat,
          linear-gradient(to right, #00d4ff 30px, transparent 30px) bottom left / 30px 1px no-repeat,
          linear-gradient(to top,   #00d4ff 30px, transparent 30px) bottom left / 1px 30px no-repeat,
          linear-gradient(to left,  #00d4ff 30px, transparent 30px) bottom right / 30px 1px no-repeat,
          linear-gradient(to top,   #00d4ff 30px, transparent 30px) bottom right / 1px 30px no-repeat
        `,
        opacity: 0.45,
      }} />

      {/* Scanlines */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px)',
      }} />

      {/* Main content: centred column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, position: 'relative', zIndex: 5 }}>

        {/* Arc reactor */}
        <div className="arc-reactor">
          <div className="arc-ring ring-1" />
          <div className="arc-ring ring-2" />
          <div className="arc-ring ring-3" />
          <div className="arc-ring ring-4" />
          <div className="arc-glow" />
          <div className="arc-core" />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-hud)',
            fontSize: 44, fontWeight: 900,
            letterSpacing: 16,
            color: '#00d4ff',
            textShadow: '0 0 40px rgba(0,212,255,0.7), 0 0 80px rgba(0,212,255,0.3)',
            lineHeight: 1,
            minHeight: 52,
          }}>
            {title}
            {title.length < 6 && (
              <span style={{ animation: 'blink-cursor 0.8s step-end infinite', color: 'rgba(0,212,255,0.7)' }}>_</span>
            )}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9, letterSpacing: 4,
            color: 'rgba(0,212,255,0.4)',
            marginTop: 8, minHeight: 14,
          }}>{subtitle}</div>
        </div>

        {/* Boot checklist */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 4,
          width: 320, minHeight: 160,
        }}>
          {lines.map((line, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5,
              animation: 'hudSlideIn 0.2s ease-out',
            }}>
              <span style={{ color: 'rgba(0,212,255,0.5)' }}>› {line.text}</span>
              <span style={{
                color: line.colour,
                textShadow: `0 0 8px ${line.colour}`,
                fontSize: 9, letterSpacing: 2,
              }}>[ {line.status} ]</span>
            </div>
          ))}
        </div>

        {/* Status message */}
        <div style={{
          fontFamily: 'var(--font-hud)',
          fontSize: 8, letterSpacing: 3,
          color: '#3dd68c',
          minHeight: 14,
          animation: statusMsg ? 'pulse-dot 2s ease-in-out infinite' : 'none',
        }}>
          {statusMsg}
        </div>
      </div>
    </div>
  );
}
