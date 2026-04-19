import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Check for running gaze_correct.py process
    const out = execSync('pgrep -f gaze_correct.py 2>/dev/null || true', { encoding: 'utf8', timeout: 2000 });
    const active = out.trim().length > 0;
    return NextResponse.json({ active, pid: active ? parseInt(out.trim().split('\n')[0]) : null });
  } catch {
    return NextResponse.json({ active: false, pid: null });
  }
}
