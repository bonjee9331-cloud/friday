'use client';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Load all three screens client-side only — avoids SSR hydration crashes
const LockScreen   = dynamic(() => import('./LockScreen'),   { ssr: false });
const BootSequence = dynamic(() => import('./BootSequence'), { ssr: false });
const FridayCore   = dynamic(() => import('./FridayCore'),   { ssr: false });

export default function FridayApp() {
  const [state, setState] = useState('locked');

  const handleUnlock = useCallback(() => setState('booting'), []);
  const handleBooted = useCallback(() => setState('ready'),   []);

  if (state === 'locked')  return <LockScreen   onUnlock={handleUnlock} />;
  if (state === 'booting') return <BootSequence onComplete={handleBooted} />;
  return <FridayCore />;
}
