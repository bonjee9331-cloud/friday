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
    const { data, error } = await db.from('s3_scripts').select('*').order('day_offset').order('slot');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ scripts: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!isAuthorized(request)) return unauthorized();
  const { id, status } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  const allowed = ['drafted', 'approved', 'produced', 'scheduled', 'posted', 'rejected'];
  if (!allowed.includes(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 });

  try {
    const db = getDb();
    const { data, error } = await db
      .from('s3_scripts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ script: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
