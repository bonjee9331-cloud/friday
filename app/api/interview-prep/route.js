import { buildInterviewPrep } from '../../../lib/demo-data';
import { isAuthorized, unauthorized } from '../../../lib/auth.js';

export async function POST(request) {
  if (!isAuthorized(request)) return unauthorized();
  const body = await request.json().catch(() => ({}));
  const role = body.role || 'Sales Manager';
  const company = body.company || 'Example Company';

  return Response.json({
    ok: true,
    prep: buildInterviewPrep(role, company)
  });
}
