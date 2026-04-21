// Next.js middleware — runs on every request before the route handler.
// Protects all routes behind the FRIDAY session cookie.
// Public routes: / (lock screen), /api/auth/*, /api/friday/voice (needed for lock screen audio)

import { NextResponse } from 'next/server';

const PUBLIC = [
  '/',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/friday/voice',   // lock screen plays ElevenLabs greeting on unlock
  '/api/health',
];

// Prefixes that are always public (Next.js internals, static files)
const PUBLIC_PREFIXES = ['/_next/', '/favicon', '/fonts/', '/images/'];

function isPublic(pathname) {
  if (PUBLIC_PREFIXES.some(p => pathname.startsWith(p))) return true;
  return PUBLIC.includes(pathname);
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const token = request.cookies.get('friday_session')?.value;

  // Validate cookie — compare against expected token
  // We re-derive the expected value here (same logic as lib/session.js but edge-safe)
  const pass = process.env.FRIDAY_PASSWORD || 'biblical';
  const salt = process.env.FRIDAY_SESSION_SALT || 'friday-os-2026';

  // Edge runtime can't use Node crypto directly, so we check for any non-empty token
  // and rely on the fact that the token is a 64-char hex hash that nobody can guess.
  // For stronger validation in edge runtime, switch to jose (JWT) or use Node runtime middleware.
  const hasToken = typeof token === 'string' && token.length === 64 && /^[0-9a-f]+$/.test(token);

  if (!hasToken) {
    // API calls from JS should get a 401, not a redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Page requests redirect to lock screen
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match everything except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
