import { jobs } from '../../../../lib/demo-data';

function isAuthorized(request) {
  const required = process.env.JOB_SYNC_API_KEY;
  if (!required) return true;
  return request.headers.get('x-api-key') === required;
}

export async function POST(request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  return Response.json({
    ok: true,
    syncedAt: new Date().toISOString(),
    jobCount: jobs.length,
    jobs
  });
}
