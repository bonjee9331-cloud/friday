// POST /api/friday/agent
// Multi-agent chat endpoint. Routes via agent router, returns reply + agent metadata.
// Body: { message: string, history?: [], module?: string, agentKey?: string }
// Returns: { reply, agentKey, agentName, agentRole, agentColour, voiceId }

export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { routeMessage, AGENTS } from '../../../../lib/agents/router.js';
import { askFridayWithSystem } from '../../../../lib/brain.js';
import { isAuthorized, unauthorized } from '../../../../lib/auth.js';

export async function POST(request) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const body = await request.json();
    const { message, history = [], module = null, agentKey: forcedAgent } = body;
    if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

    // Allow forced routing (user clicked an agent in the roster)
    let routing;
    if (forcedAgent && AGENTS[forcedAgent]) {
      const agent = AGENTS[forcedAgent];
      routing = { agentKey: forcedAgent, agent, systemPrompt: agent.systemPrompt, voiceId: agent.voiceId };
    } else {
      routing = await routeMessage({ message, history, module });
    }

    const { agentKey, agent, systemPrompt, voiceId } = routing;

    const { reply, mock } = await askFridayWithSystem({ userMessage: message, history, systemPrompt });

    return NextResponse.json({
      reply,
      mock,
      agentKey,
      agentName: agent.name,
      agentRole: agent.role,
      agentColour: agent.colour,
      voiceId
    });
  } catch (err) {
    console.error('agent route error', err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
