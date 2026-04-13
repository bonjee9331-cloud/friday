// POST /api/friday/telegram
// Telegram bot webhook. Set your bot's webhook URL to:
//   https://<your-netlify-site>/api/friday/telegram?token=<TELEGRAM_WEBHOOK_SECRET>
// Body: standard Telegram Update object.

import { NextResponse } from 'next/server';
import { askFriday } from '../../../../lib/brain.js';
import { saveTurn, getRecentHistory, getServerClient } from '../../../../lib/supabase.js';

export const runtime = 'nodejs';

async function sendMessage(chatId, text) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    })
  });
}

export async function POST(request) {
  try {
    const url = new URL(request.url);
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secret && url.searchParams.get('token') !== secret) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const allowedChatId = process.env.TELEGRAM_ALLOWED_CHAT_ID;
    const update = await request.json();
    const msg = update.message || update.edited_message;
    if (!msg || !msg.text) return NextResponse.json({ ok: true });

    const chatId = String(msg.chat.id);
    if (allowedChatId && chatId !== allowedChatId) {
      await sendMessage(chatId, "Not your Friday. Piss off.");
      return NextResponse.json({ ok: true });
    }

    const text = msg.text.trim();
    let module = null;
    let userMessage = text;

    // Module prefix detection
    if (/^\/bob\b/i.test(text)) { module = 'bob'; userMessage = text.replace(/^\/bob\b/i, '').trim(); }
    else if (/^\/jobs?\b/i.test(text)) { module = 'autopilot'; userMessage = text.replace(/^\/jobs?\b/i, '').trim(); }
    else if (/^\/task\b/i.test(text)) { module = 'tasks'; userMessage = text.replace(/^\/task\b/i, '').trim(); }
    else if (/^\/start\b/i.test(text)) {
      await sendMessage(chatId, "Friday here. Tell me what you need. Use /bob for sales ops, /jobs for job hunt, /task for daily tasks, or just talk normally.");
      return NextResponse.json({ ok: true });
    }

    if (!userMessage) {
      await sendMessage(chatId, "Say more than just the command.");
      return NextResponse.json({ ok: true });
    }

    // Find or create a per-chat conversation
    const client = getServerClient();
    let conversationId = null;
    if (client) {
      const { data: existing } = await client
        .from('friday_conversations')
        .select('id')
        .eq('source', `telegram:${chatId}`)
        .order('last_message_at', { ascending: false })
        .limit(1);
      if (existing && existing.length) {
        conversationId = existing[0].id;
      } else {
        const { data: created } = await client
          .from('friday_conversations')
          .insert({ source: `telegram:${chatId}`, module, title: userMessage.slice(0, 60) })
          .select()
          .single();
        conversationId = created?.id;
      }
    }

    let history = [];
    if (client && conversationId) {
      history = await getRecentHistory(conversationId, 20);
      await saveTurn({ conversationId, role: 'user', content: userMessage, module });
    }

    const { reply } = await askFriday({ userMessage, history, module });

    if (client && conversationId) {
      await saveTurn({ conversationId, role: 'assistant', content: reply, module });
      await client
        .from('friday_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    }

    await sendMessage(chatId, reply);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('telegram error', err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
