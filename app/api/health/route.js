import { appConfig } from '../../../lib/config';

export async function GET() {
  return Response.json({
    ok: true,
    appName: appConfig.appName,
    demoMode: appConfig.demoMode,
    timestamp: new Date().toISOString()
  });
}
