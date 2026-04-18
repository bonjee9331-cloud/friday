// GET /api/bob/brief
// Returns the day's BOB sales ops briefing as markdown text.

import { NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase.js';
import { askFriday } from '../../../../lib/brain.js';
import { isAuthorized, unauthorized } from '../../../../lib/auth.js';

export const runtime = 'nodejs';

const DEFAULT_STATS = {
  team: { b1: 74.1, b2: 58.1, canx: 25.9, sph: 0.38 },
  patterns: [
    "B2 cliff: Aaron, Peter, Rahool, Antony",
    "B1 collapse: JJ, Danny, Kyran, Sam Bailey, Sam Daly",
    "Jackson Exception: B2 improving every quarter, 47 to 75 to 100"
  ]
};

export async function GET(request) {
  if (!isAuthorized(request)) return unauthorized();

  const client = getServerClient();
  let statsSummary = '';

  if (client) {
    const { data: reps } = await client
      .from('bob_weekly_stats')
      .select('rep_id, sales, sph, b1_pct, b2_pct, canx_pct, week_number, year')
      .order('year', { ascending: false })
      .order('week_number', { ascending: false })
      .limit(50);
    if (reps && reps.length) {
      statsSummary = reps
        .map((r) => `${r.rep_id} W${r.week_number}: ${r.sales} sales, SPH ${r.sph}, B1 ${r.b1_pct}%, B2 ${r.b2_pct}%, canx ${r.canx_pct}%`)
        .join('\n');
    }
  }

  if (!statsSummary) {
    statsSummary = `Team B1 ${DEFAULT_STATS.team.b1}% (target 90%), B2 ${DEFAULT_STATS.team.b2}% (target 65%), canx ${DEFAULT_STATS.team.canx}% (target under 10%), SPH ${DEFAULT_STATS.team.sph}. Patterns:\n- ${DEFAULT_STATS.patterns.join('\n- ')}`;
  }

  const prompt = `Write the D2MS morning BOB briefing for Ben. Use the stats below. Call out the three rep patterns. Recommend the single most important coaching focus for today. Keep it under 200 words. Markdown. No em dashes.\n\nSTATS:\n${statsSummary}`;

  const { reply, mock } = await askFriday({ userMessage: prompt, module: 'bob' });
  return NextResponse.json({ brief: reply, mock });
}
