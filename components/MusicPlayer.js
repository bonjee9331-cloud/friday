'use client';

import { useState, useRef, useCallback } from 'react';

const TRACKS = [
  { title: 'AMBIENT · HUD SYNC',   id: '1ZYbU82uhe8' },
  { title: 'NEURAL · DEEP FOCUS',  id: 'jfKfPfyJRdk' },
  { title: 'TACTICAL · RECON',     id: 'n61ULEU7CO0' },
  { title: 'IRON · SCORE',         id: 'aHjpOzsQ9YI' },
];

const BAR_HEIGHTS = [3, 6, 9, 7, 12, 8, 5, 10, 7, 4, 9, 6];

export default function MusicPlayer() {
  const [expanded, setExpanded] = useState(false);
  const [playing,  setPlaying]  = useState(false);
  const [muted,    setMuted]    = useState(true);
  const [trackIdx, setTrackIdx] = useState(0);
  const iframeKey = useRef(0);

  const track = TRACKS[trackIdx];
  const ytSrc = `https://www.youtube.com/embed/${track.id}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${track.id}&controls=0&showinfo=0&rel=0&iv_load_policy=3`;

  const prevTrack = useCallback(() => {
    setTrackIdx(i => (i - 1 + TRACKS.length) % TRACKS.length);
    iframeKey.current++;
  }, []);

  const nextTrack = useCallback(() => {
    setTrackIdx(i => (i + 1) % TRACKS.length);
    iframeKey.current++;
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying(p => !p);
    iframeKey.current++;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted(m => !m);
    iframeKey.current++;
  }, []);

  return (
    <div className="music-player" style={{ width: expanded ? 250 : 140 }}>
      {/* collapsed bar */}
      <div className="music-player-bar" onClick={() => setExpanded(e => !e)}>
        <div className="vis-bars">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="vis-bar"
              style={{
                height: playing ? h : 2,
                background: playing ? 'var(--hud-cyan)' : 'rgba(0,212,255,0.3)',
                boxShadow: playing ? '0 0 4px var(--hud-cyan)' : 'none',
                animation: playing ? `hudVisBeat ${0.35 + i * 0.04}s ease-in-out infinite` : 'none',
                animationDelay: `${i * 0.045}s`,
                transition: 'height 0.3s ease, background 0.3s ease',
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 7, letterSpacing: 2, color: playing ? 'var(--hud-cyan)' : 'rgba(0,212,255,0.45)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {playing ? track.title.slice(0, expanded ? 22 : 11) : 'SOUND SYS'}
        </span>
        <span style={{ fontSize: 8, color: 'rgba(0,212,255,0.4)', fontFamily: 'var(--font-mono)' }}>
          {expanded ? '▾' : '▸'}
        </span>
      </div>

      {/* expanded panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid rgba(0,212,255,0.1)', padding: '8px 10px' }}>
          {/* YouTube iframe — always in DOM when playing so it doesn't stop */}
          <div style={{
            width: '100%', height: playing ? 80 : 0,
            overflow: 'hidden', borderRadius: 3,
            border: playing ? '1px solid rgba(0,212,255,0.12)' : 'none',
            marginBottom: playing ? 8 : 0,
            transition: 'height 0.2s ease',
          }}>
            {playing && (
              <iframe
                key={`${iframeKey.current}-${trackIdx}`}
                src={ytSrc}
                width="100%"
                height="100%"
                allow="autoplay; encrypted-media"
                style={{ border: 'none', display: 'block' }}
                title="ambient"
              />
            )}
          </div>

          {/* controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={prevTrack} style={btnStyle}>◄</button>
            <button onClick={togglePlay} style={{ ...btnStyle, background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: 'var(--hud-cyan)', padding: '3px 12px', borderRadius: 3 }}>
              {playing ? '⏸' : '▶'}
            </button>
            <button onClick={nextTrack} style={btnStyle}>►</button>
            <button onClick={toggleMute} style={{ ...btnStyle, marginLeft: 'auto', color: muted ? 'rgba(0,212,255,0.3)' : 'var(--hud-cyan)' }}>
              {muted ? '🔇' : '🔊'}
            </button>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'rgba(0,212,255,0.3)', marginTop: 6, letterSpacing: 1 }}>
            {trackIdx + 1}/{TRACKS.length} · {track.title}
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: 'rgba(0,212,255,0.5)',
  fontSize: 10,
  fontFamily: 'var(--font-mono)',
  padding: '2px 4px',
};
