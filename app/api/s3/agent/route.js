export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase.js';
import { isAuthorized, unauthorized } from '../../../../lib/auth.js';

export async function GET(request) {
  if (!isAuthorized(request)) return unauthorized();
  const db = getServerClient();
  const { data, error } = await db
    .from('s3_agent_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const current = data?.find(r => r.status === 'running') ?? null;
  return NextResponse.json({ runs: data, current });
}

export async function POST(request) {
  if (!isAuthorized(request)) return unauthorized();
  const { action, params } = await request.json();

  const allowed = ['generateScripts', 'researchTrends', 'analyseCompetitor', 'reviewMetrics', 'draftWeeklyReport'];
  if (!allowed.includes(action)) return NextResponse.json({ error: 'unknown action' }, { status: 400 });

  const db = getServerClient();
  const { data: run, error } = await db
    .from('s3_agent_runs')
    .insert({ capability: action, params: params ?? {}, status: 'running' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget
  setTimeout(async () => {
    try {
      const agent = await import('../../../../lib/s3-agent.js');
      let output;
      switch (action) {
        case 'generateScripts':   output = await agent.generateScripts(params); break;
        case 'researchTrends':    output = await agent.researchTrends(params); break;
        case 'analyseCompetitor': output = await agent.analyseCompetitor(params); break;
        case 'reviewMetrics':     output = await agent.reviewMetrics(params); break;
        case 'draftWeeklyReport': output = await agent.draftWeeklyReport(); break;
      }
      await db.from('s3_agent_runs').update({
        status: 'completed',
        output: JSON.stringify(output),
        completed_at: new Date().toISOString(),
      }).eq('id', run.id);
    } catch (err) {
      await db.from('s3_agent_runs').update({
        status: 'failed',
        error: String(err),
        completed_at: new Date().toISOString(),
      }).eq('id', run.id);
    }
  }, 100);

  return NextResponse.json({ runId: run.id, status: 'started' });
}
