// Session token helpers — stateless, derived from env vars.
// The session cookie value is a SHA-256 hash of the password + salt.
// No DB required. Changing FRIDAY_PASSWORD or FRIDAY_SESSION_SALT invalidates all sessions.

import { createHash } from 'crypto';

export function getSessionToken() {
  const pass = process.env.FRIDAY_PASSWORD || 'biblical';
  const salt = process.env.FRIDAY_SESSION_SALT || 'friday-os-2026';
  return createHash('sha256').update(`${pass}:${salt}`).digest('hex');
}

export function validateSession(cookieValue) {
  if (!cookieValue) return false;
  const expected = getSessionToken();
  // Constant-time compare to prevent timing attacks
  try {
    const a = Buffer.from(cookieValue.padEnd(64, '0').slice(0, 64), 'utf8');
    const b = Buffer.from(expected.padEnd(64, '0').slice(0, 64), 'utf8');
    return a.length === b.length && require('crypto').timingSafeEqual(a, b);
  } catch {
    return cookieValue === expected;
  }
}

// Normalize a spoken/typed phrase for passphrase matching
export function normPhrase(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Check if a phrase contains the configured password keyword(s)
export function phraseMatches(input) {
  const pass = process.env.FRIDAY_PASSWORD || 'biblical';
  const keywords = pass.split(',').map(k => normPhrase(k)).filter(Boolean);
  const norm = normPhrase(input);
  return keywords.some(k => norm.includes(k));
}
