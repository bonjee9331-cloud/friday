function cleanText(value) {
  return String(value || '').trim();
}

function normalizeTitle(value) {
  return cleanText(value).toLowerCase();
}

function normalizeMoney(value) {
  if (value == null || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? Math.round(num) : null;
}

function buildSalaryText(min, max, fallback = '') {
  if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  if (min) return `From $${min.toLocaleString()}`;
  if (max) return `Up to $${max.toLocaleString()}`;
  return fallback || '';
}

function getTargetTitleMatches(job, targetTitles = []) {
  const title = normalizeTitle(job.title);
  const description = normalizeTitle(job.description);

  return targetTitles.filter((target) => {
    const t = normalizeTitle(target);
    if (!t) return false;
    return title.includes(t) || description.includes(t);
  });
}

function containsExcludedKeyword(job, excludedKeywords = []) {
  const haystack = `${job.title} ${job.company} ${job.description}`.toLowerCase();
  return excludedKeywords.some((keyword) =>
    haystack.includes(String(keyword || '').toLowerCase())
  );
}

function containsHardExcludedKeyword(job) {
  const HARD_EXCLUDED = [
    'scientist',
    'science',
    'engineer',
    'engineering',
    'developer',
    'software',
    'backend',
    'frontend',
    'nurse',
    'doctor',
    'teacher',
    'mechanic',
    'technician',
    'electrician',
    'plumber',
    'warehouse',
    'driver',
    'delivery',
    'attorney',
    'lawyer',
    'accountant',
    'bookkeeper',
    'pharmacist',
    'therapist',
    'researcher',
    'data analyst',
    'data scientist',
    'architect',
    'construction',
    'chemist',
    'biologist'
  ];

  const haystack = `${job.title} ${job.description}`.toLowerCase();

  return HARD_EXCLUDED.some((keyword) => haystack.includes(keyword));
}

function isSalesLeadershipRelevant(job, targetTitles = []) {
  const title = normalizeTitle(job.title);
  const description = normalizeTitle(job.description);

  const strongTitleSignals = [
    'sales manager',
    'sales operations manager',
    'sales ops manager',
    'sales team leader',
    'team leader',
    'contact center manager',
    'contact centre manager',
    'call center manager',
    'call centre manager',
    'remote sales manager',
    'telesales manager',
    'inside sales manager',
    'outbound sales manager',
    'sales lead',
    'head of sales',
    'sales supervisor',
    'revenue operations manager',
    'sales enablement manager',
    'business development manager',
    'bdm manager',
    'outbound team leader',
    'contact centre team leader',
    'contact center team leader'
  ];

  const strongDescriptionSignals = [
    'sales',
    'revenue',
    'outbound',
    'pipeline',
    'conversion',
    'quota',
    'kpi',
    'coaching',
    'forecast',
    'crm',
    'contact center',
    'contact centre',
    'call center',
    'call centre',
    'telesales',
    'business development',
    'inside sales',
    'lead generation'
  ];

  const titleMatched = strongTitleSignals.some((signal) => title.includes(signal));

  const targetMatched = targetTitles.some((target) => {
    const t = normalizeTitle(target);
    return t && (title.includes(t) || description.includes(t));
  });

  const signalCount = strongDescriptionSignals.filter((signal) =>
    description.includes(signal)
  ).length;

  return (titleMatched || targetMatched) && signalCount >= 2;
}

function scoreJob(job, targetTitles = [], preferredLocations = []) {
  let score = 0;
  const title = normalizeTitle(job.title);
  const location = normalizeTitle(job.location);
  const description = normalizeTitle(job.description);

  const exactTitleWeights = [
    ['sales operations manager', 34],
    ['sales ops manager', 34],
    ['remote sales manager', 34],
    ['sales manager', 30],
    ['contact center manager', 30],
    ['contact centre manager', 30],
    ['call center manager', 30],
    ['call centre manager', 30],
    ['telesales manager', 28],
    ['sales team leader', 28],
    ['inside sales manager', 24],
    ['outbound sales manager', 24],
    ['business development manager', 22],
    ['outbound team leader', 22],
    ['contact center team leader', 22],
    ['contact centre team leader', 22],
    ['team leader', 14]
  ];

  for (const [phrase, points] of exactTitleWeights) {
    if (title.includes(phrase)) score += points;
  }

  for (const target of targetTitles) {
    const t = normalizeTitle(target);
    if (!t) continue;

    if (title.includes(t)) score += 18;
    else if (description.includes(t)) score += 8;
  }

  if (description.includes('sales')) score += 8;
  if (description.includes('revenue')) score += 8;
  if (description.includes('kpi')) score += 7;
  if (description.includes('quota')) score += 6;
  if (description.includes('coaching')) score += 7;
  if (description.includes('pipeline')) score += 6;
  if (description.includes('forecast')) score += 5;
  if (description.includes('crm')) score += 5;
  if (description.includes('contact center') || description.includes('contact centre')) score += 8;
  if (description.includes('call center') || description.includes('call centre')) score += 8;
  if (description.includes('telesales')) score += 8;
  if (description.includes('business development')) score += 6;
  if (description.includes('remote')) score += 8;

  if (job.remote) score += 15;

  for (const loc of preferredLocations) {
    const l = normalizeTitle(loc);
    if (!l) continue;
    if (location.includes(l)) score += 10;
  }

  if (location.includes('australia')) score += 12;
  if (location.includes('new zealand')) score += 10;
  if (location.includes('remote')) score += 10;
  if (location.includes('apac')) score += 6;
  if (location.includes('asia')) score += 5;
  if (location.includes('worldwide')) score += 4;
  if (location.includes('global')) score += 4;

  return Math.min(score, 100);
}

function filterHighIntentJobs(jobs, targetTitles = [], excludedKeywords = []) {
  return jobs.filter((job) => {
    if (containsHardExcludedKeyword(job)) return false;
    if (containsExcludedKeyword(job, excludedKeywords)) return false;
    if (!isSalesLeadershipRelevant(job, targetTitles)) return false;
    return true;
  });
}

export async function fetchAdzunaJobs({
  query,
  location,
  minSalary,
  remoteOnly,
  targetTitles = [],
  preferredLocations = [],
  excludedKeywords = []
}) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) return [];

  const countries = ['au', 'nz'];
  const results = [];

  for (const country of countries) {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: '50',
      what: query || targetTitles.join(' OR '),
      content_type: 'application/json'
    });

    if (location) params.set('where', location);
    if (minSalary) params.set('salary_min', String(minSalary));

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.results) continue;

    for (const item of data.results) {
      const job = {
        source: 'adzuna',
        external_id: String(item.id),
        title: cleanText(item.title),
        company: cleanText(item.company?.display_name),
        location: cleanText(item.location?.display_name || country.toUpperCase()),
        salary_min: normalizeMoney(item.salary_min),
        salary_max: normalizeMoney(item.salary_max),
        salary_text: buildSalaryText(item.salary_min, item.salary_max),
        remote: /remote/i.test(`${item.title} ${item.description || ''}`),
        apply_url: cleanText(item.redirect_url),
        description: cleanText(item.description),
        matched_title: '',
        fit_score: 0,
        raw: item
      };

      if (remoteOnly && !job.remote) continue;
      if (containsExcludedKeyword(job, excludedKeywords)) continue;
      if (containsHardExcludedKeyword(job)) continue;

      const matches = getTargetTitleMatches(job, targetTitles);
      job.matched_title = matches[0] || '';
      job.fit_score = scoreJob(job, targetTitles, preferredLocations);

      results.push(job);
    }
  }

  return results;
}

export async function fetchMuseJobs({
  targetTitles = [],
  preferredLocations = [],
  excludedKeywords = []
}) {
  const results = [];
  const pages = [1, 2, 3];

  for (const page of pages) {
    const url = `https://www.themuse.com/api/public/jobs?page=${page}`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.results) continue;

    for (const item of data.results) {
      const location = (item.locations || []).map((l) => l.name).join(', ');
      const contents = cleanText(item.contents || '');

      const job = {
        source: 'muse',
        external_id: String(item.id),
        title: cleanText(item.name),
        company: cleanText(item.company?.name),
        location: location || 'Unspecified',
        salary_min: null,
        salary_max: null,
        salary_text: '',
        remote: /remote/i.test(`${item.name} ${location} ${contents}`),
        apply_url: cleanText(item.refs?.landing_page || item.refs?.apply),
        description: contents,
        matched_title: '',
        fit_score: 0,
        raw: item
      };

      if (containsExcludedKeyword(job, excludedKeywords)) continue;
      if (containsHardExcludedKeyword(job)) continue;

      const matches = getTargetTitleMatches(job, targetTitles);
      job.matched_title = matches[0] || '';
      job.fit_score = scoreJob(job, targetTitles, preferredLocations);

      results.push(job);
    }
  }

  return results;
}

export async function fetchRemotiveJobs({
  query,
  targetTitles = [],
  preferredLocations = [],
  excludedKeywords = []
}) {
  const params = new URLSearchParams();
  if (query) params.set('search', query);

  const url = `https://remotive.com/api/remote-jobs${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.jobs) return [];

  return data.jobs
    .map((item) => {
      const job = {
        source: 'remotive',
        external_id: String(item.id),
        title: cleanText(item.title),
        company: cleanText(item.company_name),
        location: cleanText(item.candidate_required_location || 'Remote'),
        salary_min: null,
        salary_max: null,
        salary_text: cleanText(item.salary || ''),
        remote: true,
        apply_url: cleanText(item.url),
        description: cleanText(item.description),
        matched_title: '',
        fit_score: 0,
        raw: item
      };

      const matches = getTargetTitleMatches(job, targetTitles);
      job.matched_title = matches[0] || '';
      job.fit_score = scoreJob(job, targetTitles, preferredLocations);

      return job;
    })
    .filter((job) => !containsExcludedKeyword(job, excludedKeywords))
    .filter((job) => !containsHardExcludedKeyword(job));
}

export async function fetchHimalayasJobs({
  query,
  targetTitles = [],
  preferredLocations = [],
  excludedKeywords = []
}) {
  const params = new URLSearchParams();
  if (query) params.set('q', query);

  const url = `https://himalayas.app/jobs/api/search${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await fetch(url);
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.jobs) return [];

  return data.jobs
    .map((item) => {
      const salaryMin = normalizeMoney(item?.salary?.minAmount || item?.minSalary);
      const salaryMax = normalizeMoney(item?.salary?.maxAmount || item?.maxSalary);

      const job = {
        source: 'himalayas',
        external_id: String(item.id || item.slug || item.url),
        title: cleanText(item.title),
        company: cleanText(item.companyName || item.company?.name),
        location: cleanText(item.location || item.country || item.timezone || 'Remote'),
        salary_min: salaryMin,
        salary_max: salaryMax,
        salary_text: buildSalaryText(salaryMin, salaryMax, ''),
        remote: true,
        apply_url: cleanText(item.applyUrl || item.url),
        description: cleanText(item.description || ''),
        matched_title: '',
        fit_score: 0,
        raw: item
      };

      const matches = getTargetTitleMatches(job, targetTitles);
      job.matched_title = matches[0] || '';
      job.fit_score = scoreJob(job, targetTitles, preferredLocations);

      return job;
    })
    .filter((job) => !containsExcludedKeyword(job, excludedKeywords))
    .filter((job) => !containsHardExcludedKeyword(job));
}

export async function fetchGreenhouseJobs({
  targetTitles = [],
  preferredLocations = [],
  excludedKeywords = []
}) {
  const tokens = String(process.env.GREENHOUSE_BOARD_TOKENS || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => x.toLowerCase() !== 'none');

  if (!tokens.length) return [];

  const results = [];

  for (const token of tokens) {
    const url = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs`;
    const response = await fetch(url);
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.jobs) continue;

    for (const item of data.jobs) {
      const location = cleanText(item.location?.name || 'Unspecified');

      const job = {
        source: 'greenhouse',
        external_id: `${token}:${item.id}`,
        title: cleanText(item.title),
        company: token,
        location,
        salary_min: null,
        salary_max: null,
        salary_text: '',
        remote: /remote/i.test(`${item.title} ${location}`),
        apply_url: cleanText(item.absolute_url),
        description: cleanText(
          item.metadata?.map((m) => `${m.name}: ${m.value}`).join('\n') || ''
        ),
        matched_title: '',
        fit_score: 0,
        raw: item
      };

      if (containsExcludedKeyword(job, excludedKeywords)) continue;
      if (containsHardExcludedKeyword(job)) continue;

      const matches = getTargetTitleMatches(job, targetTitles);
      job.matched_title = matches[0] || '';
      job.fit_score = scoreJob(job, targetTitles, preferredLocations);

      results.push(job);
    }
  }

  return results;
}

export async function fetchJoobleJobs({
  query,
  location,
  minSalary,
  targetTitles = [],
  preferredLocations = [],
  excludedKeywords = []
}) {
  const apiKey = process.env.JOOBLE_API_KEY;

  if (!apiKey) return [];

  const response = await fetch(`https://jooble.org/api/${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      keywords: query || targetTitles.join(', '),
      location: location || 'Australia',
      salary: minSalary || 0,
      page: '1',
      ResultOnPage: '50',
      companysearch: 'false'
    })
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.jobs) return [];

  return data.jobs
    .map((item) => {
      const salaryText = cleanText(item.salary || '');
      const remote = /remote|work from home|home based|anywhere/i.test(
        `${item.title} ${item.snippet || ''} ${item.location || ''}`
      );

      const job = {
        source: 'jooble',
        external_id: String(item.id),
        title: cleanText(item.title),
        company: cleanText(item.company),
        location: cleanText(item.location || 'Unspecified'),
        salary_min: null,
        salary_max: null,
        salary_text: salaryText,
        remote,
        apply_url: cleanText(item.link),
        description: cleanText(item.snippet || ''),
        matched_title: '',
        fit_score: 0,
        raw: item
      };

      const matches = getTargetTitleMatches(job, targetTitles);
      job.matched_title = matches[0] || '';
      job.fit_score = scoreJob(job, targetTitles, preferredLocations);

      return job;
    })
    .filter((job) => !containsExcludedKeyword(job, excludedKeywords))
    .filter((job) => !containsHardExcludedKeyword(job));
}

export function dedupeJobs(jobs, targetTitles = [], excludedKeywords = []) {
  const filtered = filterHighIntentJobs(jobs, targetTitles, excludedKeywords);
  const map = new Map();

  for (const job of filtered) {
    const key = `${normalizeTitle(job.title)}|${normalizeTitle(job.company)}|${normalizeTitle(job.location)}`;
    if (!map.has(key) || (job.fit_score || 0) > (map.get(key).fit_score || 0)) {
      map.set(key, job);
    }
  }

  return [...map.values()]
    .filter((job) => (job.fit_score || 0) >= 40)
    .sort((a, b) => (b.fit_score || 0) - (a.fit_score || 0));
}
