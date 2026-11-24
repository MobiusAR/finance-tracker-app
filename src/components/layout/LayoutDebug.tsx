'use client';

import { useEffect, useState } from 'react';
import { collectLayoutDebug, type LayoutDebugInfo } from './railLayout';

/** Tiny fixed readout at ?debug=layout so a phone screenshot can show insets. */
export function LayoutDebug() {
  const [info, setInfo] = useState<LayoutDebugInfo | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!/[#?&]debug=layout\b/.test(window.location.search + window.location.hash)) return;
    const run = () => setInfo(collectLayoutDebug());
    run();
    const timers = [0, 100, 500, 1500].map((ms) => window.setTimeout(run, ms));
    window.addEventListener('resize', run);
    window.visualViewport?.addEventListener('resize', run);
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener('resize', run);
      window.visualViewport?.removeEventListener('resize', run);
    };
  }, []);

  if (!info) return null;

  const rows: [string, string | number | null][] = [
    ['mode', info.mode],
    ['display', info.displayMode],
    ['pad probe', Math.round(info.measures.paddingProbe)],
    ['width probe', Math.round(info.measures.widthProbe)],
    ['css --sar', info.computed['--sar']],
    ['used inset', Math.round(info.measures.used)],
    ['--rail-col', info.computed['--rail-col']],
    ['--rail-right', info.computed['--rail-right']],
    ['--rail-top', info.computed['--rail-top']],
    ['--rail-content-pr', info.computed['--rail-content-pr']],
    ['inner', `${info.innerWidth}×${info.innerHeight}`],
    ['clientW', info.clientWidth],
    ['vv', info.visualViewportWidth != null ? `${Math.round(info.visualViewportWidth)}×${Math.round(info.visualViewportHeight ?? 0)}` : 'n/a'],
    ['screen', `${info.screenWidth}×${info.screenHeight}`],
  ];

  return (
    <div
      data-layout-debug
      style={{
        position: 'fixed',
        left: 8,
        bottom: 8,
        zIndex: 99999,
        maxWidth: '70vw',
        padding: '8px 10px',
        borderRadius: 10,
        background: 'rgba(0,0,0,0.78)',
        color: '#fff',
        font: '11px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace',
        pointerEvents: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {rows.map(([k, v]) => (
        <div key={k}>
          <span style={{ opacity: 0.65 }}>{k}: </span>
          {String(v)}
        </div>
      ))}
    </div>
  );
}
