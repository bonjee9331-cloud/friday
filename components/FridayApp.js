'use client';
import { useState, useCallback } from 'react';
import LockScreen    from './LockScreen';
import BootSequence  from './BootSequence';
import FridayCore    from './FridayCore';

// State machine: locked -> booting -> ready
export default function FridayApp() {
  const [state, setState] = useState('locked');

  const handleUnlock   = useCallback(() => setState('booting'), []);
  const handleBooted   = useCallback(() => setState('ready'),   []);

  if (state === 'locked')  return <LockScreen   onUnlock={handleUnlock} />;
  if (state === 'booting') return <BootSequence onComplete={handleBooted} />;
  return <FridayCore />;
}