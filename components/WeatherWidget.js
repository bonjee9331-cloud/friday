'use client';

import { useEffect, useState } from 'react';

const WMO = {0:'CLEAR',1:'MOSTLY CLR',2:'PARTLY CLD',3:'OVERCAST',45:'FOGGY',51:'DRIZZLE',61:'RAIN',65:'HVY RAIN',80:'SHOWERS',95:'STORM'};

export default function WeatherWidget() {
  const [w, setW] = useState(null);

  useEffect(() => {
    const load = () => fetch('/api/weather').then(r => r.json()).then(setW).catch(() => {});
    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!w) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '5px 14px',
      background: 'rgba(4,12,20,0.9)',
      border: '1px solid rgba(0,212,255,0.15)',
      borderRadius: 3,
      backdropFilter: 'blur(10px)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Corner accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 8, height: 8, borderTop: '1px solid rgba(0,212,255,0.5)', borderLeft: '1px solid rgba(0,212,255,0.5)' }} />
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderBottom: '1px solid rgba(0,212,255,0.5)', borderRight: '1px solid rgba(0,212,255,0.5)' }} />

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: 18, fontWeight: 700, color: 'var(--cyan)', lineHeight: 1, textShadow: '0 0 16px rgba(0,212,255,0.5)' }}>
          {w.temp}°C
        </div>
      </div>
      <div style={{ width: 1, height: 24, background: 'rgba(0,212,255,0.2)' }} />
      <div>
        <div style={{ fontFamily: 'var(--font-hud)', fontSize: 9, letterSpacing: 2, color: 'var(--text-dim)' }}>
          {WMO[w.code] || (w.desc || '').toUpperCase()}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,212,255,0.4)', marginTop: 1 }}>
          HUA HIN · TH {w.wind ? `· ${w.wind}KM/H` : ''}
        </div>
      </div>
    </div>
  );
}
