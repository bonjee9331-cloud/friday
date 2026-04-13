'use client';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import AppErrorBoundary from './AppErrorBoundary';

// Load all three screens client-side only — avoids SSR hydration crashes
const LockScreen   = dynamic(() => import('./LockScreen'),   { ssr: false });
const BootSequence = dynamic(() => import('./BootSequence'), { ssr: false });
const FridayCore   = dynamic(() => import('./FridayCore'),   { ssr: false });

export default function FridayApp() {
  const [state, setState] = useState('locked');

  const handleUnlock = useCallback(() => setState('booting'), []);
  const handleBooted = useCallback(() => setState('ready'),   []);

  let screen = <FridayCore />;
  if (state === 'locked') screen = <LockScreen onUnlock={handleUnlock} />;
  if (state === 'booting') screen = <BootSequence onComplete={handleBooted} />;

  return <AppErrorBoundary>{screen}</AppErrorBoundary>;
}
