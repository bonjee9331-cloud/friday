// Shared auth helper for Friday API routes
// Set MANAGER_AUTH_KEY in env to require it on all sensitive endpoints.
// If unset, auth is bypassed (dev mode). Header: x-api-key or Authorization: Bearer <key>

export function isAuthorized(request) {
  const required = process.env.MANAGER_AUTH_KEY;
  if (!required) return true; // dev: no key set = open

  const xKey = request.headers.get('x-api-key');
  if (xKey === required) return true;

  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ') && auth.slice(7) === required) return true;

  return false;
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
