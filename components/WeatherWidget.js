'use client';

import { useEffect, useState } from 'react';

const WMO = {0:'Clear',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',51:'Drizzle',61:'Rain',65:'Heavy Rain',80:'Showers',95:'Storm'};

export default function WeatherWidget() {
  const [w, setW] = useState(null);

  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.json())
      .then(setW)
      .catch(() => {});
    const id = setInterval(() => {
      fetch('/api/weather').then(r => r.json()).then(setW).catch(() => {});
    }, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      fontSize:12, color:'rgba(255,107,53,0.8)',
      fontFamily:'monospace', letterSpacing:1,
      userSelect:'none',
    }}>
      {w ? (
        <>
          <span style={{ fontSize:18, fontWeight:100, color:'#ff6b35' }}>{w.temp}°C</span>
          <span style={{ color:'rgba(255,107,53,0.5)' }}>·</span>
          <span>{WMO[w.code] || w.desc || '—'}</span>
          <span style={{ color:'rgba(255,107,53,0.4)' }}>· HUA HIN</span>
        </>
      ) : (
        <span style={{ color:'rgba(255,107,53,0.4)' }}>WEATHER...</span>
      )}
    </div>
  );
}
