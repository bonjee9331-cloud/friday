import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const KNOWLEDGE_DIR = path.join(process.cwd(), 'modules/s3/knowledge');

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase env missing');
  return createClient(url, key, { auth: { persistSession: false } });
}

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
  const db = getDb();
  const client = getClient();
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
  const db = getDb();
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: S3_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Research current trends for sales training short-form content on ${platform} over the last ${timeWindow}.

Return a JSON object with these fields:
{
  "summary": "2-3 sentence overview of what's working",
  "opportunities": ["3-5 specific content opportunities with low competition"],
  "content_gaps": ["2-3 gaps in the market S3 can fill"]
}

Base your analysis on:
- What hook formats are outperforming in sales/business education niches
- Which sales frameworks (NEPQ, Sandler, Belfort, Voss etc) have search/engagement momentum
- Format trends: text overlays, split-screen, voiceover, talking head
- Gaps vs established channels like Jeremy Miner, Alex Hormozi, Andy Elliott`,
    }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  const result = {
    platform,
    time_window: timeWindow,
    summary: parsed.summary || '',
    opportunities: parsed.opportunities || [],
    content_gaps: parsed.content_gaps || [],
  };

  await db.from('s3_trends').insert(result);
  return result;
}

export async function analyseCompetitor({ handle, platform }) {
  const db = getDb();
  const client = getClient();

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: S3_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Analyse the sales training creator @${handle} on ${platform}.

Return a JSON object:
{
  "handle": "${handle}",
  "platform": "${platform}",
  "estimated_follower_range": "e.g. 50k-100k",
  "posting_cadence": "e.g. 1-2x/day, heavy on weekdays",
  "hook_types": ["list of hook patterns they use"],
  "format_patterns": "description of their visual/editing style",
  "top_performing_topics": ["list of their best content themes"],
  "weaknesses": ["gaps or weaknesses S3 can exploit"],
  "differentiation": "how S3 should position against this creator"
}

Use your knowledge of this creator. Be direct and tactical.`,
    }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

  const result = {
    handle,
    platform,
    follower_count: null,
    avg_views: null,
    posting_cadence: parsed.posting_cadence || '',
    hook_types: parsed.hook_types || [],
    format_patterns: parsed.format_patterns || '',
    top_performing_topics: parsed.top_performing_topics || [],
    weaknesses: parsed.weaknesses || [],
    differentiation: parsed.differentiation || '',
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
  const db = getDb();
  const client = getClient();

  const { data: scripts } = await db
    .from('s3_scripts')
    .select('id, hook, pillar, platform, status, created_at')
    .order('created_at', { ascending: false })
    .limit(30);

  const { data: metrics } = await db
    .from('s3_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  const scriptSummary = (scripts || []).map(s =>
    `ID ${s.id} | ${s.pillar} | ${s.status} | Hook: "${s.hook?.slice(0, 60)}"`
  ).join('\n');

  const metricsSummary = (metrics || []).length > 0
    ? JSON.stringify(metrics, null, 2)
    : 'No Metricool data connected yet.';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: S3_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Review S3 content performance for period: ${period}

Recent scripts in pipeline:
${scriptSummary}

Platform metrics data:
${metricsSummary}

Return a JSON object:
{
  "period": "${period}",
  "top_3": [{"script_id": null, "hook": "...", "pattern": "why it likely performs well"}],
  "bottom_3": [{"script_id": null, "hook": "...", "pattern": "why it underperforms"}],
  "recommendations": ["3-5 actionable tactical changes for next week"]
}

If no real metrics are available, base top/bottom predictions on S3 brand knowledge and hook quality analysis.`,
    }],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : { period, top_3: [], bottom_3: [], recommendations: [] };
}

export async function draftWeeklyReport() {
  const db = getDb();
  const client = getClient();

  const { data: scripts } = await db
    .from('s3_scripts')
    .select('id, hook, pillar, status')
    .order('created_at', { ascending: false })
    .limit(21);

  const pending = (scripts || []).filter(s => s.status === 'drafted').length;
  const approved = (scripts || []).filter(s => s.status === 'approved').length;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: S3_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Draft the S3 weekly brief for ${new Date().toDateString()}.

Pipeline status: ${approved} approved scripts, ${pending} pending approval.

Recent hooks in pipeline:
${(scripts || []).slice(0, 5).map(s => `- "${s.hook?.slice(0, 80)}" [${s.status}]`).join('\n')}

Write a concise Telegram-formatted weekly brief (use *bold* and bullet points). Include:
- Pipeline status
- 2-3 priority actions for the week
- One tactical reminder from the S3 brand playbook
- Sign off with "Savage Sales School | Tactics over theatre"`,
    }],
  });

  return response.content[0].text;
}
