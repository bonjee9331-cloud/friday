// Supabase client factory. Server uses service role. Browser uses anon key.
import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getBrowserClient() {
  if (!URL || !ANON) return null;
  return createClient(URL, ANON);
}

export function getServerClient() {
  const key = SERVICE || ANON;
  if (!URL || !key) return null;
  return createClient(URL, key, { auth: { persistSession: false } });
}

export async function saveTurn({ conversationId, role, content, module }) {
  const client = getServerClient();
  if (!client) return null;
  const { data, error } = await client
    .from('friday_messages')
    .insert({ conversation_id: conversationId, role, content, module })
    .select()
    .single();
  if (error) {
    console.error('saveTurn error', error);
    return null;
  }
  return data;
}

export async function getRecentHistory(conversationId, limit = 20) {
  const client = getServerClient();
  if (!client) return [];
  const { data, error } = await client
    .from('friday_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) {
    console.error('getRecentHistory error', error);
    return [];
  }
  return data || [];
}
