export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { isAuthorized, unauthorized } from '../../../../lib/auth.js';

export async function GET(request) {
  if (!isAuthorized(request)) return unauthorized();
  return NextResponse.json({
    total_views: 0,
    total_followers: 0,
    top_scripts: [],
    note: 'Connect Metricool API key to unlock live metrics.',
  });
}
