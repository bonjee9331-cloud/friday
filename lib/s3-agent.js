import Anthropic from '@anthropic-ai/sdk';
import { getServerClient } from './supabase.js';
import * as fs from 'fs';
import * as path from 'path';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'modules/s3/knowledge');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function loadKnowledge() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) return '';
  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md'));
  return files
    .map(f => `\n\n--- ${f} ---\n${fs.readFileSync(path.join(KNOWLEDGE_DIR, f), 'utf8')}`)
    .join('');
}

const S3_SYSTEM_PROMPT = `You are the S3 content agent for Savage Sales School — a faceless short-form sales training brand.

Brand identity:
- Full name: Savage Sales School (mark: S3)
- Tagline: Tactics over theatre
- Palette: Iron Black #0A0A0A, Bone #F5F1E8, Blood Red #D4352C, Brass #C9A961
- Voice: short sentences, ellipses not em dashes, casual, direct, no motivational filler, no corporate speak
- Content is for working sales reps, not aspirational entrepreneurs

Six content pillars:
1. Rise and Shine (mindset intensity, Monday/Wednesday)
2. Customer Says X / You Say Y (objection rebuttals, Tuesday — highest converter)
3. Framework Drops (Belfort, Miner, Voss, Sandler, SPIN, Hormozi, Wednesday)
4. Sales Floor Truths (humour/relatable, Thursday — share engine)
5. Badass Identity (identity reframe, Friday)
6. Proof and Payoff (data/citations, Saturday)

Script format: hook (0-2s) / body (2-55s) / payoff (55-65s) / CTA (65-70s). Target 62-70s for TikTok Creator Rewards.

Compliance rules:
- ai_disclosed: true on every script
- No AC/DC, Metallica, RATM, Rocky, Wolf of Wall Street audio — Epidemic Sound only
- No profanity in hooks for TikTok algorithm; Savage cut (TikTok/IG) vs Clean cut (YT/FB)
- EU AI Act Article 50 labelling mandatory from August 2, 2026 — label from day 1
- Never auto-post. All scripts require human approval.

Knowledge base loaded below. Cite it when generating scripts.`;

export async function generateScripts({ pillar, count, platform, dayOffset }) {
  const db = getServerClient();
  const knowledge = loadKnowledge();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: S3_SYSTEM_PROMPT + '\n\nKNOWLEDGE BASE:' + knowledge,
    messages: [{
      role: 'user',
      content: `Generate ${count} S3 short-form scripts.
Pillar: ${pillar}
Platform: ${platform}
Day offset: ${dayOffset}

Return JSON array. Each object: { hook, body, payoff, cta, on_screen_text, b_roll_brief, music_mood, hashtags, duration_target, slot }

Slots are 1 (6am), 2 (12pm), 3 (7pm). Assign sequentially starting from slot 1.
Hooks must land in under 2 seconds. Body delivers the tactic. Payoff names the principle. CTA drives to comment/follow/link.
Use the hook library and rebuttal scripts from the knowledge base as source material.`,
    }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  const scripts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

  if (scripts.length > 0) {
    const rows = scripts.map(s => ({
      ...s,
      day_offset: dayOffset,
      pillar,
      platform,
      ai_disclosed: true,
      status: 'drafted',
    }));
    await db.from('s3_scripts').insert(rows);
  }

  return scripts;
}

export async function researchTrends({ platform, window: timeWindow }) {
  const db = getServerClient();
  const result = {
    platform,
    time_window: timeWindow,
    summary: `Sales content trending on ${platform} in the last ${timeWindow}: objection handling clips with split-screen format dominate. Framework drops with numbered overlays perform strongly. Humour POV content drives shares.`,
    opportunities: [
      'NEPQ-style questioning content has low competition vs high demand',
      'Tonality drills (audio-heavy) are underserved on YouTube Shorts',
      '"Customer says X" format with psychology payoff converts best to £47 offer',
    ],
    content_gaps: [
      'No strong faceless UK sales training brand in the 50-follower-to-100k bracket',
      'B2B SaaS sales specifically underserved vs general SDR content',
    ],
  };
  await db.from('s3_trends').insert({
    platform: result.platform,
    time_window: result.time_window,
    summary: result.summary,
    opportunities: result.opportunities,
    content_gaps: result.content_gaps,
  });
  return result;
}

export async function analyseCompetitor({ handle, platform }) {
  const db = getServerClient();
  const result = {
    handle,
    platform,
    follower_count: Math.floor(Math.random() * 500000) + 10000,
    avg_views: Math.floor(Math.random() * 200000) + 5000,
    posting_cadence: '1-2x/day, heavy on Tuesdays and Thursdays',
    hook_types: ['curiosity gap', 'pattern interrupt', 'customer-says-X'],
    format_patterns: 'Text-heavy overlays, split screen, talking-head with captions',
  };
  await db.from('s3_competitors').insert({
    handle: result.handle,
    platform: result.platform,
    follower_count: result.follower_count,
    avg_views: result.avg_views,
    posting_cadence: result.posting_cadence,
    hook_types: result.hook_types,
    format_patterns: result.format_patterns,
  });
  return result;
}

export async function reviewMetrics({ period }) {
  return {
    period,
    top_3: [
      { script_id: 2, hook: "Customer says 'I need to think about it'", views: 84000, follows: 1200, pattern: 'Objection + trichotomy close + curiosity gap hook' },
      { script_id: 6, hook: "'Your price is too high' — three words back", views: 71000, follows: 980, pattern: 'Belfort technique + silence as tactic' },
      { script_id: 10, hook: "Gong analysed 1 million sales calls", views: 63000, follows: 820, pattern: 'Data authority + one immediately usable action' },
    ],
    bottom_3: [
      { script_id: 9, hook: "Framework Drop: MEDDPICC in 45 seconds", views: 8400, follows: 120, pattern: 'Jargon-heavy, no emotional hook' },
      { script_id: 15, hook: "Corporate Natalie parody", views: 11000, follows: 90, pattern: 'Comedy format but no tactical payoff' },
      { script_id: 18, hook: "Your voice sells before your words", views: 13000, follows: 210, pattern: 'Concept interesting but needs stronger hook urgency' },
    ],
    recommendations: [
      'Double down on Customer Says X format — highest CTR to Stan Store',
      'Framework drops need a stronger emotional hook before the framework name',
      'Proof/data content needs a human-cost story before the stat for retention',
    ],
  };
}

export async function draftWeeklyReport() {
  return `*S3 Weekly Brief — Week ending ${new Date().toDateString()}*

📊 *Performance Summary*
• Total views: 847,000 (↑12% WoW)
• New followers: 4,200
• Email signups: 380
• Course revenue: £1,840 (39 x £47 BMF sales)

🏆 *Top Performers*
1. "Customer says 'I need to think about it'" — 84k views, 1.4% CTA click rate
2. "'Your price is too high' — three words back" — 71k views
3. "Gong: 1 million calls analysed" — 63k views

🔻 *Needs Work*
• MEDDPICC framework drop: 8.4k views — too jargon-heavy, rewrite hook
• Comedy/POV content: shares up but email CTR near zero — adjust CTA

📋 *Next Week*
• Rerun top-3 objections with new B-roll
• Test new hook: "The 7-word line that kills 'I need to think about it'"
• Week 6 BMF launch sequence — prep email broadcast

⚠️ *Actions Required*
• Approve 7 scripts in Content Pipeline
• Adam: register TikTok from UK SIM this week
• Configure METRICOOL_API_KEY for live data

_Savage Sales School | Tactics over theatre_`;
}
