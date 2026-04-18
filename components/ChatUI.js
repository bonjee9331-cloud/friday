'use client';

import { useState, useRef, useEffect } from 'react';
import AgentPanel from './AgentPanel';
import { authedFetch } from '../lib/client-auth';

export default function ChatUI() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Friday here. What do you need?", agent: 'BOB' }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [module, setModule] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [listening, setListening] = useState(false);
  const [voiceReply, setVoiceReply] = useState(false);
  const [activeAgent, setActiveAgent] = useState('BOB');
  const [forcedAgent, setForcedAgent] = useState(null);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, busy]);

  async function send(textOverride) {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setBusy(true);
    try {
      const res = await authedFetch('/api/friday/agent', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          module,
          conversationId,
          history: messages.slice(-20),
          agentKey: forcedAgent
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'brain error');
      const respondingAgent = data.agentKey || 'BOB';
      setActiveAgent(respondingAgent);
      setMessages((m) => [...m, {
        role: 'assistant',
        content: data.reply,
        agent: respondingAgent,
        agentName: data.agentName,
        agentColour: data.agentColour
      }]);
      if (data.conversationId) setConversationId(data.conversationId);
      if (voiceReply) speakWithAgent(data.reply, data.voiceId);
    } catch (err) {
      setMessages((m) => [...m, { role: 'error', content: String(err.message || err) }]);
    } finally {
      setBusy(false);
    }
  }

  function handleSelectAgent(agentKey) {
    setForcedAgent(agentKey);
    setActiveAgent(agentKey);
  }

  async function speakWithAgent(text, voiceId) {
    try {
      const res = await authedFetch('/api/friday/voice', {
        method: 'POST',
        body: JSON.stringify({ text, history: messages.slice(-6) })
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch {
      // Fall back to browser TTS
      speak(text);
    }
  }

  function speak(text) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((v) => /en-AU/i.test(v.lang)) ||
                      voices.find((v) => /en-GB/i.test(v.lang)) ||
                      voices.find((v) => /en-US/i.test(v.lang));
    if (preferred) u.voice = preferred;
    u.rate = 1.05;
    u.pitch = 1.0;
    window.speechSynthesis.speak(u);
  }

  function toggleMic() {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Speech recognition not supported on this browser. Try Chrome or Edge.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = 'en-AU';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      send(transcript);
    };
    recognitionRef.current = rec;
    rec.start();
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="chat-wrap">
      <div className="chat-header">
        <div>
          <div className="chat-title">Friday</div>
          <div className="chat-sub">Multi-agent. One brain.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className={'pill ' + (voiceReply ? 'active' : '')}
            onClick={() => setVoiceReply((v) => !v)}
            title="Speak replies aloud"
          >
            Voice {voiceReply ? 'On' : 'Off'}
          </button>
          {forcedAgent && (
            <button className="pill" onClick={() => { setForcedAgent(null); setActiveAgent('BOB'); }}>
              ✕ Unlock routing
            </button>
          )}
        </div>
      </div>

      {/* Agent roster */}
      <div style={{ padding: '8px 0 4px' }}>
        <AgentPanel activeAgent={activeAgent} onSelectAgent={handleSelectAgent} />
      </div>

      <div className="messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={'msg ' + m.role} style={
            m.role === 'assistant' && m.agentColour
              ? { borderLeft: `3px solid ${m.agentColour}`, paddingLeft: 8 }
              : {}
          }>
            {m.role === 'assistant' && m.agentName && (
              <div style={{ fontSize: 10, color: m.agentColour || 'var(--text-dim)', marginBottom: 2, fontWeight: 700, letterSpacing: 1 }}>
                {m.agentName}
              </div>
            )}
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="msg assistant" style={{ borderLeft: `3px solid var(--text-dim)`, paddingLeft: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 2 }}>{activeAgent}</div>
            ...
          </div>
        )}
      </div>

      <div className="composer">
        <button
          type="button"
          className={'btn btn-mic ' + (listening ? 'listening' : '')}
          onClick={toggleMic}
          title="Hold to talk"
        >
          {listening ? '\u25FC' : '\u25CF'}
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={forcedAgent ? `Talking to ${forcedAgent}...` : 'Message Friday — routes automatically'}
          rows={1}
        />
        <button className="btn" onClick={() => send()} disabled={busy || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
