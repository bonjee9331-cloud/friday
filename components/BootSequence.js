'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const CHECKS = [
  { text: 'NEURAL NET',    status: 'CONNECTED', colour: '#3dd68c' },
  { text: 'SALES FLOOR',  status: 'ONLINE',    colour: '#3dd68c' },
  { text: 'MEMORY',       status: 'SYNCED',    colour: '#3dd68c' },
  { text: 'VOICE SYNTH',  status: 'READY',     colour: '#3dd68c' },
  { text: 'JOB AUTOPILOT',status: 'RUNNING',   colour: '#3dd68c' },
  { text: 'FAIR WORK',    status: 'ACTIVE',     colour: '#f59e0b' },
  { text: 'AGENTS',       status: '5 ONLINE',  colour: '#3dd68c' },
  { text: 'ALL SYSTEMS',  status: 'NOMINAL',   colour: '#00d4ff' },
];

const WMO = { 0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',51:'Drizzle',61:'Rain',65:'Heavy Rain',80:'Showers',95:'Storm' };
const MUSIC_ID    = 'XXswgVBbTjU';
const MUSIC_START = 200;
const MUSIC_END   = 243;
const START_VOL   = 60;
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

  const [lines,        setLines]        = useState([]);
  const [title,        setTitle]        = useState('');
  const [subtitle,     setSubtitle]     = useState('');
  const [opacity,      setOpacity]      = useState(1);
  const [statusMsg,    setStatusMsg]    = useState('');
  const [voiceStart,   setVoiceStart]   = useState(false);
  const [voiceDone,    setVoiceDone]    = useState(false);

  // Data panels
  const [weather,  setWeather]  = useState(null);
  const [news,     setNews]     = useState([]);
  const [markets,  setMarkets]  = useState(null);
  const [briefing, setBriefing] = useState('');

  // ── fetch data immediately ────────────────────────────────
  useEffect(() => {
    fetch('/api/weather').then(r => r.json()).then(setWeather).catch(() => {});
    fetch('/api/news').then(r => r.json()).then(d => { if (d?.headlines) setNews(d.headlines); }).catch(() => {});
    fetch('/api/markets').then(r => r.json()).then(setMarkets).catch(() => {});
    fetch('/api/briefing').then(r => r.json()).then(d => { if (d?.briefing) setBriefing(d.briefing); }).catch(() => {});
  }, []);

  // ── title typewriter ──────────────────────────────────────
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

  // ── boot checklist (staggered) ────────────────────────────
  useEffect(() => {
    const timers = CHECKS.map((c, i) =>
      setTimeout(() => setLines(prev => [...prev, c]), 700 + i * 340)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  // ── YouTube music ─────────────────────────────────────────
  const markMusicDone = useCallback(() => {}, []); // music fades on its own

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
            catch { return; }

            const dur = (MUSIC_END - MUSIC_START) * 1000;
            fadeToRef.current = setTimeout(() => {
              let v = START_VOL;
              fadeIvRef.current = setInterval(() => {
                v -= 4;
                try { playerRef.current?.setVolume(Math.max(0, v)); } catch {}
                if (v <= 0) { clearInterval(fadeIvRef.current); try { playerRef.current?.stopVideo(); } catch {} }
              }, 160);
            }, Math.max(0, dur - FADE_DUR));

            finishRef.current = setTimeout(() => {
              try { playerRef.current?.stopVideo(); } catch {}
            }, dur + 600);
          },
          onError: () => {},
          onStateChange: () => {},
        },
      });
    };

    if (window.YT?.Player) {
      setup();
    } else {
      if (!document.getElementById('yt-iframe-api')) {
        const s = document.createElement('script');
        s.id = 'yt-iframe-api'; s.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(s);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (typeof prev === 'function') prev(); setup(); };
    }

    return () => { cancelled = true; };
  }, []);

  // ── speak via ElevenLabs (starts at ~4s — after checks) ──
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
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.onend = u.onerror = () => setVoiceDone(true);
          window.speechSynthesis.speak(u);
        } else setVoiceDone(true);
      } catch { setVoiceDone(true); }
    }
  }, []);

  // Trigger briefing after checks complete (~4s in), don't wait for music
  useEffect(() => {
    if (voiceStart) return;
    const t = setTimeout(() => {
      if (voiceStart) return;
      setVoiceStart(true);
      setStatusMsg('DELIVERING MORNING BRIEFING...');
      const text = briefing || 'Good morning Ben. All systems are online. FRIDAY is ready.';
      speak(text);
    }, 4200);
    return () => clearTimeout(t);
  }, [voiceStart, briefing, speak]);

  // ── complete when voice done ──────────────────────────────
  useEffect(() => {
    if (!voiceDone) return;
    setStatusMsg('FRIDAY ONLINE — LAUNCHING');
    doneRef.current = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => {
        sessionStorage.setItem('friday_booted', '1');
        onComplete();
      }, 700);
    }, 1200);
    return () => clearTimeout(doneRef.current);
  }, [voiceDone, onComplete]);

  // ── hard stop at 55s ──────────────────────────────────────
  useEffect(() => {
    hardRef.current = setTimeout(() => setVoiceDone(true), 55000);
    return () => clearTimeout(hardRef.current);
  }, []);

  // ── cleanup ───────────────────────────────────────────────
  useEffect(() => () => {
    [fadeToRef, fadeIvRef, finishRef, speakRef, doneRef, hardRef].forEach(r => {
      if (r.current != null) clearTimeout(r.current);
    });
    try { playerRef.current?.destroy(); } catch {}
    try { window.speechSynthesis?.cancel(); } catch {}
  }, []);

  const handleSkip = () => {
    setOpacity(0);
    setTimeout(() => { sessionStorage.setItem('friday_booted', '1'); onComplete(); }, 500);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: '#020a0e', overflow: 'hidden',
      opacity, transition: 'opacity 0.7s ease',
    }}>
      {/* Hidden YouTube player */}
      <div id={playerIdRef.current} style={{ position: 'absolute', width: 1, height: 1, opacity: 0.01, top: 0, left: 0, pointerEvents: 'none' }} />

      {/* Scanlines */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.013) 2px, rgba(0,212,255,0.013) 4px)' }} />

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
          linear-gradient(to top,   #00d4ff 30px, transparent 30px) bottom right / 1px 30px no-repeat`,
        opacity: 0.42,
      }} />

      {/* SKIP */}
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute', top: 16, right: 20, zIndex: 10,
          background: 'transparent', border: '1px solid rgba(0,212,255,0.18)',
          color: 'rgba(0,212,255,0.38)', fontFamily: 'var(--font-mono)',
          fontSize: 9, letterSpacing: 3, padding: '5px 12px',
          cursor: 'pointer', borderRadius: 2, transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.target.style.color = '#00d4ff'; e.target.style.borderColor = 'rgba(0,212,255,0.5)'; }}
        onMouseLeave={e => { e.target.style.color = 'rgba(0,212,255,0.38)'; e.target.style.borderColor = 'rgba(0,212,255,0.18)'; }}
      >SKIP ›</button>

      {/* ── POPUP DATA PANELS ── */}

      {weather && (
        <BootPanel side="right" top={90} delay={2000} colour="#00d4ff" title="HUA HIN WEATHER">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-hud)', fontSize: 32, fontWeight: 100, color: '#00d4ff', lineHeight: 1 }}>{weather.temp}°C</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(0,212,255,0.6)' }}>{WMO[weather.code] || weather.desc || ''}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,212,255,0.45)', lineHeight: 1.8 }}>
            <div>FEELS {weather.feels}°  ·  WIND {weather.wind} km/h</div>
            <div>RAIN {weather.rain}%</div>
          </div>
        </BootPanel>
      )}

      {/* Markets panel — top left, appears at 3s */}
      {markets && (
        <BootPanel side="left" top={90} delay={3000} colour="#f59e0b" title="GLOBAL MARKETS">
          {[
            { sym: 'S&P 500', val: markets.sp500,  chg: markets.sp500_chg  },
            { sym: 'ASX 200', val: markets.asx200, chg: markets.asx200_chg },
            { sym: 'BTC/USD', val: markets.btc,    chg: markets.btc_chg    },
            { sym: 'WTI OIL', val: markets.oil,    chg: markets.oil_chg    },
          ].map(t => {
            const up  = (t.chg ?? 0) >= 0;
            const col = up ? '#3dd68c' : '#ef4444';
            return (
              <div key={t.sym} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(245,158,11,0.55)' }}>{t.sym}</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontFamily: 'var(--font-hud)', fontSize: 11, color: '#b8d4e8', marginRight: 6 }}>
                    {t.val != null ? (t.val > 999 ? t.val.toLocaleString('en', { maximumFractionDigits: 0 }) : t.val.toFixed(2)) : '—'}
                  </span>
                  {t.chg != null && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: col }}>{up ? '+' : ''}{t.chg.toFixed(2)}%</span>}
                </div>
              </div>
            );
          })}
        </BootPanel>
      )}

      {/* News panel — right side below weather, appears at 4s */}
      {news.length > 0 && (
        <BootPanel side="right" top={260} delay={4000} colour="#c084fc" title="LIVE HEADLINES">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {news.slice(0, 4).map((h, i) => (
              <div key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(192,132,252,0.75)',
                lineHeight: 1.5,
                borderBottom: i < 3 ? '1px solid rgba(192,132,252,0.07)' : 'none',
                paddingBottom: 4,
              }}>
                <span style={{ color: 'rgba(192,132,252,0.35)', marginRight: 5 }}>{i + 1}.</span>{h}
              </div>
            ))}
          </div>
        </BootPanel>
      )}

      {/* Briefing text panel — left side below markets, appears at 5s */}
      {briefing && (
        <BootPanel side="left" top={310} delay={5000} colour="#3dd68c" title="MORNING BRIEFING">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(61,214,140,0.7)', lineHeight: 1.65, maxWidth: 280 }}>
            {briefing.slice(0, 260)}{briefing.length > 260 ? '...' : ''}
          </div>
        </BootPanel>
      )}

      {/* ── CENTRAL CONTENT ── */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 28, zIndex: 5, pointerEvents: 'none',
      }}>

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
            fontFamily: 'var(--font-hud)', fontSize: 44, fontWeight: 900,
            letterSpacing: 16, color: '#00d4ff',
            textShadow: '0 0 40px rgba(0,212,255,0.7), 0 0 80px rgba(0,212,255,0.3)',
            lineHeight: 1, minHeight: 52,
          }}>
            {title}
            {title.length < 6 && (
              <span style={{ animation: 'blink-cursor 0.8s step-end infinite', color: 'rgba(0,212,255,0.6)' }}>_</span>
            )}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 4, color: 'rgba(0,212,255,0.38)', marginTop: 8, minHeight: 14 }}>
            {subtitle}
          </div>
        </div>

        {/* Boot checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 300, minHeight: 160 }}>
          {lines.map((line, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5,
              animation: 'hudSlideIn 0.22s ease-out',
            }}>
              <span style={{ color: 'rgba(0,212,255,0.48)' }}>› {line.text}</span>
              <span style={{ color: line.colour, textShadow: `0 0 8px ${line.colour}`, fontSize: 9, letterSpacing: 2 }}>
                [ {line.status} ]
              </span>
            </div>
          ))}
        </div>

        {/* Status */}
        <div style={{
          fontFamily: 'var(--font-hud)', fontSize: 8, letterSpacing: 3,
          color: '#3dd68c', minHeight: 14,
          animation: statusMsg ? 'pulse-dot 2s ease-in-out infinite' : 'none',
        }}>
          {statusMsg}
        </div>

      </div>
    </div>
  );
}

// ── Positioned boot panel (appears at a set time) ────────────
function BootPanel({ side, top, delay, colour, title, children }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVis(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      position: 'absolute',
      [side === 'right' ? 'right' : 'left']: 44,
      top,
      background: 'rgba(2,10,18,0.9)',
      border: `1px solid ${colour}28`,
      borderRadius: 4,
      padding: '12px 16px',
      minWidth: 220,
      maxWidth: 310,
      zIndex: 8,
      pointerEvents: 'none',
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateX(0)' : `translateX(${side === 'right' ? '50px' : '-50px'})`,
      transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${colour}70, transparent)` }} />
      {/* Corner bracket TL */}
      <div style={{ position: 'absolute', top: 4, left: 4, width: 10, height: 10, borderTop: `1px solid ${colour}60`, borderLeft: `1px solid ${colour}60` }} />
      {/* Corner bracket BR */}
      <div style={{ position: 'absolute', bottom: 4, right: 4, width: 10, height: 10, borderBottom: `1px solid ${colour}60`, borderRight: `1px solid ${colour}60` }} />

      <div style={{
        fontFamily: 'var(--font-hud)', fontSize: 7, letterSpacing: 3,
        color: colour, opacity: 0.8, marginBottom: 8,
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{ width: 4, height: 4, borderRadius: '50%', background: colour, boxShadow: `0 0 4px ${colour}`, display: 'inline-block', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
        {title}
      </div>
      {children}
    </div>
  );
}
