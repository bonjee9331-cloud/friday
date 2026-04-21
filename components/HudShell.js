'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const HudTopbar    = dynamic(() => import('./HudTopbar'),    { ssr: false });
const HudRail      = dynamic(() => import('./HudRail'),      { ssr: false });
const NewsTicker   = dynamic(() => import('./NewsTicker'),   { ssr: false });
const IntelOverlay = dynamic(() => import('./IntelOverlay'), { ssr: false });
const MusicPlayer  = dynamic(() => import('./MusicPlayer'),  { ssr: false });
const GodsEye      = dynamic(() => import('./GodsEye'),      { ssr: false });

const MAP_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MAP_URL) ||
  'https://embed.windy.com/embed2.html?lat=-12.9&lon=100.2&zoom=3&level=surface&overlay=temp&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1';

// ── Hex grid canvas ───────────────────────────────────────────────────────────
function HexCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const draw = () => {
      cv.width  = window.innerWidth;
      cv.height = window.innerHeight;
      const ctx = cv.getContext('2d');
      const size = 30;
      const colW = size * 1.5;
      const rowH = Math.sqrt(3) * size;
      ctx.strokeStyle = 'rgba(0,212,255,0.052)';
      ctx.lineWidth   = 0.75;
      for (let col = -1; col * colW < cv.width + size * 2; col++) {
        for (let row = -1; row * rowH < cv.height + rowH; row++) {
          const x = col * colW;
          const y = row * rowH + (col % 2 !== 0 ? rowH / 2 : 0);
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a  = (Math.PI / 3) * i - Math.PI / 6;
            const px = x + size * Math.cos(a);
            const py = y + size * Math.sin(a);
            i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
    };
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, []);
  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed', inset: 0, zIndex: 2,
        pointerEvents: 'none',
        animation: 'hudHexBreathe 10s ease-in-out infinite',
      }}
    />
  );
}

// ── Moving scan line ──────────────────────────────────────────────────────────
function ScanLine() {
  return (
    <div
      style={{
        position: 'fixed',
        left: 0, right: 0,
        height: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.4) 15%, rgba(0,212,255,0.95) 50%, rgba(0,212,255,0.4) 85%, transparent 100%)',
        boxShadow: '0 0 10px 1px rgba(0,212,255,0.4)',
        zIndex: 9996,
        pointerEvents: 'none',
        animation: 'hudScanDrop 14s linear infinite',
      }}
    />
  );
}

// ── HudShell ─────────────────────────────────────────────────────────────────
export default function HudShell({ children }) {
  const [mode,     setMode]     = useState('cockpit');
  const [godsEye,  setGodsEye]  = useState(false);

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem('friday_mode');
    if (saved === 'thread' || saved === 'cockpit') setMode(saved);
  }, []);

  const handleModeChange = useCallback((m) => {
    setMode(m);
    if (typeof localStorage !== 'undefined') localStorage.setItem('friday_mode', m);
    window.dispatchEvent(new CustomEvent('friday-mode', { detail: m }));
  }, []);

  const handleGodsEyeOpen  = useCallback(() => setGodsEye(true),  []);
  const handleGodsEyeClose = useCallback(() => setGodsEye(false), []);

  return (
    <>
      {/* ── World map background ── */}
      <div className="map-background">
        <iframe
          src={MAP_URL}
          title="live-map"
          sandbox="allow-scripts allow-same-origin allow-forms"
          loading="lazy"
        />
      </div>
      <div className="map-hud-overlay" />

      {/* ── Hex grid overlay ── */}
      <HexCanvas />

      {/* ── HUD chrome ── */}
      <HudTopbar
        mode={mode}
        onModeChange={handleModeChange}
        godsEyeActive={godsEye}
        onGodsEyeToggle={handleGodsEyeOpen}
      />
      <HudRail />

      {/* ── Animated scan line ── */}
      <ScanLine />

      {/* ── Main content ── */}
      <div className="hud-shell">
        {children}
      </div>

      {/* ── Overlays ── */}
      <IntelOverlay />
      <NewsTicker />

      {/* ── Music player ── */}
      <MusicPlayer />

      {/* ── Gods Eye world monitor ── */}
      {godsEye && <GodsEye onClose={handleGodsEyeClose} />}
    </>
  );
}
