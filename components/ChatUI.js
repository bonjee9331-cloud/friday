'use client';

import { useState, useRef, useEffect } from 'react';

const MODULES = [
  { id: null, label: 'General' },
  { id: 'bob', label: 'BOB Sales' },
  { id: 'autopilot', label: 'Jobs' },
  { id: 'tasks', label: 'Tasks' }
];

export default function ChatUI() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Friday here. What do you need?" }
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [module, setModule] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [listening, setListening] = useState(false);
  const [voiceReply, setVoiceReply] = useState(false);
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
      const res = await fetch('/api/friday/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          module,
          conversationId,
          history: messages.slice(-20)
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'brain error');
      setMessages((m) => [...m, { role: 'assistant', content: data.reply }]);
      if (data.conversationId) setConversationId(data.conversationId);
      if (voiceReply) speak(data.reply);
    } catch (err) {
      setMessages((m) => [...m, { role: 'error', content: String(err.message || err) }]);
    } finally {
      setBusy(false);
    }
  }

  function speak(text) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prefer an Aussie or English male voice if available
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
          <div className="chat-sub">One brain. Many bodies.</div>
        </div>
        <div className="module-pills">
          {MODULES.map((m) => (
            <button
              key={m.label}
              className={'pill ' + (module === m.id ? 'active' : '')}
              onClick={() => setModule(m.id)}
            >
              {m.label}
            </button>
          ))}
          <button
            className={'pill ' + (voiceReply ? 'active' : '')}
            onClick={() => setVoiceReply((v) => !v)}
            title="Speak replies aloud"
          >
            Voice {voiceReply ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      <div className="messages" ref={scrollRef}>
        {messages.map((m, i) => (
          <div key={i} className={'msg ' + m.role}>
            {m.content}
          </div>
        ))}
        {busy && <div className="msg assistant">...</div>}
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
          placeholder={module ? `Message Friday (${module} mode)` : 'Message Friday'}
          rows={1}
        />
        <button className="btn" onClick={() => send()} disabled={busy || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
