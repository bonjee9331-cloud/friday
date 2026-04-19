import { applications } from '../../../../lib/demo-data';

function isAuthorized(request) {
  const required = process.env.FOLLOW_UP_API_KEY;
  if (!required) return true;
  return request.headers.get('x-api-key') === required;
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const due = applications.filter((application) => application.status === 'Follow-up due');

  return Response.json({
    ok: true,
    ranAt: new Date().toISOString(),
    followUpsDue: due.length,
    applications: due
  });
}
