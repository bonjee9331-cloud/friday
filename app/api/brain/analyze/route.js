import { NextResponse } from 'next/server';

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req) {
  try {
    const { jobTitle, company, jobDescription } = await req.json();

    if (!jobTitle || !company || !jobDescription) {
      return NextResponse.json(
        {
          ok: false,
          error: 'jobTitle, company, and jobDescription are required'
        },
        { status: 400 }
      );
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `
You are an elite-level job application strategist.

Your job is to produce high-performance, recruiter-ready application content that:
- ranks in the top 0.01% of candidates
- passes ATS systems
- sounds fully human and credible
- is commercially sharp and outcome-driven

CRITICAL RULES:
- NEVER invent fake metrics, percentages, revenue figures, or tools
- ONLY include numbers if they are clearly supported by the candidate context or job alignment
- If no number is available, use strong commercial language instead
- Avoid generic phrases like "results-driven" unless backed by specifics
- No fluff, no filler, no corporate clichés
- Every bullet must sound like it came from a top performer, not AI

WRITING STYLE:
- Direct, confident, commercially focused
- Outcome-first language
- Emphasize revenue, performance, conversion, leadership impact
- Tight, sharp bullet points (no rambling)
`
          },
          {
            role: 'user',
            content: `
Return JSON in exactly this structure:

{
  "keywords": [],
  "strengths": [],
  "gaps": [],
  "tailoredSummary": "",
  "tailoredSkills": [],
  "tailoredExperienceBullets": [],
  "resumeVersionName": "",
  "resumeSnapshot": "",
  "coverLetter": "",
  "fitScore": 0
}

Candidate context:
- Name: Ben Lynch
- Target roles: Sales Manager, Sales Operations Manager, Sales Team Leader, Contact Center Manager, Remote Sales Manager
- Locations: Australia, New Zealand
- Remote only: Yes
- Minimum salary: $70k
- Excluded industries: Finance, Investments, Real Estate, Car Sales

Background:
- Remote sales leadership
- Team coaching and performance improvement
- KPI tracking (conversion rates, revenue, sales per hour)
- Contact center and outbound sales environment
- Recruitment, onboarding, and training
- Sales operations and process improvement

Job title:
${jobTitle}

Company:
${company}

Job description:
${jobDescription}

INSTRUCTIONS:

1. Extract ATS keywords (important phrases from job description)

2. Strengths:
- Align directly with the job
- Make them feel commercially valuable

3. Gaps:
- Only include real gaps if relevant
- Keep minimal

4. Tailored Summary:
- Strong opening positioning
- No fluff
- Sound like a high performer

5. Tailored Skills:
- Relevant, ATS-friendly, no filler

6. Tailored Experience Bullets:
- 8 bullets max
- MUST sound like real performance
- Use metrics ONLY if believable and aligned
- Otherwise use strong outcome language:
  - "lifted conversion consistency"
  - "tightened KPI discipline"
  - "improved revenue performance"
- Avoid fake precision like "32.7%"

7. Resume Version Name:
- Clear and specific (Company + Role)

8. Resume Snapshot:
- Clean, interview-ready CV section
- No fluff

9. Cover Letter:
- NO "I am excited"
- NO generic intro
- Structure:
  - Opening: direct value statement
  - Middle: how you drive results
  - Close: why you're relevant to THIS role
- Keep it sharp and human

10. Fit Score:
- Be realistic
- 75–88 = strong fit
- 88–92 = very strong fit
- Only go above 92 if near perfect match

Return JSON only.
`
          }
        ],
        temperature: 0.3
      })
    });

    const openaiText = await openaiResponse.text();
    const openaiJson = tryParseJson(openaiText);

    if (!openaiResponse.ok || !openaiJson) {
      return NextResponse.json(
        {
          ok: false,
          error: 'OpenAI request failed',
          details: openaiJson || openaiText
        },
        { status: 500 }
      );
    }

    const content = openaiJson.choices?.[0]?.message?.content || '';
    const parsed = typeof content === 'string' ? tryParseJson(content) : content;

    if (!parsed) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Model did not return valid JSON',
          raw: content
        },
        { status: 500 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/job_analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify({
        job_title: jobTitle,
        company: company,
        job_description: jobDescription,
        keywords: parsed.keywords,
        strengths: parsed.strengths,
        gaps: parsed.gaps,
        tailored_summary: parsed.tailoredSummary,
        tailored_skills: parsed.tailoredSkills,
        tailored_experience_bullets: parsed.tailoredExperienceBullets,
        resume_version_name: parsed.resumeVersionName,
        resume_snapshot: parsed.resumeSnapshot,
        cover_letter: parsed.coverLetter,
        fit_score: parsed.fitScore,
        application_status: 'draft'
      })
    });

    const saveText = await saveResponse.text();
    const savedAnalysis = tryParseJson(saveText);

    if (!saveResponse.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to save to Supabase',
          details: savedAnalysis || saveText
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: parsed,
      savedId: savedAnalysis?.[0]?.id || null
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
