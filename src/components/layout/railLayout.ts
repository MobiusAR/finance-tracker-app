/** Side inset at or above this (px) is treated as a status column. */
export const RAIL_COL_MIN_PX = 44;
/** Fallback icon-rail width when there is no side status column. */
export const RAIL_FALLBACK_PX = 60;
/** Below the clock + wifi cluster (~120px on a folded Duo). */
export const RAIL_STATUS_CLUSTER_PX = 120;

export type InsetMeasures = {
  paddingProbe: number;
  widthProbe: number;
  cssVar: number;
  used: number;
};

export type FixedCB = { left: number; right: number; width: number };

export type RailBox = { left: number; right: number; width: number; height: number; top: number };

export type RailGeometryInput = {
  sar: number;
  sat: number;
  cb: FixedCB;
  viewW: number;
  viewH: number;
  clientW: number;
};

export type RailGeometry = {
  mode: 'in-column' | 'beside';
  col: number;
  left: number;
  contentPr: number;
  top: number;
  /** How far the fixed CB's right edge sits left of the viewport (debug). */
  gap: number;
  clamped: boolean;
  fallback: boolean;
};

function parsePx(raw: string): number {
  const n = parseFloat(raw.trim());
  return Number.isFinite(n) ? n : 0;
}

type InsetSide = 'top' | 'right' | 'bottom' | 'left';

const INSET_PAD: Record<InsetSide, 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft'> = {
  top: 'paddingTop',
  right: 'paddingRight',
  bottom: 'paddingBottom',
  left: 'paddingLeft',
};

const INSET_CSS_VAR: Record<InsetSide, string> = {
  top: '--sat',
  right: '--sar',
  bottom: '--sab',
  left: '--sal',
};

/** Measure a length that uses env(safe-area-inset-*) — padding is more reliable on iOS than width. */
function probeEnv(cssWidthOrPadding: 'width' | 'padding-right' | 'padding-top'): number {
  const side: InsetSide = cssWidthOrPadding === 'padding-top' ? 'top' : 'right';
  if (cssWidthOrPadding === 'width') {
    const el = document.createElement('div');
    el.style.cssText = `position:absolute;left:0;top:0;width:env(safe-area-inset-right,0px);height:0;visibility:hidden;pointer-events:none`;
    document.documentElement.appendChild(el);
    const r = el.getBoundingClientRect();
    const value = r.width || parsePx(getComputedStyle(el).width);
    el.remove();
    return value;
  }
  return probeInsetPadding(side);
}

function probeInsetPadding(side: InsetSide): number {
  const pad = {
    top: 'padding-top',
    right: 'padding-right',
    bottom: 'padding-bottom',
    left: 'padding-left',
  }[side];
  const el = document.createElement('div');
  el.style.cssText = `position:absolute;left:0;top:0;width:0;height:0;${pad}:env(safe-area-inset-${side},0px);visibility:hidden;pointer-events:none`;
  document.documentElement.appendChild(el);
  const r = el.getBoundingClientRect();
  const fromBox = side === 'top' || side === 'bottom' ? r.height : r.width;
  const fromStyle = parsePx(getComputedStyle(el)[INSET_PAD[side]]);
  el.remove();
  return Math.max(fromBox, fromStyle);
}

export type InsetSides = { top: number; right: number; bottom: number; left: number };

export function measureAllInsets(): { padding: InsetSides; cssVar: InsetSides; used: InsetSides } {
  const cs = getComputedStyle(document.documentElement);
  const padding: InsetSides = {
    top: probeInsetPadding('top'),
    right: probeInsetPadding('right'),
    bottom: probeInsetPadding('bottom'),
    left: probeInsetPadding('left'),
  };
  const cssVar: InsetSides = {
    top: parsePx(cs.getPropertyValue(INSET_CSS_VAR.top)),
    right: parsePx(cs.getPropertyValue(INSET_CSS_VAR.right)),
    bottom: parsePx(cs.getPropertyValue(INSET_CSS_VAR.bottom)),
    left: parsePx(cs.getPropertyValue(INSET_CSS_VAR.left)),
  };
  const used: InsetSides = {
    top: Math.max(padding.top, cssVar.top),
    right: Math.max(padding.right, cssVar.right),
    bottom: Math.max(padding.bottom, cssVar.bottom),
    left: Math.max(padding.left, cssVar.left),
  };
  return { padding, cssVar, used };
}

export function measureSafeAreaRight(): InsetMeasures {
  const paddingProbe = probeEnv('padding-right');
  const widthProbe = probeEnv('width');
  const cssVar = parsePx(getComputedStyle(document.documentElement).getPropertyValue('--sar'));
  const used = Math.max(paddingProbe, widthProbe, cssVar);
  return { paddingProbe, widthProbe, cssVar, used };
}

export function measureSafeAreaTop(): number {
  return Math.max(
    probeEnv('padding-top'),
    parsePx(getComputedStyle(document.documentElement).getPropertyValue('--sat'))
  );
}

/** The containing block actually used by `position: fixed; left:0; right:0`. */
export function measureFixedCB(): FixedCB {
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;top:0;left:0;right:0;height:0;visibility:hidden;pointer-events:none';
  document.documentElement.appendChild(el);
  const r = el.getBoundingClientRect();
  el.remove();
  return { left: r.left, right: r.right, width: r.width };
}

export function isBoxInsideViewport(box: { left: number; right: number; width: number }, viewW: number): boolean {
  const slop = 1;
  return box.left >= -slop && box.right <= viewW + slop && box.width >= 8 && box.left < viewW;
}

/**
 * Position the rail inside the visible viewport.
 *
 * Deterministic: left = viewW - col, width = col, where col is the reported
 * inset when it is ≥ 44px, otherwise the 60px edge rail. Never uses
 * screen.width or a measured "gap" to shift the rail to the right of
 * innerWidth — that is what sent the rail off-screen on the Duo PWA when
 * `position:fixed; right:0` was already the screen edge.
 *
 * If a measured box (getBoundingClientRect) would sit past the viewport,
 * shift it so its right edge is at viewW, or fall back to a 60px rail at
 * the visible right edge.
 */
export function computeRailGeometry(input: RailGeometryInput): RailGeometry {
  const viewW = input.viewW;
  const gap = Math.max(0, viewW - input.cb.right);
  const inCol = input.sar >= RAIL_COL_MIN_PX;
  const col = inCol ? input.sar : RAIL_FALLBACK_PX;
  const left = viewW - col;
  const contentPr = inCol ? (input.clientW >= viewW - 1 ? input.sar : 0) : RAIL_FALLBACK_PX;
  const top = Math.max(input.sat, inCol ? Math.min(col * 2, RAIL_STATUS_CLUSTER_PX) : 0);
  return {
    mode: inCol ? 'in-column' : 'beside',
    col,
    left,
    contentPr,
    top,
    gap,
    clamped: false,
    fallback: false,
  };
}

/** Pull a painted/measured rail box back into [0, viewW], or use the 60px edge fallback. */
export function clampRailToViewport(
  g: RailGeometry,
  measured: { left: number; right: number; width: number },
  viewW: number
): RailGeometry {
  if (isBoxInsideViewport(measured, viewW)) return g;

  const shift = viewW - measured.right;
  const shiftedLeft = g.left + shift;
  if (
    g.col >= 8 &&
    shiftedLeft >= -1 &&
    shiftedLeft + g.col <= viewW + 1 &&
    shiftedLeft < viewW
  ) {
    return { ...g, left: shiftedLeft, clamped: true };
  }

  const col = Math.min(RAIL_FALLBACK_PX, Math.max(8, viewW));
  return {
    ...g,
    mode: 'beside',
    col,
    left: Math.max(0, viewW - col),
    contentPr: Math.max(g.contentPr, col),
    top: g.top,
    clamped: true,
    fallback: true,
  };
}

function applyGeometry(g: RailGeometry) {
  const root = document.documentElement;
  root.style.setProperty('--rail-col', `${g.col}px`);
  root.style.setProperty('--rail-left', `${g.left}px`);
  // Keep right at auto/0 so an old negative --rail-right cannot push the rail off-screen.
  root.style.setProperty('--rail-right', '0px');
  root.style.setProperty('--rail-content-pr', `${g.contentPr}px`);
  root.style.setProperty('--rail-top', `${g.top}px`);
  root.setAttribute('data-rail-layout', g.mode);
  if (g.fallback) root.setAttribute('data-rail-fallback', '1');
  else root.removeAttribute('data-rail-fallback');
}

export function measureRailBox(): RailBox | null {
  const el = document.querySelector('[data-rail]') as HTMLElement | null;
  if (el) {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, width: r.width, height: r.height, top: r.top };
  }
  const d = document.createElement('div');
  d.style.cssText =
    'position:fixed;top:0;left:var(--rail-left);width:var(--rail-col);height:1px;visibility:hidden;pointer-events:none';
  document.documentElement.appendChild(d);
  const r = d.getBoundingClientRect();
  d.remove();
  return { left: r.left, right: r.right, width: r.width, height: r.height, top: r.top };
}

export function applyRailLayout() {
  const { used: sar } = measureSafeAreaRight();
  const sat = measureSafeAreaTop();
  const cb = measureFixedCB();
  const viewW = window.innerWidth;
  let g = computeRailGeometry({
    sar,
    sat,
    cb,
    viewW,
    viewH: window.innerHeight,
    clientW: document.documentElement.clientWidth,
  });
  applyGeometry(g);
  const measured = measureRailBox();
  if (measured) {
    const clamped = clampRailToViewport(g, measured, viewW);
    if (clamped.left !== g.left || clamped.col !== g.col || clamped.fallback) {
      g = clamped;
      applyGeometry(g);
    }
  }
  return { used: sar, mode: g.mode, geometry: g, railBox: measureRailBox() };
}

export type LayoutDebugInfo = {
  mode: string | null;
  measures: InsetMeasures;
  insets: InsetSides;
  insetPad: InsetSides;
  insetCss: InsetSides;
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  clientWidth: number;
  visualViewportWidth: number | null;
  visualViewportHeight: number | null;
  screenWidth: number;
  screenHeight: number;
  screenMinusInner: number;
  computed: Record<string, string>;
  displayMode: string;
  navigatorStandalone: string;
  viewportMeta: string;
  cbLeft: number;
  cbRight: number;
  gap: number;
  railLeft: number;
  railCol: number;
  railRect: string;
  clamped: boolean;
  fallback: boolean;
};

export function collectLayoutDebug(): LayoutDebugInfo {
  const applied = applyRailLayout();
  const measures = measureSafeAreaRight();
  const cb = measureFixedCB();
  const box = applied.railBox ?? measureRailBox();
  const cs = getComputedStyle(document.documentElement);
  const computed: Record<string, string> = {};
  for (const k of [
    '--sar',
    '--sat',
    '--sab',
    '--sal',
    '--rail-w',
    '--rail-col',
    '--rail-left',
    '--rail-right',
    '--rail-top',
    '--rail-content-pr',
    '--rail-btn',
  ]) {
    computed[k] = cs.getPropertyValue(k).trim();
  }
  const allInsets = measureAllInsets();
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const navStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  const viewportMeta =
    document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? 'missing';
  const railRect = box
    ? `${Math.round(box.left)},${Math.round(box.top)} ${Math.round(box.width)}×${Math.round(box.height)} r=${Math.round(box.right)}`
    : 'none';
  return {
    mode: document.documentElement.getAttribute('data-rail-layout'),
    measures,
    insets: allInsets.used,
    insetPad: allInsets.padding,
    insetCss: allInsets.cssVar,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    clientWidth: document.documentElement.clientWidth,
    visualViewportWidth: window.visualViewport?.width ?? null,
    visualViewportHeight: window.visualViewport?.height ?? null,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenMinusInner: window.screen.width - window.innerWidth,
    computed,
    displayMode: standalone ? 'standalone' : 'browser',
    navigatorStandalone: navStandalone == null ? 'n/a' : String(navStandalone),
    viewportMeta,
    cbLeft: cb.left,
    cbRight: cb.right,
    gap: applied.geometry.gap,
    railLeft: applied.geometry.left,
    railCol: applied.geometry.col,
    railRect,
    clamped: applied.geometry.clamped,
    fallback: applied.geometry.fallback,
  };
}

/** Boot script still applies geometry early, before React hydrates. */
export const RAIL_LAYOUT_BOOT = `(function(){try{
var MIN=${RAIL_COL_MIN_PX}, FB=${RAIL_FALLBACK_PX}, CL=${RAIL_STATUS_CLUSTER_PX};
function px(raw){var n=parseFloat(String(raw).trim());return isFinite(n)?n:0;}
function probe(prop,envName){
  var d=document.createElement('div');
  d.style.cssText='position:absolute;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;'+prop+':env('+envName+',0px)';
  document.documentElement.appendChild(d);
  var r=d.getBoundingClientRect();
  var v=prop==='padding-top'?(r.height||px(getComputedStyle(d).paddingTop)):(r.width||px(getComputedStyle(d)[prop==='width'?'width':'paddingRight']));
  d.remove();return v;
}
function measureCB(){
  var d=document.createElement('div');
  d.style.cssText='position:fixed;top:0;left:0;right:0;height:0;visibility:hidden;pointer-events:none';
  document.documentElement.appendChild(d);
  var r=d.getBoundingClientRect();d.remove();
  return {left:r.left,right:r.right};
}
var sar=Math.max(probe('padding-right','safe-area-inset-right'),probe('width','safe-area-inset-right'),px(getComputedStyle(document.documentElement).getPropertyValue('--sar')));
var sat=Math.max(probe('padding-top','safe-area-inset-top'),px(getComputedStyle(document.documentElement).getPropertyValue('--sat')));
var cb=measureCB();
var vw=window.innerWidth, cw=document.documentElement.clientWidth;
var inCol=sar>=MIN;
var col=inCol?sar:FB;
var left=vw-col;
var contentPr=inCol?(cw>=vw-1?sar:0):FB;
var top=Math.max(sat,inCol?Math.min(col*2,CL):0);
var root=document.documentElement;
function apply(){
  root.style.setProperty('--rail-col',col+'px');
  root.style.setProperty('--rail-left',left+'px');
  root.style.setProperty('--rail-right','0px');
  root.style.setProperty('--rail-content-pr',contentPr+'px');
  root.style.setProperty('--rail-top',top+'px');
  root.setAttribute('data-rail-layout',inCol?'in-column':'beside');
}
apply();
var probeEl=document.querySelector('[data-rail]');
var box;
if(probeEl){box=probeEl.getBoundingClientRect();}
else {
  var d=document.createElement('div');
  d.style.cssText='position:fixed;top:0;left:var(--rail-left);width:var(--rail-col);height:1px;visibility:hidden;pointer-events:none';
  root.appendChild(d);box=d.getBoundingClientRect();d.remove();
}
if(!(box.left>=-1&&box.right<=vw+1&&box.width>=8&&box.left<vw)){
  var shift=vw-box.right;
  var nl=left+shift;
  if(!(col>=8&&nl>=-1&&nl+col<=vw+1&&nl<vw)){
    col=Math.min(FB,Math.max(8,vw));left=Math.max(0,vw-col);inCol=false;contentPr=Math.max(contentPr,col);
  } else {left=nl;}
  apply();
}
}catch(e){}})();`;
