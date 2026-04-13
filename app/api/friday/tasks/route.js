// Friday Tasks API
// GET  /api/friday/tasks       list tasks (optional ?status=)
// POST /api/friday/tasks       create task { title, description, priority, due_at }
// PATCH /api/friday/tasks      update task { id, status?, result?, priority? }

import { NextResponse } from 'next/server';
import { getServerClient } from '../../../../lib/supabase.js';

export const runtime = 'nodejs';

export async function GET(request) {
  const client = getServerClient();
  if (!client) return NextResponse.json({ tasks: [], mock: true });
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  let q = client.from('friday_tasks').select('*').order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data });
}

export async function POST(request) {
  const body = await request.json();
  const client = getServerClient();
  if (!client) return NextResponse.json({ error: 'supabase not configured' }, { status: 503 });
  const { data, error } = await client
    .from('friday_tasks')
    .insert({
      title: body.title,
      description: body.description || null,
      priority: body.priority || 'normal',
      due_at: body.due_at || null
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}

export async function PATCH(request) {
  const body = await request.json();
  const client = getServerClient();
  if (!client) return NextResponse.json({ error: 'supabase not configured' }, { status: 503 });
  const patch = {};
  if (body.status) patch.status = body.status;
  if (body.result !== undefined) patch.result = body.result;
  if (body.priority) patch.priority = body.priority;
  patch.updated_at = new Date().toISOString();
  const { data, error } = await client
    .from('friday_tasks')
    .update(patch)
    .eq('id', body.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data });
}
