'use client';

import { useEffect, useState } from 'react';
import { collectLayoutDebug, type LayoutDebugInfo } from './railLayout';
import { DEBUG_LAYOUT_EVENT, isDebugLayoutRequested } from './LayoutDebugToggle';

function fmtSide(v: number): string {
  return `${Math.round(v)}`;
}

/** Tiny fixed readout so a phone screenshot can show insets, including in the PWA. */
export function LayoutDebug() {
  const [enabled, setEnabled] = useState(false);
  const [info, setInfo] = useState<LayoutDebugInfo | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncEnabled = () => setEnabled(isDebugLayoutRequested());
    syncEnabled();
    window.addEventListener(DEBUG_LAYOUT_EVENT, syncEnabled);
    window.addEventListener('storage', syncEnabled);
    return () => {
      window.removeEventListener(DEBUG_LAYOUT_EVENT, syncEnabled);
      window.removeEventListener('storage', syncEnabled);
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setInfo(null);
      return;
    }
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
  }, [enabled]);

  if (!enabled || !info) return null;

  const g = info.geometry;
  const rows: [string, string | number | null][] = [
    ['mode', `${g.mode} (${g.side})`],
    ['display-mode', info.displayMode],
    ['nav.standalone', info.navigatorStandalone],
    ['viewport', info.viewportMeta],
    ['env T/R/B/L', `${fmtSide(info.insets.top)}/${fmtSide(info.insets.right)}/${fmtSide(info.insets.bottom)}/${fmtSide(info.insets.left)}`],
    ['rail col/top/bottom/edge', `${g.col}/${g.top}/${g.bottom}/${g.edge}`],
    ['offsetTop', g.offsetTop],
    ['inner', `${info.innerWidth}×${info.innerHeight}`],
    ['outer', `${info.outerWidth}×${info.outerHeight}`],
    ['screen', `${info.screenWidth}×${info.screenHeight}`],
    ['rail rect', info.railRect],
  ];

  return (
    <div
      data-layout-debug
      style={{
        position: 'fixed',
        left: 8,
        bottom: 8,
        zIndex: 99999,
        maxWidth: '78vw',
        maxHeight: '70vh',
        overflow: 'auto',
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
