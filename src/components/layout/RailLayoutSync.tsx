'use client';

import { useEffect } from 'react';
import { applyRailLayout } from './railLayout';

/** Re-measure insets after they settle (iOS often reports 0 at first paint). */
export function RailLayoutSync() {
  useEffect(() => {
    const run = () => applyRailLayout();
    run();
    const timers = [0, 50, 200, 500, 1000, 2000].map((ms) => window.setTimeout(run, ms));
    window.addEventListener('load', run);
    window.addEventListener('resize', run);
    window.addEventListener('orientationchange', run);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', run);
    vv?.addEventListener('scroll', run);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('load', run);
      window.removeEventListener('resize', run);
      window.removeEventListener('orientationchange', run);
      vv?.removeEventListener('resize', run);
      vv?.removeEventListener('scroll', run);
    };
  }, []);
  return null;
}
