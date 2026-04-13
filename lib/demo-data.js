export const candidateProfile = {
  name: 'Ben Lynch',
  targetRoles: [
    'Sales Manager',
    'Sales Operations Manager',
    'Sales Team Leader',
    'Contact Center Manager',
    'Remote Sales Manager'
  ],
  locations: ['Australia', 'New Zealand'],
  remoteOnly: true,
  minimumSalary: '$70k',
  excludedIndustries: ['Finance', 'Investments', 'Real Estate', 'Car Sales'],
  followUpAfterDays: 3,
  prepMinutes: 30,
  maxApplicationsPerDay: 50
};

export const jobs = [
  {
    id: 'job-1',
    title: 'Remote Sales Manager',
    company: 'CloudRev',
    location: 'Australia',
    remote: true,
    salary: '$95k to $115k',
    source: 'Demo Feed',
    fitScore: 94,
    status: 'matched',
    jdSummary: 'Lead a remote B2C sales team, improve conversion, coach reps, and manage reporting.'
  },
  {
    id: 'job-2',
    title: 'Contact Centre Manager',
    company: 'Kiwi Connect',
    location: 'New Zealand',
    remote: true,
    salary: '$85k to $100k',
    source: 'Demo Feed',
    fitScore: 89,
    status: 'applied',
    jdSummary: 'Own remote contact centre performance, workforce planning, and coaching operations.'
  },
  {
    id: 'job-3',
    title: 'Sales Operations Manager',
    company: 'Pipeline Labs',
    location: 'Australia',
    remote: true,
    salary: '$110k to $125k',
    source: 'Demo Feed',
    fitScore: 91,
    status: 'interview',
    jdSummary: 'Drive dashboards, CRM process, forecasting, and sales team productivity.'
  }
];

export const applications = [
  {
    id: 'app-1',
    jobId: 'job-2',
    company: 'Kiwi Connect',
    role: 'Contact Centre Manager',
    status: 'Follow-up due',
    appliedAt: '2026-04-01',
    followUpDueAt: '2026-04-04'
  },
  {
    id: 'app-2',
    jobId: 'job-3',
    company: 'Pipeline Labs',
    role: 'Sales Operations Manager',
    status: 'Interview booked',
    appliedAt: '2026-03-29',
    followUpDueAt: '2026-04-01'
  }
];

export const interviews = [
  {
    id: 'int-1',
    company: 'Pipeline Labs',
    role: 'Sales Operations Manager',
    interviewAt: '2026-04-08 11:00 AEST',
    prepSummary:
      'Focus on remote team leadership, KPI ownership, forecasting, reporting cadence, and coaching examples.'
  }
];

export function buildInterviewPrep(role, company) {
  return {
    company,
    role,
    topTalkingPoints: [
      'Led remote sales teams and coached performance against KPIs.',
      'Managed reporting, targets, and operational discipline at scale.',
      'Built cadence, accountability, and process across distributed teams.'
    ],
    likelyQuestions: [
      'How have you improved team performance remotely?',
      'How do you manage underperformers and keep morale high?',
      'How do you use data to improve sales operations?'
    ],
    risksToAddress: [
      'Explain international location clearly and reassure on Australia/NZ remote coverage.',
      'Tailor examples to the exact operating model in the JD.'
    ]
  };
}
