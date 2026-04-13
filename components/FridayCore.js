'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

const MODULES = [
  { id: null, label: 'GENERAL' }, { id: 'bob', label: 'BOB OPS' },
  { id: 'autopilot', label: 'JOBS' }, { id: 'tasks', label: 'TASKS' },
];
const WAKE_PHRASES = ["daddy's home",'daddys home','daddy','hey friday','friday wake up'];
const C = {
  idle:       { ring: '#1a6fff' },
  waking:     { ring: '#ffffff' },
  listening:  { ring: '#00e5ff' },
  processing: { ring: '#ffb300' },
  speaking:   { ring: '#a97cff' },
};
const LABEL = { idle:'FRIDAY ONLINE — STANDING BY', waking:'INITIALISING...', listening:'LISTENING...', processing:'PROCESSING...', speaking:'SPEAKING...' };
const GREETINGS = ["Daddy's home. Friday is at your service, Boss.","Welcome back. Systems online.","Good to have you back. What are we doing?"];
const DEFAULT_MUSIC = 'https://www.youtube.com/embed/l482T0yNkeo?autoplay=1';

function hexRgb(hex){ const h=hex.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }

function playChime(ctx){
  if(!ctx) return;
  [[440,0],[554,0.2],[659,0.4],[880,0.62]].forEach(([freq,when])=>{
    const osc=ctx.createOscillator(); const gain=ctx.createGain();
    osc.type='sine'; osc.frequency.setValueAtTime(freq,ctx.currentTime+when);
    gain.gain.setValueAtTime(0,ctx.currentTime+when);
    gain.gain.linearRampToValueAtTime(0.18,ctx.currentTime+when+0.05);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+when+0.55);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(ctx.currentTime+when); osc.stop(ctx.currentTime+when+0.7);
  });
}

export default function FridayCore() {
  const [mode,    setMode]    = useState('idle');
  const [msgs,    setMsgs]    = useState([]);
  const [module,  setModule]  = useState(null);
  const [convId,  setConvId]  = useState(null);
  const [wakeOn,  setWakeOn]  = useState(false);
  const [input,   setInput]   = useState('');
  const [weather, setWeather] = useState(null);
  const [news,    setNews]    = useState([]);
  const [tickX,   setTickX]   = useState(0);
  const [showMus, setShowMus] = useState(false);
  const [musUrl,  setMusUrl]  = useState(DEFAULT_MUSIC);
  const [brief,   setBrief]   = useState('');
  const [showBrief,setShowBrief]=useState(false);

  const modeRef   =useRef('idle'); const msgsRef  =useRef([]); const convIdRef=useRef(null);
  const modRef    =useRef(null);   const clapBuf  =useRef([]);  const lastClap =useRef(0);
  const canvasRef =useRef(null);   const animRef  =useRef(null);const tRef    =useRef(0);
  const wakeRecRef=useRef(null);   const cmdRecRef=useRef(null);const audioCtxRef=useRef(null);
  const micRef    =useRef(null);

  useEffect(()=>{msgsRef.current=msgs;},[msgs]);
  useEffect(()=>{convIdRef.current=convId;},[convId]);
  useEffect(()=>{modRef.current=module;},[module]);

  function go(m){modeRef.current=m;setMode(m);}

  // Fetch weather + news on mount
  useEffect(()=>{
    fetch('/api/weather').then(r=>r.json()).then(d=>{if(!d.error)setWeather(d);}).catch(()=>{});
    fetch('/api/news').then(r=>r.json()).then(d=>{if(d.headlines?.length)setNews(d.headlines);}).catch(()=>{});
  },[]);

  // Ticker scroll
  useEffect(()=>{
    if(!news.length) return;
    let x=window.innerWidth*0.3;
    const iv=setInterval(()=>{ x-=0.7; if(x<-3000) x=window.innerWidth*0.3; setTickX(x); },16);
    return ()=>clearInterval(iv);
  },[news]);

  // Canvas
  useEffect(()=>{
    const cv=canvasRef.current; if(!cv) return;
    const ctx=cv.getContext('2d');
    function resize(){cv.width=cv.offsetWidth;cv.height=cv.offsetHeight;}
    resize(); const ro=new ResizeObserver(resize); ro.observe(cv);

    function hexGrid(t,col){
      const s=28,hw=s*1.732,hh=s*2;
      ctx.save(); ctx.globalAlpha=0.032; ctx.strokeStyle=col; ctx.lineWidth=0.5;
      for(let r=-1;r<cv.height/(hh*0.75)+2;r++){
        for(let c=-1;c<cv.width/hw+2;c++){
          const x=c*hw+(r%2)*(hw/2)+(t*0.055)%hw;
          const y=r*hh*0.75+(t*0.028)%hh;
          ctx.beginPath();
          for(let i=0;i<6;i++){const a=(Math.PI/3)*i-Math.PI/6; i===0?ctx.moveTo(x+s*Math.cos(a),y+s*Math.sin(a)):ctx.lineTo(x+s*Math.cos(a),y+s*Math.sin(a));}
          ctx.closePath(); ctx.stroke();
        }
      }
      ctx.restore();
    }

    function drawRings(cx,cy,t,m){
      const cc=C[m]||C.idle;
      const spd=m==='listening'?0.14:m==='processing'?0.09:0.022;
      const pulse=1+Math.sin(t*spd)*(m==='idle'?0.012:0.055);
      const [r2,g2,b2]=hexRgb(cc.ring);
      const halo=ctx.createRadialGradient(cx,cy,150,cx,cy,270);
      halo.addColorStop(0,`rgba(${r2},${g2},${b2},0.12)`); halo.addColorStop(1,'transparent');
      ctx.beginPath();ctx.arc(cx,cy,270,0,Math.PI*2);ctx.fillStyle=halo;ctx.fill();
      const boost=m==='processing'?10:m==='listening'?5:1;
      [{r:210,spd:0.0006,dash:[12,16],w:1,a:0.36},{r:165,spd:-0.001,dash:[6,12],w:1,a:0.46},
       {r:124,spd:0.0017,dash:[16,8],w:1.5,a:0.57},{r:84,spd:-0.0028,dash:[5,9],w:1.5,a:0.70},
       {r:50,spd:0.0048,dash:[3,5],w:2,a:0.85},{r:19,spd:-0.008,dash:[],w:2.5,a:1}]
      .forEach(d=>{
        ctx.save();ctx.translate(cx,cy);ctx.rotate(t*d.spd*boost);
        ctx.beginPath();ctx.arc(0,0,d.r*pulse,0,Math.PI*2);
        if(d.dash.length)ctx.setLineDash(d.dash);
        ctx.strokeStyle=cc.ring;ctx.globalAlpha=d.a;ctx.lineWidth=d.w;ctx.stroke();ctx.restore();
      });
      const og=ctx.createRadialGradient(cx,cy,0,cx,cy,22);
      og.addColorStop(0,'#ffffff');og.addColorStop(0.5,cc.ring);og.addColorStop(1,'transparent');
      ctx.save();ctx.globalAlpha=m==='idle'?0.7:1;
      ctx.beginPath();ctx.arc(cx,cy,22,0,Math.PI*2);ctx.fillStyle=og;ctx.fill();ctx.restore();
    }

    function dataNodes(cx,cy,t,col){
      const [r,g,b]=hexRgb(col);
      for(let i=0;i<8;i++){
        const angle=(t*0.007)+(i*Math.PI/4);
        const radius=240+Math.sin(t*0.02+i)*10;
        const nx=cx+Math.cos(angle)*radius; const ny=cy+Math.sin(angle)*radius;
        ctx.save(); ctx.beginPath(); ctx.arc(nx,ny,2.2,0,Math.PI*2);
        ctx.fillStyle=`rgba(${r},${g},${b},0.55)`; ctx.fill(); ctx.restore();
        ctx.save(); ctx.strokeStyle=`rgba(${r},${g},${b},0.07)`;
        ctx.lineWidth=0.5; ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(nx,ny); ctx.stroke(); ctx.restore();
      }
    }

    function brackets(col){
      const sz=22,pad=20,w=cv.width,h=cv.height;
      ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.globalAlpha=0.28;
      [[pad,pad,1,1],[w-pad,pad,-1,1],[pad,h-pad,1,-1],[w-pad,h-pad,-1,-1]].forEach(([x,y,dx,dy])=>{
        ctx.beginPath();ctx.moveTo(x,y+sz*dy);ctx.lineTo(x,y);ctx.lineTo(x+sz*dx,y);ctx.stroke();
      });
      ctx.restore();
    }

    function hud(x,y,label,value,col,align){
      ctx.save();ctx.textAlign=align||'left';
      ctx.font='600 8px monospace';ctx.fillStyle=col;ctx.globalAlpha=0.38;ctx.fillText(label,x,y);
      ctx.font='700 12px monospace';ctx.globalAlpha=0.65;ctx.fillText(value,x,y+16);
      ctx.restore();
    }

    let scanY=0;
    function frame(){
      tRef.current+=1; const t=tRef.current,m=modeRef.current;
      const w=cv.width,h=cv.height,cx=w/2,cy=h/2;
      const col=(C[m]||C.idle).ring; const [cr,cg,cb]=hexRgb(col);
      ctx.fillStyle='#050810';ctx.fillRect(0,0,w,h);
      hexGrid(t,col); drawRings(cx,cy,t,m); dataNodes(cx,cy,t,col);
      scanY=(scanY+0.55)%h;
      const sg=ctx.createLinearGradient(0,scanY-32,0,scanY+32);
      sg.addColorStop(0,'transparent');sg.addColorStop(0.5,`rgba(${cr},${cg},${cb},0.018)`);sg.addColorStop(1,'transparent');
      ctx.fillStyle=sg;ctx.fillRect(0,scanY-32,w,64);
      brackets(col);
      // Clock
      const now=new Date();
      const hh=String(now.getHours()).padStart(2,'0');
      const mm=String(now.getMinutes()).padStart(2,'0');
      const ss=String(now.getSeconds()).padStart(2,'0');
      const ds=now.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'});
      ctx.save();ctx.textAlign='center';
      ctx.font='bold 30px monospace';ctx.fillStyle=col;ctx.globalAlpha=0.52;
      ctx.fillText(`${hh}:${mm}:${ss}`,cx,cy-268);
      ctx.font='9px monospace';ctx.globalAlpha=0.3;
      ctx.fillText(ds.toUpperCase(),cx,cy-250);
      ctx.restore();
      // Side readouts
      hud(58,cy-45,'UPTIME',`${Math.floor(t/60)}M`,col,'left');
      hud(58,cy+5,'SESSION','ACTIVE',col,'left');
      hud(w-58,cy-45,'FRAME',String(t%9999).padStart(4,'0'),col,'right');
      hud(w-58,cy+5,'SYNC','100%',col,'right');
      ctx.globalAlpha=1;
      animRef.current=requestAnimationFrame(frame);
    }
    frame();
    return ()=>{ro.disconnect();cancelAnimationFrame(animRef.current);};
  },[]);

  // TTS
  const speak=useCallback(async(text)=>{
    go('speaking');
    try{
      const res=await fetch('/api/friday/voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
      if(res.ok){
        const blob=await res.blob(); const url=URL.createObjectURL(blob);
        const aud=new Audio(url);
        await new Promise(resolve=>{
          aud.onended=()=>{URL.revokeObjectURL(url);resolve();};
          aud.onerror=()=>{URL.revokeObjectURL(url);resolve();};
          aud.play().catch(resolve);
        });
      }else{await browserSpeak(text);}
    }catch{await browserSpeak(text);}
    go('idle');
  },[]);

  function browserSpeak(text){
    return new Promise(resolve=>{
      if(typeof window==='undefined'||!('speechSynthesis' in window)){resolve();return;}
      window.speechSynthesis.cancel();
      const u=new SpeechSynthesisUtterance(text);
      const vv=window.speechSynthesis.getVoices();
      const pick=vv.find(v=>/en-AU/i.test(v.lang))||vv.find(v=>/en-GB/i.test(v.lang));
      if(pick)u.voice=pick; u.rate=1.05; u.onend=resolve; u.onerror=resolve;
      window.speechSynthesis.speak(u);
    });
  }

  // Chat
  const sendMessage=useCallback(async(text)=>{
    const t=(text||'').trim(); if(!t) return;
    setMsgs(prev=>[...prev,{role:'user',content:t}]);
    go('processing');
    try{
      const res=await fetch('/api/friday/chat',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({message:t,module:modRef.current,conversationId:convIdRef.current,history:msgsRef.current.slice(-20)})});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error||'brain error');
      setMsgs(prev=>[...prev,{role:'assistant',content:data.reply}]);
      if(data.conversationId)setConvId(data.conversationId);
      await speak(data.reply);
    }catch(err){
      setMsgs(prev=>[...prev,{role:'error',content:String(err.message)}]);
      go('idle');
    }
  },[speak]);

  // Mic
  const startListening=useCallback(()=>{
    if(typeof window==='undefined') return;
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR) return;
    cmdRecRef.current?.abort(); go('listening');
    const rec=new SR(); rec.lang='en-AU'; rec.interimResults=false;
    rec.onend=()=>{if(modeRef.current==='listening')go('idle');};
    rec.onerror=()=>go('idle');
    rec.onresult=e=>sendMessage(e.results[0][0].transcript);
    cmdRecRef.current=rec; try{rec.start();}catch{}
  },[sendMessage]);
  function stopListening(){cmdRecRef.current?.stop();}

  // Wake sequence
  const onWake=useCallback(async()=>{
    if(modeRef.current!=='idle') return;
    go('waking');
    try{
      const actx=audioCtxRef.current||new(window.AudioContext||window.webkitAudioContext)();
      if(!audioCtxRef.current)audioCtxRef.current=actx;
      if(actx.state==='suspended')await actx.resume();
      playChime(actx);
    }catch{}
    try{
      const r=await fetch('/api/briefing');
      const d=await r.json();
      if(d.briefing){
        setBrief(d.briefing); setShowBrief(true);
        if(d.headlines?.length)setNews(d.headlines);
        await speak(d.briefing);
        setShowBrief(false);
      }else{await speak(GREETINGS[Math.floor(Math.random()*GREETINGS.length)]);}
    }catch{await speak(GREETINGS[Math.floor(Math.random()*GREETINGS.length)]);}
    startListening();
  },[speak,startListening]);

  // Wake word
  useEffect(()=>{
    if(!wakeOn){wakeRecRef.current?.abort();wakeRecRef.current=null;return;}
    if(typeof window==='undefined') return;
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR) return;
    function loop(){
      const rec=new SR(); rec.lang='en-AU'; rec.continuous=false; rec.interimResults=false;
      rec.onend=()=>{if(wakeRecRef.current&&modeRef.current==='idle')setTimeout(loop,300);};
      rec.onresult=e=>{
        const t=e.results[0][0].transcript.toLowerCase();
        if(WAKE_PHRASES.some(p=>t.includes(p)))onWake();
      };
      wakeRecRef.current=rec; try{rec.start();}catch{}
    }
    loop();
    return()=>{wakeRecRef.current?.abort();wakeRecRef.current=null;};
  },[wakeOn,onWake]);

  // Clap detection
  useEffect(()=>{
    let raf=null;
    async function init(){
      try{
        const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
        micRef.current=stream;
        const actx=new(window.AudioContext||window.webkitAudioContext)();
        audioCtxRef.current=actx;
        const an=actx.createAnalyser(); an.fftSize=256;
        actx.createMediaStreamSource(stream).connect(an);
        const buf=new Uint8Array(an.frequencyBinCount);
        function tick(){
          an.getByteTimeDomainData(buf);
          let peak=0; for(let i=0;i<buf.length;i++){const v=Math.abs(buf[i]-128);if(v>peak)peak=v;}
          if(peak>52){
            const now=Date.now();
            if(now-lastClap.current>80){
              lastClap.current=now; clapBuf.current.push(now);
              clapBuf.current=clapBuf.current.filter(x=>now-x<900);
              if(clapBuf.current.length>=2){clapBuf.current=[];if(modeRef.current==='idle')onWake();}
            }
          }
          raf=requestAnimationFrame(tick);
        }
        tick();
      }catch{}
    }
    init();
    return()=>{cancelAnimationFrame(raf);audioCtxRef.current?.close().catch(()=>{});micRef.current?.getTracks().forEach(t=>t.stop());};
  },[onWake]);

  // Render
  const col=(C[mode]||C.idle).ring;
  const label=LABEL[mode]||LABEL.idle;
  const tickerText=news.length?news.join('   │   '):'';

  return (
    <div style={{position:'fixed',top:0,bottom:0,right:0,left:240,background:'#050810',overflow:'hidden',zIndex:50,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,monospace"}}>
      <canvas ref={canvasRef} style={{position:'absolute',inset:0,width:'100%',height:'100%',display:'block'}}/>

      {/* Briefing overlay */}
      {showBrief&&(
        <div style={{position:'absolute',left:32,top:'50%',transform:'translateY(-50%)',width:340,zIndex:30,background:'rgba(5,8,16,0.93)',border:`1px solid ${col}40`,borderRadius:10,padding:'20px 22px',backdropFilter:'blur(10px)'}}>
          <div style={{fontSize:9,letterSpacing:3,color:col,opacity:0.6,marginBottom:8}}>DAILY BRIEFING</div>
          <div style={{fontSize:12,color:'#cce0ff',lineHeight:1.75}}>{brief}</div>
        </div>
      )}

      {/* Music player */}
      {showMus&&(
        <div style={{position:'absolute',right:32,top:72,zIndex:30,background:'rgba(5,8,16,0.95)',border:`1px solid ${col}40`,borderRadius:10,overflow:'hidden'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 12px',borderBottom:`1px solid ${col}20`}}>
            <span style={{fontSize:9,letterSpacing:2,color:col}}>MUSIC CONTROL</span>
            <button onClick={()=>setShowMus(false)} style={{background:'none',border:'none',color:col,cursor:'pointer',fontSize:16,lineHeight:1}}>x</button>
          </div>
          <div style={{padding:10}}>
            <input defaultValue={musUrl} onBlur={e=>setMusUrl(e.target.value)} placeholder='YouTube embed URL...'
              style={{width:340,background:'rgba(255,255,255,0.05)',border:`1px solid ${col}30`,borderRadius:6,padding:'6px 10px',color:'#ccc',fontSize:11,fontFamily:'inherit',marginBottom:8,display:'block'}}/>
            <iframe key={musUrl} src={musUrl} width='360' height='200' frameBorder='0' allow='autoplay;encrypted-media' style={{borderRadius:6,display:'block'}} title='Music'/>
          </div>
        </div>
      )}

      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',zIndex:10}}>

        {/* Top bar */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'18px 28px 0'}}>
          <div>
            <div style={{fontSize:9,letterSpacing:4,color:col,opacity:0.48,marginBottom:3}}>FRIDAY / D2MS / v5</div>
            <div style={{fontSize:11,letterSpacing:3,fontWeight:700,color:col,textShadow:`0 0 14px ${col}`,transition:'color 0.4s'}}>{label}</div>
            {weather&&(
              <div style={{fontSize:10,color:col,opacity:0.62,marginTop:4,letterSpacing:1}}> MELBOURNE  {weather.temp}°C  {weather.desc?.toUpperCase()}  💨 {weather.wind}km/h</div>
            )}
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'flex-end',alignItems:'center'}}>
            {MODULES.map(m=>(<button key={m.id||'gen'} onClick={()=>setModule(m.id)}
              style={{background:module===m.id?col:'transparent',color:module===m.id?'#000':col,border:`1px solid ${col}`,borderRadius:3,padding:'3px 10px',fontSize:9,letterSpacing:2,fontWeight:700,cursor:'pointer',transition:'all 0.2s'}}>
              {m.label}</button>))}
            <button onClick={()=>setShowMus(m=>!m)} style={{background:'transparent',color:col,border:`1px solid ${col}`,borderRadius:3,padding:'3px 10px',fontSize:9,letterSpacing:2,fontWeight:700,cursor:'pointer'}}>
              MUSIC</button>
          </div>
        </div>

        {/* Transcript */}
        <div style={{flex:1,position:'relative'}}>
          {msgs.length>0&&(
            <div style={{position:'absolute',right:32,top:0,bottom:0,width:310,display:'flex',flexDirection:'column',justifyContent:'flex-end',gap:8,paddingBottom:12,overflowY:'auto'}}>
              {msgs.slice(-7).map((m,i)=>(
                <div key={i} style={{
                  background:m.role==='user'?'rgba(26,111,255,0.07)':m.role==='error'?'rgba(255,92,108,0.07)':'rgba(169,124,255,0.07)',
                  border:`1px solid ${m.role==='user'?'rgba(26,111,255,0.2)':m.role==='error'?'rgba(255,92,108,0.28)':'rgba(169,124,255,0.2)'}`,
                  borderRadius:6,padding:'8px 12px',fontSize:11,lineHeight:1.55,
                  color:m.role==='user'?'#8ab4ff':m.role==='error'?'#ff9090':'#ccc'}}>
                  <div style={{fontSize:8,letterSpacing:2,opacity:0.38,marginBottom:3}}>{m.role==='user'?'YOU':m.role==='error'?'ERROR':'FRIDAY'}</div>
                  {m.content.length>260?m.content.slice(0,260)+'...':m.content}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* News ticker */}
        {news.length>0&&(
          <div style={{overflow:'hidden',whiteSpace:'nowrap',borderTop:`1px solid ${col}16`,borderBottom:`1px solid ${col}16`,padding:'5px 0',background:'rgba(26,111,255,0.025)',flexShrink:0}}>
            <span style={{display:'inline-block',transform:`translateX(${tickX}px)`,fontSize:10,letterSpacing:1.5,color:col,opacity:0.55,paddingLeft:40,willChange:'transform'}}>
              {tickerText}
            </span>
          </div>
        )}

        {/* Controls */}
        <div style={{padding:'10px 28px 22px'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
            <button onClick={()=>setWakeOn(w=>!w)} style={{background:wakeOn?col:'transparent',color:wakeOn?'#000':col,border:`1px solid ${col}`,borderRadius:3,padding:'4px 14px',fontSize:9,letterSpacing:2,fontWeight:700,cursor:'pointer'}}>{wakeOn?'◉ WAKE WORD ACTIVE':'○ WAKE WORD OFF'}</button>
            <span style={{fontSize:9,color:col,opacity:0.32,letterSpacing:1}}>SAY "DADDY'S HOME" OR DOUBLE-CLAP</span>
            <button onClick={onWake} style={{marginLeft:'auto',background:'transparent',color:col,border:`1px solid ${col}40`,borderRadius:3,padding:'4px 12px',fontSize:9,letterSpacing:2,cursor:'pointer'}}>WAKE NOW</button>
          </div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <button onMouseDown={startListening} onMouseUp={stopListening} onTouchStart={e=>{e.preventDefault();startListening();}} onTouchEnd={stopListening}
              style={{width:52,height:52,borderRadius:'50%',background:mode==='listening'?col:'transparent',border:`2px solid ${col}`,color:mode==='listening'?'#000':col,fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.2s',boxShadow:mode==='listening'?`0 0 24px ${col}`:'none'}}>
              {mode==='listening'?'⏹':'🎙'}</button>
            <div style={{flex:1,background:'rgba(255,255,255,0.025)',border:`1px solid ${col}18`,borderRadius:8,padding:'10px 14px'}}>
              <div style={{fontSize:8,letterSpacing:2,color:col,opacity:0.32,marginBottom:5}}>HOLD MIC OR TYPE</div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();const v=input.trim();if(v){sendMessage(v);setInput('');} }}}
                  placeholder={module?`Ask Friday [${module} mode]...`:'Ask Friday anything...'}
                  style={{flex:1,background:'transparent',border:'none',outline:'none',color:'#e8ecf3',fontSize:14,fontFamily:'inherit'}}/>
                <button onClick={()=>{const v=input.trim();if(v){sendMessage(v);setInput('');}}} disabled={!input.trim()||mode==='processing'}
                  style={{background:col,border:'none',borderRadius:4,padding:'5px 16px',color:'#000',fontSize:10,fontWeight:800,letterSpacing:1,cursor:'pointer',opacity:(!input.trim()||mode==='processing')?0.35:1}}>
                  SEND</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}