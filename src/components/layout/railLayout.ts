/** Side inset at or above this (px) is a status column the rail lives inside. */
export const RAIL_COL_MIN_PX = 56;

export function measureSafeAreaInsets(): { right: number; top: number; bottom: number; left: number } {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:absolute;left:0;top:0;width:env(safe-area-inset-right,0px);height:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px);visibility:hidden;pointer-events:none';
  document.documentElement.appendChild(probe);
  const r = probe.getBoundingClientRect();
  const cs = getComputedStyle(probe);
  const bottom = parseFloat(cs.paddingBottom) || 0;
  const left = parseFloat(cs.paddingLeft) || 0;
  probe.remove();
  return { right: r.width, top: r.height, bottom, left };
}

export function applyRailLayout() {
  const { right } = measureSafeAreaInsets();
  let sar = right;
  // Fall back to the computed --sar token (used in tests, and if env() is
  // delayed) so a wide inset still switches into the status-column mode.
  if (sar < RAIL_COL_MIN_PX) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--sar').trim();
    const parsed = parseFloat(raw);
    if (raw.endsWith('px') && !Number.isNaN(parsed)) sar = parsed;
  }
  const mode = sar >= RAIL_COL_MIN_PX ? 'in-column' : 'beside';
  document.documentElement.setAttribute('data-rail-layout', mode);
}

/** Runs before first paint so the Duo status-column mode does not flash. */
export const RAIL_LAYOUT_BOOT = `(function(){try{var d=document.createElement('div');d.style.cssText='position:absolute;left:0;top:0;width:env(safe-area-inset-right,0px);height:0;visibility:hidden;pointer-events:none';document.documentElement.appendChild(d);var w=d.getBoundingClientRect().width;d.remove();document.documentElement.setAttribute('data-rail-layout',w>=${RAIL_COL_MIN_PX}?'in-column':'beside');}catch(e){}})();`;
