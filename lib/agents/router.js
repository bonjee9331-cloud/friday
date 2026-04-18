// Agent router — Bob receives all input, routes to specialist or handles directly
// Returns: { agent, agentKey, response, voiceId }

import { AGENTS, AGENT_NAMES } from './agents.js';

// Keywords that trigger routing to each agent
const ROUTING_RULES = [
  {
    agentKey: 'SUSAN',
    patterns: [
      /\bsusan\b/i,
      /\bjob\b/i,
      /\bjobs\b/i,
      /\bapplication\b/i,
      /\bapply\b/i,
      /\binterview\b/i,
      /\bcv\b/i,
      /\bresume\b/i,
      /\bhire\b/i,
      /\brecruit\b/i,
      /\bopening\b/i,
      /\bvacancy\b/i,
      /\blinkedin\b/i,
      /\bjob search\b/i,
      /\bseek\b/i,
      /\bindeed\b/i
    ]
  },
  {
    agentKey: 'DOUG',
    patterns: [
      /\bdoug\b/i,
      /\btask\b/i,
      /\btasks\b/i,
      /\bto.?do\b/i,
      /\breminder\b/i,
      /\bdeadline\b/i,
      /\bfair work\b/i,
      /\bunfair dismissal\b/i,
      /\bemployment law\b/i,
      /\bcontract\b/i,
      /\bdispute\b/i,
      /\btermination\b/i,
      /\brendundancy\b/i,
      /\bentitlement\b/i
    ]
  },
  {
    agentKey: 'RILEY',
    patterns: [
      /\briley\b/i,
      /\bsales floor\b/i,
      /\bfloor\b/i,
      /\brep\b/i,
      /\breps\b/i,
      /\bcoaching\b/i,
      /\bb1\b/i,
      /\bb2\b/i,
      /\bcancel\b/i,
      /\bcancellation\b/i,
      /\bsph\b/i,
      /\bleaderboard\b/i,
      /\bperformance\b/i,
      /\bhellofresh\b/i,
      /\bd2ms\b/i
    ]
  },
  {
    agentKey: 'MAYA',
    patterns: [
      /\bmaya\b/i,
      /\bresearch\b/i,
      /\bsummarise\b/i,
      /\bsummarize\b/i,
      /\blook up\b/i,
      /\bfind out\b/i,
      /\bwhat is\b/i,
      /\bwho is\b/i,
      /\bintelligence\b/i,
      /\bcompetitor\b/i,
      /\bindustry\b/i
    ]
  }
];

// Explicit routing phrases ("put me through to X", "ask X", "talk to X")
const EXPLICIT_ROUTING = /(?:put me through to|ask|talk to|get|connect me to|route to|switch to)\s+(\w+)/i;

export function detectAgent(message) {
  // 1. Explicit routing phrase
  const explicitMatch = message.match(EXPLICIT_ROUTING);
  if (explicitMatch) {
    const requested = explicitMatch[1].toUpperCase();
    if (AGENTS[requested]) return requested;
  }

  // 2. Agent name mentioned directly
  for (const name of AGENT_NAMES) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(message)) return name;
  }

  // 3. Keyword routing
  for (const rule of ROUTING_RULES) {
    if (rule.patterns.some(p => p.test(message))) return rule.agentKey;
  }

  // 4. Default to BOB
  return 'BOB';
}

export async function routeMessage({ message, history = [], module = null }) {
  const agentKey = detectAgent(message);
  const agent = AGENTS[agentKey];

  // Build the routed system prompt
  const systemPrompt = agent.systemPrompt;

  // If routing away from BOB, prepend a handoff note
  const effectiveMessage = agentKey !== 'BOB'
    ? message
    : message;

  return {
    agentKey,
    agent,
    systemPrompt,
    effectiveMessage,
    voiceId: agent.voiceId
  };
}

export { AGENTS };
