import {
  candidateProfile as demoCandidateProfile,
  jobs as demoJobs,
  applications as demoApplications,
  interviews as demoInterviews
} from './demo-data';
import { appConfig } from './config';

const liveCandidateProfile = {
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

export const candidateProfile = appConfig.demoMode
  ? demoCandidateProfile
  : liveCandidateProfile;

export const jobs = appConfig.demoMode ? demoJobs : [];
export const applications = appConfig.demoMode ? demoApplications : [];
export const interviews = appConfig.demoMode ? demoInterviews : [];
