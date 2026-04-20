export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAuthorized, unauthorized } from '../../../../lib/auth.js';

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error(`Supabase env missing: url=${!!url} key=${!!key}`);
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request) {
  if (!isAuthorized(request)) return unauthorized();
  try {
    const db = getDb();
    const { data, error } = await db
      .from('s3_agent_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const current = data?.find(r => r.status === 'running') ?? null;
    return NextResponse.json({ runs: data, current });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAuthorized(request)) return unauthorized();
  const { action, params } = await request.json();

  const allowed = ['generateScripts', 'researchTrends', 'analyseCompetitor', 'reviewMetrics', 'draftWeeklyReport'];
  if (!allowed.includes(action)) return NextResponse.json({ error: 'unknown action' }, { status: 400 });

  try {
    const db = getDb();
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
        const db2 = getDb();
        await db2.from('s3_agent_runs').update({
          status: 'completed',
          output: JSON.stringify(output),
          completed_at: new Date().toISOString(),
        }).eq('id', run.id);
      } catch (err) {
        const db2 = getDb();
        await db2.from('s3_agent_runs').update({
          status: 'failed',
          error: String(err),
          completed_at: new Date().toISOString(),
        }).eq('id', run.id);
      }
    }, 100);

    return NextResponse.json({ runId: run.id, status: 'started' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
