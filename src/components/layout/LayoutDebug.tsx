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

  const rows: [string, string | number | null][] = [
    ['mode', info.mode],
    ['display-mode', info.displayMode],
    ['nav.standalone', info.navigatorStandalone],
    ['viewport', info.viewportMeta],
    ['env T/R/B/L', `${fmtSide(info.insets.top)}/${fmtSide(info.insets.right)}/${fmtSide(info.insets.bottom)}/${fmtSide(info.insets.left)}`],
    ['pad T/R/B/L', `${fmtSide(info.insetPad.top)}/${fmtSide(info.insetPad.right)}/${fmtSide(info.insetPad.bottom)}/${fmtSide(info.insetPad.left)}`],
    ['css T/R/B/L', `${info.computed['--sat']}/${info.computed['--sar']}/${info.computed['--sab']}/${info.computed['--sal']}`],
    ['used inset R', Math.round(info.measures.used)],
    ['--rail-col', info.computed['--rail-col']],
    ['--rail-left', info.computed['--rail-left']],
    ['--rail-top', info.computed['--rail-top']],
    ['--rail-content-pr', info.computed['--rail-content-pr']],
    ['inner', `${info.innerWidth}×${info.innerHeight}`],
    ['outer', `${info.outerWidth}×${info.outerHeight}`],
    ['clientW', info.clientWidth],
    ['vv', info.visualViewportWidth != null ? `${Math.round(info.visualViewportWidth)}×${Math.round(info.visualViewportHeight ?? 0)}` : 'n/a'],
    ['screen', `${info.screenWidth}×${info.screenHeight}`],
    ['screen−inner', info.screenMinusInner],
    ['fixed CB', `${Math.round(info.cbLeft)}–${Math.round(info.cbRight)}`],
    ['gap', Math.round(info.gap)],
    ['rail rect', info.railRect],
    ['clamped', info.clamped ? 'yes' : 'no'],
    ['fallback', info.fallback ? 'yes' : 'no'],
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
