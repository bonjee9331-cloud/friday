function parseBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return fallback;

  const normalized = value.trim().toLowerCase();

  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;

  return fallback;
}

export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Job Autopilot',
  demoMode: parseBoolean(
    process.env.NEXT_PUBLIC_DEMO_MODE ?? process.env.DEMO_MODE,
    true
  )
};
