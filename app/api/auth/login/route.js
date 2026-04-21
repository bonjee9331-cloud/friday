// POST /api/auth/login
// Validates the passphrase server-side and sets an httpOnly session cookie.
// Body: { passphrase: string }
// Returns: { ok: true } or { error: string } with 401

import { NextResponse } from 'next/server';
import { getSessionToken, phraseMatches } from '../../../../lib/session.js';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const { passphrase } = body;

    if (!phraseMatches(passphrase)) {
      // Small delay to slow brute-force attempts
      await new Promise(r => setTimeout(r, 600));
      return NextResponse.json({ error: 'Access denied' }, { status: 401 });
    }

    const token = getSessionToken();
    const isProd = process.env.NODE_ENV === 'production';

    const res = NextResponse.json({ ok: true });
    res.cookies.set('friday_session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
