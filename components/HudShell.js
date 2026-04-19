'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';

const HudTopbar    = dynamic(() => import('./HudTopbar'),    { ssr: false });
const HudRail      = dynamic(() => import('./HudRail'),      { ssr: false });
const NewsTicker   = dynamic(() => import('./NewsTicker'),   { ssr: false });
const IntelOverlay = dynamic(() => import('./IntelOverlay'), { ssr: false });

const MAP_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MAP_URL) ||
  'https://embed.windy.com/embed2.html?lat=-12.9&lon=100.2&zoom=3&level=surface&overlay=temp&menu=&message=&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1';

export default function HudShell({ children }) {
  const [mode, setMode] = useState('cockpit');

  // Persist mode and broadcast to FridayApp
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const saved = localStorage.getItem('friday_mode');
    if (saved === 'thread' || saved === 'cockpit') setMode(saved);
  }, []);

  const handleModeChange = useCallback((m) => {
    setMode(m);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('friday_mode', m);
    }
    window.dispatchEvent(new CustomEvent('friday-mode', { detail: m }));
  }, []);

  return (
    <>
      {/* ── WorldMonitor / Windy background ── */}
      <div className="map-background">
        <iframe
          src={MAP_URL}
          title="live-map"
          sandbox="allow-scripts allow-same-origin allow-forms"
          loading="lazy"
        />
      </div>
      <div className="map-hud-overlay" />

      {/* ── HUD chrome ── */}
      <HudTopbar mode={mode} onModeChange={handleModeChange} />
      <HudRail />

      {/* ── Main content ── */}
      <div className="hud-shell">
        {children}
      </div>

      {/* ── Overlays ── */}
      <IntelOverlay />
      <NewsTicker />
    </>
  );
}
