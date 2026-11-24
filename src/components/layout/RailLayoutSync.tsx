'use client';

import { useEffect } from 'react';
import { applyRailLayout } from './railLayout';

/** Keeps data-rail-layout in sync when the fold or orientation changes. */
export function RailLayoutSync() {
  useEffect(() => {
    applyRailLayout();
    const onChange = () => applyRailLayout();
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
      vv?.removeEventListener('resize', onChange);
    };
  }, []);
  return null;
}
