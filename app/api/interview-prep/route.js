import { buildInterviewPrep } from '../../../lib/demo-data';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const role = body.role || 'Sales Manager';
  const company = body.company || 'Example Company';

  return Response.json({
    ok: true,
    prep: buildInterviewPrep(role, company)
  });
}
