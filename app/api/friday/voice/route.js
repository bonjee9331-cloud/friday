// POST /api/friday/voice
// Routes through multi-agent router, then TTS via ElevenLabs
// Body: { text: string, history?: [], module?: string }
// Returns: audio/mpeg with headers X-Agent-Name, X-Agent-Key, X-Agent-Colour, X-Agent-Reply

export const runtime = 'nodejs';

import { routeMessage } from '../../../../lib/agents/router.js';
import { askFridayWithSystem } from '../../../../lib/brain.js';
import { isAuthorized, unauthorized } from '../../../../lib/auth.js';

export async function POST(request) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const body = await request.json();
    const { text, history = [], module = null } = body;
    if (!text) return new Response('text required', { status: 400 });

    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return new Response('ELEVENLABS_API_KEY not set', { status: 503 });

    // Route to correct agent
    const { agentKey, agent, systemPrompt, voiceId } = await routeMessage({ message: text, history, module });

    // Get LLM reply using routed agent's system prompt
    let replyText = text;
    try {
      const { reply } = await askFridayWithSystem({ userMessage: text, history, systemPrompt });
      replyText = reply;
    } catch (_) {
      // Fall back to TTS of original text if LLM fails
    }

    // Call ElevenLabs TTS
    const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': key
      },
      body: JSON.stringify({
        text: replyText,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      })
    });

    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      return new Response(`ElevenLabs error: ${err}`, { status: 500 });
    }

    return new Response(ttsRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'X-Agent-Name': agent.name,
        'X-Agent-Key': agentKey,
        'X-Agent-Role': agent.role,
        'X-Agent-Colour': agent.colour,
        'X-Agent-Reply': encodeURIComponent(replyText.slice(0, 500)),
        'Access-Control-Expose-Headers': 'X-Agent-Name, X-Agent-Key, X-Agent-Role, X-Agent-Colour, X-Agent-Reply'
      }
    });
  } catch (err) {
    return new Response(String(err.message || err), { status: 500 });
  }
}
