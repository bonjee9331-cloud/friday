'use client';

import { useEffect, useRef, useState } from 'react';

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState([]);
  const tickerRef = useRef(null);

  useEffect(() => {
    const load = () =>
      fetch('/api/news')
        .then(r => r.json())
        .then(d => { if (Array.isArray(d?.headlines)) setHeadlines(d.headlines); })
        .catch(() => {});
    load();
    const id = setInterval(load, 15 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  if (!headlines.length) return null;

  const text = headlines.join('   ///   ') + '   ///   ';

  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:50,
      background:'rgba(11,13,18,0.95)',
      borderTop:'1px solid rgba(255,107,53,0.2)',
      height:28, overflow:'hidden',
      display:'flex', alignItems:'center',
    }}>
      <div style={{
        flexShrink:0, padding:'0 12px',
        fontSize:9, letterSpacing:3, color:'#ff6b35',
        fontFamily:'monospace', borderRight:'1px solid rgba(255,107,53,0.2)',
        whiteSpace:'nowrap',
      }}>
        NEWS
      </div>
      <div ref={tickerRef} style={{ overflow:'hidden', flex:1, position:'relative' }}>
        <div style={{
          display:'inline-block',
          whiteSpace:'nowrap',
          fontSize:10,
          letterSpacing:1,
          color:'rgba(255,107,53,0.7)',
          fontFamily:'monospace',
          animation:`ticker ${headlines.length * 8}s linear infinite`,
          paddingLeft:'100%',
        }}>
          {text}
        </div>
      </div>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
