// POST /api/friday/voice
// ElevenLabs TTS passthrough. Used by the web chat when voice mode is on
// and the user wants premium voice instead of the browser default.
// Body: { text: string }
// Returns: audio/mpeg stream

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text) return new Response('text required', { status: 400 });

    const key = process.env.ELEVENLABS_API_KEY;
    const voice = process.env.ELEVENLABS_VOICE_ID || 'FxZjRiAEBESrb7srpme7';
    if (!key) {
      return new Response('ELEVENLABS_API_KEY not set', { status: 503 });
    }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': key
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true
        }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(`ElevenLabs error: ${err}`, { status: 500 });
    }

    return new Response(res.body, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' }
    });
  } catch (err) {
    return new Response(String(err.message || err), { status: 500 });
  }
}
