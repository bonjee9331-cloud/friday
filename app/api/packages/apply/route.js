import { NextResponse } from 'next/server';

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function POST(req) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Package id is required'
        },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const appliedAt = new Date();
    const followUpDueAt = addDays(appliedAt, 3);

    const response = await fetch(
      `${supabaseUrl}/rest/v1/job_analyses?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: 'return=representation'
        },
        body: JSON.stringify({
          application_status: 'applied',
          applied_at: appliedAt.toISOString(),
          follow_up_due_at: followUpDueAt.toISOString()
        })
      }
    );

    const text = await response.text();
    const data = tryParseJson(text);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to mark package as applied',
          details: data || text
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      updated: data?.[0] || null
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || 'Unknown server error'
      },
      { status: 500 }
    );
  }
}
