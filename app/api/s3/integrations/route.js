export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

const KEYS = [
  'ANTHROPIC_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'ELEVENLABS_VOICE_ID',
  'MANAGER_AUTH_KEY',
  'METRICOOL_API_KEY',
];

export async function GET() {
  const integrations = KEYS.map(key => ({
    key,
    status: process.env[key] ? 'connected' : 'missing',
  }));
  return NextResponse.json({ integrations });
}
