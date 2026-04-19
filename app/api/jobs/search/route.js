import { NextResponse } from 'next/server';
import {
  dedupeJobs,
  fetchAdzunaJobs,
  fetchGreenhouseJobs,
  fetchHimalayasJobs,
  fetchJoobleJobs,
  fetchMuseJobs,
  fetchRemotiveJobs
} from '../../../../lib/job-sources';

function parseBool(value) {
  return String(value || '').toLowerCase() === 'true';
}

export async function POST(req) {
  try {
    const body = await req.json();

    const targetTitles = body.targetTitles || [
      'Sales Manager',
      'Sales Operations Manager',
      'Sales Team Leader',
      'Contact Center Manager',
      'Contact Centre Manager',
      'Remote Sales Manager',
      'Telesales Manager',
      'Outbound Sales Manager',
      'Inside Sales Manager'
    ];

    const preferredLocations = body.preferredLocations || [
      'Australia',
      'New Zealand'
    ];

    const excludedKeywords = body.excludedKeywords || [
      'finance',
      'investment',
      'real estate',
      'car sales',
      'automotive sales'
    ];

    const query = body.query || targetTitles.join(' OR ');
    const location = body.location || '';
    const minSalary = Number(body.minSalary || 70000);
    const remoteOnly = parseBool(body.remoteOnly ?? true);

    const enabledSources = String(
      process.env.JOB_SEARCH_SOURCES || 'adzuna,muse,remotive,himalayas,greenhouse,jooble'
    )
      .split(',')
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean);

    const sourceResults = {
      adzuna: [],
      muse: [],
      remotive: [],
      himalayas: [],
      greenhouse: [],
      jooble: []
    };

    if (enabledSources.includes('adzuna')) {
      sourceResults.adzuna = await fetchAdzunaJobs({
        query,
        location,
        minSalary,
        remoteOnly,
        targetTitles,
        preferredLocations,
        excludedKeywords
      });
    }

    if (enabledSources.includes('muse')) {
      sourceResults.muse = await fetchMuseJobs({
        targetTitles,
        preferredLocations,
        excludedKeywords
      });
    }

    if (enabledSources.includes('remotive')) {
      sourceResults.remotive = await fetchRemotiveJobs({
        query,
        targetTitles,
        preferredLocations,
        excludedKeywords
      });
    }

    if (enabledSources.includes('himalayas')) {
      sourceResults.himalayas = await fetchHimalayasJobs({
        query,
        targetTitles,
        preferredLocations,
        excludedKeywords
      });
    }

    if (enabledSources.includes('greenhouse')) {
      sourceResults.greenhouse = await fetchGreenhouseJobs({
        targetTitles,
        preferredLocations,
        excludedKeywords
      });
    }

    if (enabledSources.includes('jooble')) {
      sourceResults.jooble = await fetchJoobleJobs({
        query,
        location,
        minSalary,
        targetTitles,
        preferredLocations,
        excludedKeywords
      });
    }

    const allJobs = [
      ...sourceResults.adzuna,
      ...sourceResults.muse,
      ...sourceResults.remotive,
      ...sourceResults.himalayas,
      ...sourceResults.greenhouse,
      ...sourceResults.jooble
    ];

    const dedupedJobs = dedupeJobs(allJobs, targetTitles, excludedKeywords);

    const salaryFilteredJobs = dedupedJobs.filter((job) => {
      if (!minSalary) return true;
      if (job.salary_min && job.salary_min >= minSalary) return true;
      if (job.salary_max && job.salary_max >= minSalary) return true;
      if (!job.salary_min && !job.salary_max) return true;
      return false;
    });

    const remoteFilteredJobs = salaryFilteredJobs.filter((job) => {
      if (!remoteOnly) return true;
      return !!job.remote;
    });

    const jobs = remoteFilteredJobs.slice(0, 80);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey && jobs.length) {
      await Promise.all(
        jobs.map(async (job) => {
          await fetch(
            `${supabaseUrl}/rest/v1/jobs?on_conflict=source,external_id`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
                Prefer: 'resolution=merge-duplicates'
              },
              body: JSON.stringify(job)
            }
          );
        })
      );
    }

    return NextResponse.json({
      ok: true,
      count: jobs.length,
      jobs,
      debug: {
        enabledSources,
        countsBeforeDedupe: {
          adzuna: sourceResults.adzuna.length,
          muse: sourceResults.muse.length,
          remotive: sourceResults.remotive.length,
          himalayas: sourceResults.himalayas.length,
          greenhouse: sourceResults.greenhouse.length,
          jooble: sourceResults.jooble.length,
          total: allJobs.length
        },
        countsAfterFiltering: {
          deduped: dedupedJobs.length,
          salaryFiltered: salaryFilteredJobs.length,
          remoteFiltered: remoteFilteredJobs.length,
          final: jobs.length
        }
      }
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
