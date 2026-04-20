export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  try {
    const db = getDb();
    let evidence = [];

    if (db) {
      const { data } = await db
        .from('fairwork_evidence')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(10);
      evidence = data || [];
    }

    const activeAlerts = evidence.map(e => e.description || e.title || 'Unresolved issue').filter(Boolean);

    return NextResponse.json({
      status: activeAlerts.length === 0 ? 'CLEAR' : 'ALERTS',
      alerts: activeAlerts,
      count: activeAlerts.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ status: 'CLEAR', alerts: [], count: 0 });
  }
}
