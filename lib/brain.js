// The unified brain. One function, many callers (chat, voice, telegram, cron).
// Uses Claude as primary, OpenAI as secondary critic when BRAIN_MODE=dual.

import {
  FRIDAY_SYSTEM_PROMPT,
  BOB_MODULE_PROMPT,
  AUTOPILOT_MODULE_PROMPT,
  TASKS_MODULE_PROMPT
} from './friday-prompt.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PRIMARY = process.env.PRIMARY_LLM || 'anthropic';
const MODE = process.env.BRAIN_MODE || 'single';

function moduleContext(module) {
  if (module === 'bob') return BOB_MODULE_PROMPT;
  if (module === 'autopilot') return AUTOPILOT_MODULE_PROMPT;
  if (module === 'tasks') return TASKS_MODULE_PROMPT;
  return '';
}

export function buildSystemPrompt(module) {
  const extra = moduleContext(module);
  if (!extra) return FRIDAY_SYSTEM_PROMPT;
  return `${FRIDAY_SYSTEM_PROMPT}\n\nACTIVE MODULE CONTEXT:\n${extra}`;
}

async function callClaude({ system, messages, maxTokens = 1500 }) {
  if (!ANTHROPIC_API_KEY) {
    return {
      text: "Friday brain is offline. Set ANTHROPIC_API_KEY in Netlify env vars to wake me up.",
      mock: true
    };
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      temperature: 0.6,
      system,
      messages
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude error: ${err}`);
  }
  const data = await res.json();
  return { text: data.content?.[0]?.text || '', mock: false };
}

async function callOpenAI({ system, messages, maxTokens = 1500 }) {
  if (!OPENAI_API_KEY) {
    return { text: '', mock: true };
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.6,
      max_tokens: maxTokens,
      messages: [{ role: 'system', content: system }, ...messages]
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${err}`);
  }
  const data = await res.json();
  return { text: data.choices?.[0]?.message?.content || '', mock: false };
}

/**
 * Ask Friday.
 * @param {Object} opts
 * @param {string} opts.userMessage The current user message.
 * @param {Array<{role:string,content:string}>} [opts.history] Previous turns.
 * @param {'bob'|'autopilot'|'tasks'|null} [opts.module] Module context.
 * @param {number} [opts.maxTokens]
 */
export async function askFriday({ userMessage, history = [], module = null, maxTokens = 1500 }) {
  const system = buildSystemPrompt(module);
  const messages = [
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage }
  ];

  const primary = PRIMARY === 'openai'
    ? await callOpenAI({ system, messages, maxTokens })
    : await callClaude({ system, messages, maxTokens });

  if (MODE !== 'dual') {
    return { reply: primary.text, mock: primary.mock };
  }

  // Dual mode: use the secondary to tighten the primary reply
  const critiquePrompt = `Here is a draft reply in Ben's voice. Tighten it if needed. Keep it short, direct, no AI filler, no em dashes, use "..." for breaks. Return only the tightened reply.\n\nDRAFT:\n${primary.text}`;
  const secondary = PRIMARY === 'openai'
    ? await callClaude({ system, messages: [{ role: 'user', content: critiquePrompt }], maxTokens })
    : await callOpenAI({ system, messages: [{ role: 'user', content: critiquePrompt }], maxTokens });

  return { reply: secondary.text || primary.text, mock: primary.mock && secondary.mock };
}
