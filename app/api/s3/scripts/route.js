export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase.js';
import { isAuthorized, unauthorized } from '../../../../lib/auth.js';

export async function GET(request) {
  if (!isAuthorized(request)) return unauthorized();
  const db = getServerClient();
  const { data, error } = await db.from('s3_scripts').select('*').order('day_offset').order('slot');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scripts: data });
}

export async function PATCH(request) {
  if (!isAuthorized(request)) return unauthorized();
  const { id, status } = await request.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 });

  const allowed = ['drafted', 'approved', 'produced', 'scheduled', 'posted', 'rejected'];
  if (!allowed.includes(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 });

  const db = getServerClient();
  const { data, error } = await db
    .from('s3_scripts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ script: data });
}
