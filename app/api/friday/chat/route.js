// POST /api/friday/chat
// Master brain entrypoint. Called by web chat, voice, and Telegram.
// Body: { message: string, module?: 'bob'|'autopilot'|'tasks', conversationId?: string, history?: [] }
// Returns: { reply, conversationId, mock }

import { NextResponse } from 'next/server';
import { askFriday, askFridayWithSystem } from '../../../../lib/brain.js';
import { routeMessage } from '../../../../lib/agents/router.js';
import { saveTurn, getRecentHistory, getServerClient } from '../../../../lib/supabase.js';
import { isAuthorized, unauthorized } from '../../../../lib/auth.js';

export const runtime = 'nodejs';

export async function POST(request) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const body = await request.json();
    const { message, module = null, conversationId: incomingId, history: passedHistory } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // Get or create conversation
    const client = getServerClient();
    let conversationId = incomingId;
    if (client && !conversationId) {
      const { data } = await client
        .from('friday_conversations')
        .insert({ module, source: 'web', title: message.slice(0, 60) })
        .select()
        .single();
      conversationId = data?.id;
    }

    // Load history from DB if we have an ID, otherwise use whatever the client passed
    let history = passedHistory || [];
    if (client && conversationId) {
      const dbHistory = await getRecentHistory(conversationId, 30);
      if (dbHistory.length) history = dbHistory;
    }

    // Save the user turn
    if (client && conversationId) {
      await saveTurn({ conversationId, role: 'user', content: message, module });
    }

    // Route to correct agent and ask
    const routing = await routeMessage({ message, history, module });
    const { reply, mock } = await askFridayWithSystem({
      userMessage: message,
      history,
      systemPrompt: routing.systemPrompt
    });

    // Save the assistant turn
    if (client && conversationId) {
      await saveTurn({ conversationId, role: 'assistant', content: reply, module });
      await client
        .from('friday_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    return NextResponse.json({ reply, conversationId, mock });
  } catch (err) {
    console.error('chat error', err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
