'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const MUSIC_ID = 'XXswgVBbTjU';
const MUSIC_START = 200;
const MUSIC_END = 243;
const MUSIC_DURATION_MS = (MUSIC_END - MUSIC_START) * 1000;
const FADE_DURATION_MS = 2500;
const START_VOLUME = 70;

const BOOT_LOG = [
  'FRIDAY OS v2.0 - INITIALISING...',
  'NEURAL NETWORK ONLINE',
  'VOICE SYNTHESIS READY',
  'CONNECTING TO LIVE DATA FEEDS...',
  'WEATHER MODULE     [ OK ]',
  'NEWS MODULE        [ OK ]',
  'BRIEFING ENGINE    [ OK ]',
  'MEMORY SYSTEMS     [ OK ]',
  'BOB SALES MODULE   [ OK ]',
  'SECURITY LAYER     [ ACTIVE ]',
  'ALL SYSTEMS NOMINAL',
  'GOOD MORNING, BEN.',
];

function safeIncludes(value, text) {
  return typeof value === 'string' && value.includes(text);
}

export default function BootSequence({ onComplete }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const playerRef = useRef(null);
  const audioContextRef = useRef(null);
  const playerContainerIdRef = useRef(`yt-player-${Math.random().toString(36).slice(2)}`);
  const phaseRef = useRef(0);

  const fadeTimeoutRef = useRef(null);
  const fadeIntervalRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const speakTimeoutRef = useRef(null);
  const bootCompleteTimeoutRef = useRef(null);

  const [phase, setPhase] = useState(0);
  const [logLines, setLogLines] = useState([]);
  const [weather, setWeather] = useState(null);
  const [news, setNews] = useState([]);
  const [briefing, setBriefing] = useState('');
  const [showData, setShowData] = useState(false);
  const [musicFinished, setMusicFinished] = useState(false);
  const [briefingDone, setBriefingDone] = useState(false);
  const [voiceStarted, setVoiceStarted] = useState(false);

  const markMusicFinished = useCallback(() => {
    setMusicFinished((prev) => prev || true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadWeather = async () => {
      try {
        const r = await fetch('/api/weather');
        const d = await r.json();
        if (!cancelled) setWeather(d || null);
      } catch (_) {
        if (!cancelled) setWeather(null);
      }
    };

    const loadNews = async () => {
      try {
        const r = await fetch('/api/news');
        const d = await r.json();
        if (!cancelled) {
          setNews(Array.isArray(d?.headlines) ? d.headlines : []);
        }
      } catch (_) {
        if (!cancelled) setNews([]);
      }
    };

    const loadBriefing = async () => {
      try {
        const r = await fetch('/api/briefing');
        const d = await r.json();
        if (!cancelled) {
          setBriefing(typeof d?.briefing === 'string' ? d.briefing : '');
        }
      } catch (_) {
        if (!cancelled) setBriefing('');
      }
    };

    loadWeather();
    loadNews();
    loadBriefing();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let i = 0;
    let timeoutId = null;

    const tick = () => {
      if (i < BOOT_LOG.length) {
        setLogLines((prev) => [...prev, BOOT_LOG[i]]);
        i += 1;
        timeoutId = window.setTimeout(tick, 350 + Math.random() * 200);
      }
    };

    timeoutId = window.setTimeout(tick, 1200);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => {
        phaseRef.current = 1;
        setPhase(1);
      }, 800),
      setTimeout(() => {
        phaseRef.current = 2;
        setPhase(2);
      }, 2500),
      setTimeout(() => {
        phaseRef.current = 3;
        setPhase(3);
      }, 5000),
      setTimeout(() => {
        phaseRef.current = 4;
        setPhase(4);
        setShowData(true);
      }, 8000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cancelled = false;

    const setupPlayer = () => {
      if (cancelled || playerRef.current || !window.YT || !window.YT.Player) return;

      const container = document.getElementById(playerContainerIdRef.current);
      if (!container) return;

      playerRef.current = new window.YT.Player(playerContainerIdRef.current, {
        height: '1',
        width: '1',
        videoId: MUSIC_ID,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          start: MUSIC_START,
          end: MUSIC_END,
        },
        events: {
          onReady: (event) => {
            try {
              event.target.setVolume(START_VOLUME);
              event.target.seekTo(MUSIC_START, true);
              event.target.playVideo();
            } catch (_) {
              markMusicFinished();
              return;
            }

            const fadeStartMs = Math.max(0, MUSIC_DURATION_MS - FADE_DURATION_MS);

            fadeTimeoutRef.current = window.setTimeout(() => {
              let volume = START_VOLUME;

              fadeIntervalRef.current = window.setInterval(() => {
                volume -= 5;

                try {
                  if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
                    playerRef.current.setVolume(Math.max(0, volume));
                  }
                } catch (_) {
                  // ignore
                }

                if (volume <= 0) {
                  if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

                  try {
                    if (playerRef.current && typeof playerRef.current.stopVideo === 'function') {
                      playerRef.current.stopVideo();
                    }
                  } catch (_) {
                    // ignore
                  }

                  markMusicFinished();
                }
              }, 180);
            }, fadeStartMs);

            finishTimeoutRef.current = window.setTimeout(() => {
              try {
                if (playerRef.current && typeof playerRef.current.stopVideo === 'function') {
                  playerRef.current.stopVideo();
                }
              } catch (_) {
                // ignore
              }

              markMusicFinished();
            }, MUSIC_DURATION_MS + 600);
          },
          onError: () => {
            markMusicFinished();
          },
          onStateChange: (event) => {
            if (event.data === 0) {
              markMusicFinished();
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'youtube-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
      }

      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === 'function') previousReady();
        setupPlayer();
      };
    }

    return () => {
      cancelled = true;
    };
  }, [markMusicFinished]);

  const speakWithBrowserVoice = useCallback((text) => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis || typeof text !== 'string' || !text.trim()) {
        resolve();
        return;
      }

      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        const voices = window.speechSynthesis.getVoices();
        const preferred =
          voices.find((v) => /female|zira|susan|aria|samantha|karen/i.test(v.name)) ||
          voices.find((v) => /en-au|en-gb|en-us/i.test(v.lang)) ||
          null;

        if (preferred) utterance.voice = preferred;

        window.speechSynthesis.speak(utterance);
      } catch (_) {
        resolve();
      }
    });
  }, []);

  const speak = useCallback(
    async (text) => {
      if (voiceStarted) return;

      setVoiceStarted(true);

      if (typeof text !== 'string' || !text.trim()) {
        setBriefingDone(true);
        return;
      }

      try {
        const res = await fetch('/api/friday/voice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (!res.ok) {
          await speakWithBrowserVoice(text);
          setBriefingDone(true);
          return;
        }

        const buf = await res.arrayBuffer();
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) {
          await speakWithBrowserVoice(text);
          setBriefingDone(true);
          return;
        }

        const ac = new AudioContextClass();
        audioContextRef.current = ac;

        const decoded = await ac.decodeAudioData(buf.slice(0));
        const src = ac.createBufferSource();
        src.buffer = decoded;
        src.connect(ac.destination);
        src.start(0);

        src.onended = async () => {
          setBriefingDone(true);
          try {
            await ac.close();
          } catch (_) {
            // ignore
          }
        };
      } catch (_) {
        await speakWithBrowserVoice(text);
        setBriefingDone(true);
      }
    },
    [speakWithBrowserVoice, voiceStarted]
  );

  useEffect(() => {
    if (phase < 4 || !musicFinished || voiceStarted) return;

    const text =
      typeof briefing === 'string' && briefing.trim()
        ? briefing
        : 'Good morning Ben. All systems are online and ready.';

    speakTimeoutRef.current = window.setTimeout(() => {
      speak(text);
    }, 400);

    return () => {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
    };
  }, [phase, musicFinished, briefing, speak, voiceStarted]);

  useEffect(() => {
    if (briefingDone && phase >= 4) {
      bootCompleteTimeoutRef.current = window.setTimeout(() => {
        onComplete();
      }, 1500);

      return () => {
        if (bootCompleteTimeoutRef.current) clearTimeout(bootCompleteTimeoutRef.current);
      };
    }
  }, [briefingDone, phase, onComplete]);

  useEffect(() => {
    const hardStop = window.setTimeout(() => {
      setBriefingDone(true);
    }, 30000);

    return () => clearTimeout(hardStop);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);

    const draw = () => {
      t += 1;
      const ph = phaseRef.current;
      const cx = w / 2;
      const cy = h / 2;

      ctx.fillStyle = ph < 2 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,10,0.12)';
      ctx.fillRect(0, 0, w, h);

      if (ph >= 1) {
        const HEX = 34;
        const cols = Math.ceil(w / (HEX * 1.5)) + 2;
        const rows = Math.ceil(h / (HEX * 1.732)) + 2;
        const gridAlpha = Math.min(1, (ph - 1) * 0.4) * 0.06;

        for (let col = -1; col < cols; col += 1) {
          for (let row = -1; row < rows; row += 1) {
            const px = col * HEX * 1.5;
            const py = row * HEX * 1.732 + (col % 2 ? HEX * 0.866 : 0);
            const dist = Math.hypot(px - cx, py - cy);
            const pulse = Math.sin(t * 0.01 - dist * 0.006) * 0.5 + 0.5;

            ctx.strokeStyle = `rgba(0,120,255,${gridAlpha + pulse * 0.03})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();

            for (let k = 0; k < 6; k += 1) {
              const ang = (k * Math.PI) / 3;
              const hx = px + HEX * 0.85 * Math.cos(ang);
              const hy = py + HEX * 0.85 * Math.sin(ang);
              if (k === 0) ctx.moveTo(hx, hy);
              else ctx.lineTo(hx, hy);
            }

            ctx.closePath();
            ctx.stroke();
          }
        }
      }

      if (ph >= 2) {
        for (let i = 0; i < 8; i += 1) {
          const r = 60 + i * 90 + (t % 200) * 1.5;
          const alp = Math.max(0, 0.15 - r / 1200);
          ctx.strokeStyle = `rgba(0,200,255,${alp})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, r % Math.max(w, h), 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      if (ph >= 3) {
        const nodeCount = 8;
        const orbitR = 180;

        ctx.strokeStyle = 'rgba(0,180,255,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, orbitR, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < nodeCount; i += 1) {
          const ang = (i / nodeCount) * Math.PI * 2 + t * 0.008;
          const nx = cx + orbitR * Math.cos(ang);
          const ny = cy + orbitR * Math.sin(ang);

          ctx.fillStyle = 'rgba(0,220,255,0.8)';
          ctx.shadowColor = '#00eaff';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(nx, ny, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      const scanY = (t * 3) % h;
      const grad = ctx.createLinearGradient(0, scanY - 60, 0, scanY + 10);
      grad.addColorStop(0, 'rgba(0,180,255,0)');
      grad.addColorStop(1, 'rgba(0,180,255,0.04)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 60, w, 70);

      const bLen = 28;
      ctx.strokeStyle = 'rgba(0,180,255,0.5)';
      ctx.lineWidth = 1.5;

      [
        [0, 0, 1, 1],
        [w, 0, -1, 1],
        [0, h, 1, -1],
        [w, h, -1, -1],
      ].forEach(([bx, by, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(bx + dx * bLen, by);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx, by + dy * bLen);
        ctx.stroke();
      });

      if (ph >= 1) {
        ctx.font = `300 ${ph >= 2 ? '36' : '48'}px monospace`;
        ctx.fillStyle = 'rgba(0,200,255,1)';
        ctx.shadowColor = '#00b4ff';
        ctx.shadowBlur = 30;
        ctx.textAlign = 'center';

        const yPos = ph >= 3 ? 60 : cy - 20;
        ctx.fillText('FRIDAY', cx, yPos);

        ctx.shadowBlur = 0;
        ctx.font = '300 10px monospace';
        ctx.fillStyle = 'rgba(0,160,255,0.6)';
        ctx.fillText('PERSONAL AI v2.0', cx, yPos + 24);
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-AU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      ctx.font = '300 12px monospace';
      ctx.fillStyle = 'rgba(0,180,255,0.5)';
      ctx.textAlign = 'right';
      ctx.fillText(timeStr, w - 20, h - 20);
      ctx.textAlign = 'left';

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      if (bootCompleteTimeoutRef.current) clearTimeout(bootCompleteTimeoutRef.current);

      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch (_) {
          // ignore
        }
      }

      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (_) {
          // ignore
        }
      }

      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          window.speechSynthesis.cancel();
        } catch (_) {
          // ignore
        }
      }
    };
  }, []);

  const wmoDesc = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    51: 'Light Drizzle',
    61: 'Light Rain',
    63: 'Moderate Rain',
    71: 'Light Snow',
    80: 'Rain Showers',
    95: 'Thunderstorm',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#000010',
        overflow: 'hidden',
        fontFamily: 'monospace',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />

      <div
        id={playerContainerIdRef.current}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          opacity: 0.01,
          top: 0,
          left: 0,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 40,
          zIndex: 10,
          color: '#00b4ff',
          fontSize: 11,
          letterSpacing: 2,
          lineHeight: 1.9,
          maxWidth: 340,
          opacity: phase >= 1 ? 1 : 0,
          transition: 'opacity 1s',
        }}
      >
        {logLines.map((line, i) => (
          <div
            key={i}
            style={{
              color:
                safeIncludes(line, 'NOMINAL') || safeIncludes(line, 'BEN')
                  ? '#00ffaa'
                  : safeIncludes(line, 'OK')
                    ? '#00c8ff'
                    : 'rgba(0,180,255,0.7)',
              animationName: 'fadeIn',
              animationDuration: '0.4s',
            }}
          >
            <span style={{ color: 'rgba(0,180,255,0.4)', marginRight: 8 }}>{'>'}</span>
            {line}
          </div>
        ))}
      </div>

      {showData && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: 80,
              right: 40,
              border: '1px solid rgba(0,180,255,0.3)',
              background: 'rgba(0,10,30,0.85)',
              padding: '16px 20px',
              borderRadius: 4,
              color: '#00b4ff',
              minWidth: 220,
              animationName: 'slideInRight',
              animationDuration: '0.8s',
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: 4, marginBottom: 10, color: 'rgba(0,180,255,0.6)' }}>
              MELBOURNE WEATHER
            </div>

            {weather ? (
              <div>
                <div style={{ fontSize: 32, fontWeight: 100 }}>
                  {typeof weather?.temp === 'number' || typeof weather?.temp === 'string' ? weather.temp : '--'}°C
                </div>
                <div style={{ fontSize: 11, marginTop: 4, color: '#00eaff' }}>
                  {wmoDesc[weather?.code] || weather?.desc || 'Unavailable'}
                </div>
                <div style={{ fontSize: 10, marginTop: 8, color: 'rgba(0,180,255,0.6)' }}>
                  Feels {weather?.feels ?? '--'}°C · Wind {weather?.wind ?? '--'}km/h
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 10, color: 'rgba(0,180,255,0.5)' }}>LOADING...</div>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              top: 260,
              right: 40,
              border: '1px solid rgba(0,180,255,0.25)',
              background: 'rgba(0,10,30,0.85)',
              padding: '14px 18px',
              borderRadius: 4,
              color: '#00b4ff',
              width: 300,
              animationName: 'slideInRight',
              animationDuration: '1s',
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: 4, marginBottom: 10, color: 'rgba(0,180,255,0.6)' }}>
              LIVE HEADLINES
            </div>

            {news.length > 0 ? (
              news.slice(0, 5).map((h, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 10,
                    lineHeight: 1.6,
                    borderBottom: i < 4 ? '1px solid rgba(0,180,255,0.1)' : 'none',
                    paddingBottom: 6,
                    marginBottom: 6,
                    color: 'rgba(0,210,255,0.85)',
                  }}
                >
                  <span style={{ color: 'rgba(0,180,255,0.4)', marginRight: 6 }}>{i + 1}.</span>
                  {typeof h === 'string' ? h : 'Headline unavailable'}
                </div>
              ))
            ) : (
              <div style={{ fontSize: 10, color: 'rgba(0,180,255,0.5)' }}>LOADING...</div>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 200,
              left: '50%',
              transform: 'translateX(-50%)',
              fontSize: 11,
              letterSpacing: 3,
              color: '#00ffaa',
              animationName: 'pulse',
              animationDuration: '2s',
              animationIterationCount: 'infinite',
              whiteSpace: 'nowrap',
            }}
          >
            {briefingDone
              ? 'BRIEFING COMPLETE LAUNCHING FRIDAY'
              : musicFinished
                ? 'DELIVERING MORNING BRIEFING...'
                : 'INITIALISING CINEMATIC INTRO...'}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
