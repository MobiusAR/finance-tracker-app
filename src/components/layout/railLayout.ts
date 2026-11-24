/** Side inset at or above this (px) is treated as a status column. */
export const RAIL_COL_MIN_PX = 56;

export type InsetMeasures = {
  paddingProbe: number;
  widthProbe: number;
  cssVar: number;
  used: number;
};

function parsePx(raw: string): number {
  const n = parseFloat(raw.trim());
  return Number.isFinite(n) ? n : 0;
}

/** Measure a length that uses env(safe-area-inset-*) — padding is more reliable on iOS than width. */
function probeEnv(cssWidthOrPadding: 'width' | 'padding-right' | 'padding-top'): number {
  const el = document.createElement('div');
  const inset =
    cssWidthOrPadding === 'padding-top' ? 'safe-area-inset-top' : 'safe-area-inset-right';
  if (cssWidthOrPadding === 'width') {
    el.style.cssText = `position:absolute;left:0;top:0;width:env(${inset},0px);height:0;visibility:hidden;pointer-events:none`;
  } else {
    el.style.cssText = `position:absolute;left:0;top:0;width:0;height:0;${cssWidthOrPadding}:env(${inset},0px);visibility:hidden;pointer-events:none`;
  }
  document.documentElement.appendChild(el);
  const r = el.getBoundingClientRect();
  const value =
    cssWidthOrPadding === 'padding-top'
      ? r.height || parsePx(getComputedStyle(el).paddingTop)
      : r.width || parsePx(getComputedStyle(el)[cssWidthOrPadding === 'width' ? 'width' : 'paddingRight']);
  el.remove();
  return value;
}

export function measureSafeAreaRight(): InsetMeasures {
  const paddingProbe = probeEnv('padding-right');
  const widthProbe = probeEnv('width');
  const cssVar = parsePx(getComputedStyle(document.documentElement).getPropertyValue('--sar'));
  const used = Math.max(paddingProbe, widthProbe, cssVar);
  return { paddingProbe, widthProbe, cssVar, used };
}

export function applyRailLayout() {
  const { used } = measureSafeAreaRight();
  const mode = used >= RAIL_COL_MIN_PX ? 'in-column' : 'beside';
  document.documentElement.setAttribute('data-rail-layout', mode);
  return { used, mode };
}

export type LayoutDebugInfo = {
  mode: string | null;
  measures: InsetMeasures;
  innerWidth: number;
  innerHeight: number;
  clientWidth: number;
  visualViewportWidth: number | null;
  visualViewportHeight: number | null;
  screenWidth: number;
  screenHeight: number;
  computed: Record<string, string>;
  displayMode: string;
};

export function collectLayoutDebug(): LayoutDebugInfo {
  const measures = measureSafeAreaRight();
  const cs = getComputedStyle(document.documentElement);
  const computed: Record<string, string> = {};
  for (const k of [
    '--sar',
    '--sat',
    '--rail-w',
    '--rail-col',
    '--rail-right',
    '--rail-top',
    '--rail-content-pr',
    '--rail-btn',
  ]) {
    computed[k] = cs.getPropertyValue(k).trim();
  }
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  return {
    mode: document.documentElement.getAttribute('data-rail-layout'),
    measures,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    clientWidth: document.documentElement.clientWidth,
    visualViewportWidth: window.visualViewport?.width ?? null,
    visualViewportHeight: window.visualViewport?.height ?? null,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    computed,
    displayMode: standalone ? 'standalone' : 'browser',
  };
}

/** Boot script still sets the data attribute early for debug; layout itself is CSS. */
export const RAIL_LAYOUT_BOOT = `(function(){try{var d=document.createElement('div');d.style.cssText='position:absolute;left:0;top:0;width:0;height:0;padding-right:env(safe-area-inset-right,0px);visibility:hidden;pointer-events:none';document.documentElement.appendChild(d);var w=d.getBoundingClientRect().width;d.remove();document.documentElement.setAttribute('data-rail-layout',w>=${RAIL_COL_MIN_PX}?'in-column':'beside');}catch(e){}})();`;
