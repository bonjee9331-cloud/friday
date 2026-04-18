// GET /api/sales/rep-stats
// Returns rep performance data for Riley (sales floor agent)

import { NextResponse } from 'next/server';
import { isAuthorized, unauthorized } from '../../../../lib/auth.js';

const REPS = [
  { name: 'Aaron Longmate',   b1: 83.2, b2: 61.5, canx: 16.8, trend: 'declining' },
  { name: 'Antony Sweeney',   b1: 73.2, b2: 57.7, canx: 26.8, trend: 'declining' },
  { name: 'Danny Pachano',    b1: 75.6, b2: 52.2, canx: 24.4, trend: 'declining' },
  { name: 'Glen Clarkson',    b1: 78.0, b2: 73.0, canx: 15.0, trend: 'stable'    },
  { name: 'Henri Rosalino',   b1: 73.6, b2: 69.2, canx: 26.4, trend: 'limited'   },
  { name: 'Jackson Leahy',    b1: 76.1, b2: 74.4, canx: 23.9, trend: 'improving' },
  { name: 'JJ Fourie',        b1: 72.0, b2: 65.3, canx: 28.0, trend: 'mixed'     },
  { name: 'Kyran Drake',      b1: 68.8, b2: 62.1, canx: 31.2, trend: 'declining' },
  { name: 'Michael Birch',    b1: 60.0, b2: 6.7,  canx: 40.0, trend: 'collapsed' },
  { name: 'Oscar Penkethman', b1: 74.4, b2: 67.1, canx: 25.6, trend: 'declining' },
  { name: 'Peter Cloy',       b1: 75.8, b2: 59.6, canx: 24.2, trend: 'declining' },
  { name: 'Rahool Bhatt',     b1: 78.1, b2: 46.4, canx: 21.9, trend: 'dropping'  },
  { name: 'Samuel Bailey',    b1: 74.8, b2: 58.2, canx: 25.2, trend: 'declining' },
  { name: 'Samuel Daly',      b1: 71.2, b2: 56.0, canx: 28.8, trend: 'improving' }
];

const TARGETS = { b1: 90, b2: 65, canx: 10 };

export async function GET(request) {
  if (!isAuthorized(request)) return unauthorized();
  const sorted = [...REPS].sort((a, b) => b.b1 - a.b1);

  const teamB1 = (REPS.reduce((s, r) => s + r.b1, 0) / REPS.length).toFixed(1);
  const teamB2 = (REPS.reduce((s, r) => s + r.b2, 0) / REPS.length).toFixed(1);
  const teamCanx = (REPS.reduce((s, r) => s + r.canx, 0) / REPS.length).toFixed(1);

  const alerts = REPS
    .filter(r => r.b1 < TARGETS.b1 || r.b2 < TARGETS.b2 || r.canx > TARGETS.canx)
    .map(r => {
      const issues = [];
      if (r.b1 < TARGETS.b1) issues.push(`B1 ${r.b1}% (target ${TARGETS.b1}%)`);
      if (r.b2 < TARGETS.b2) issues.push(`B2 ${r.b2}% (target ${TARGETS.b2}%)`);
      if (r.canx > TARGETS.canx) issues.push(`Canx ${r.canx}% (target <${TARGETS.canx}%)`);
      return { name: r.name, issues, trend: r.trend };
    });

  return NextResponse.json({
    reps: sorted,
    team: { b1: parseFloat(teamB1), b2: parseFloat(teamB2), canx: parseFloat(teamCanx) },
    targets: TARGETS,
    alerts,
    updatedAt: new Date().toISOString()
  });
}
