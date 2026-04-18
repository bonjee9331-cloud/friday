// Client-side fetch helper — injects MANAGER_AUTH_KEY from env into requests
// Only works in Next.js client components via NEXT_PUBLIC_ prefix

export function authHeaders() {
  const key = process.env.NEXT_PUBLIC_MANAGER_AUTH_KEY;
  if (!key) return { 'Content-Type': 'application/json' };
  return {
    'Content-Type': 'application/json',
    'x-api-key': key
  };
}

export async function authedFetch(url, options = {}) {
  const key = process.env.NEXT_PUBLIC_MANAGER_AUTH_KEY;
  const headers = {
    'Content-Type': 'application/json',
    ...(key ? { 'x-api-key': key } : {}),
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}
