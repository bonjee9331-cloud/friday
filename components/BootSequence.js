'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const MUSIC_ID = 'XXswgVBbTjU';
const MUSIC_START = 200;
const MUSIC_END = 243;
const FADE_DURATION_MS = 2500;

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
  const playerRef = useRef(null);
  const audioContextRef = useRef(null);

  const [phase, setPhase] = useState(0);
  const [logLines, setLogLines] = useState([]);
  const [briefing, setBriefing] = useState('');
  const [musicFinished, setMusicFinished] = useState(false);
  const [briefingDone, setBriefingDone] = useState(false);

  // Load briefing
  useEffect(() => {
    fetch('/api/briefing')
      .then(r => r.json())
      .then(d => setBriefing(d?.briefing || ''))
      .catch(() => setBriefing(''));
  }, []);

  // Boot log animation
  useEffect(() => {
    let i = 0;

    const interval = setInterval(() => {
      if (i < BOOT_LOG.length) {
        setLogLines(prev => [...prev, BOOT_LOG[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  // Phase timing
  useEffect(() => {
    setTimeout(() => setPhase(1), 800);
    setTimeout(() => setPhase(2), 2500);
    setTimeout(() => setPhase(3), 5000);
    setTimeout(() => setPhase(4), 8000);
  }, []);

  // YouTube player with fade out
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player('yt-player', {
        height: '1',
        width: '1',
        videoId: MUSIC_ID,
        playerVars: {
          autoplay: 1,
          controls: 0,
          start: MUSIC_START,
          end: MUSIC_END,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(70);
            event.target.playVideo();

            const total = (MUSIC_END - MUSIC_START) * 1000;
            const fadeStart = total - FADE_DURATION_MS;

            setTimeout(() => {
              let volume = 70;

              const fade = setInterval(() => {
                volume -= 5;
                event.target.setVolume(Math.max(volume, 0));

                if (volume <= 0) {
                  clearInterval(fade);
                  event.target.stopVideo();
                  setMusicFinished(true);
                }
              }, 150);

            }, fadeStart);
          }
        }
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);

      window.onYouTubeIframeAPIReady = loadPlayer;
    } else {
      loadPlayer();
    }
  }, []);

  // Speak AFTER music finishes
  const speak = useCallback(async (text) => {
    if (!text) {
      setBriefingDone(true);
      return;
    }

    try {
      const res = await fetch('/api/friday/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const buffer = await res.arrayBuffer();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = ctx;

      const decoded = await ctx.decodeAudioData(buffer);
      const src = ctx.createBufferSource();

      src.buffer = decoded;
      src.connect(ctx.destination);
      src.start();

      src.onended = () => {
        setBriefingDone(true);
      };

    } catch {
      setBriefingDone(true);
    }
  }, []);

  useEffect(() => {
    if (phase >= 4 && musicFinished) {
      setTimeout(() => {
        speak(briefing);
      }, 500);
    }
  }, [phase, musicFinished, briefing, speak]);

  useEffect(() => {
    if (briefingDone) {
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  }, [briefingDone, onComplete]);

  return (
    <div style={{ background: '#000', color: '#00b4ff', height: '100vh', padding: 40 }}>
      <div id="yt-player" style={{ display: 'none' }} />

      {logLines.map((line, i) => (
        <div key={i}>
          {'> '} {line}
        </div>
      ))}
    </div>
  );
}
