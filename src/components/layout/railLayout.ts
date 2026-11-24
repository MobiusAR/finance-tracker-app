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

export type RailGeometryInput = {
  sar: number;
  sat: number;
  cb: FixedCB;
  viewW: number;
  viewH: number;
  clientW: number;
  screenW: number;
  screenH: number;
  visualW?: number | null;
  visualOffsetLeft?: number;
};

export type RailGeometry = {
  mode: 'in-column' | 'beside';
  col: number;
  right: number;
  contentPr: number;
  top: number;
  physicalRight: number;
  gap: number;
  trustedScreenW: number;
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
      : r.width ||
        parsePx(getComputedStyle(el)[cssWidthOrPadding === 'width' ? 'width' : 'paddingRight']);
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

/**
 * On a phone, screen.width is the device CSS width and may include a status
 * column that window.innerWidth has already excluded. On a desktop, screen
 * is the monitor and must be ignored.
 */
export function trustedScreenWidth(
  screenW: number,
  screenH: number,
  viewW: number,
  viewH: number
): number {
  const near = (a: number, b: number) => a >= b - 2 && a <= b + 200;
  if (near(screenW, viewW)) return screenW;
  const min = Math.min(screenW, screenH);
  const max = Math.max(screenW, screenH);
  if (viewW > viewH && near(max, viewW)) return max;
  if (viewH >= viewW && near(min, viewW)) return min;
  return viewW;
}

/**
 * Work out rail box and content padding.
 *
 * After black-translucent, the webview can paint under the Duo status column,
 * but iOS may still treat `position: fixed; right: 0` as the *safe* edge —
 * the left of that column. Using width: max(inset, 60px) at right: 0 then
 * draws the rail beside the column. If the fixed CB already ends at the
 * column, a negative `right` pulls the rail into it. Content padding is the
 * column width only when the layout viewport still includes that region;
 * it is 0 when the layout is already inset (so we don't pad twice).
 */
export function computeRailGeometry(input: RailGeometryInput): RailGeometry {
  const viewW = input.viewW;
  const visualRight =
    input.visualW != null ? input.visualW + (input.visualOffsetLeft ?? 0) : viewW;
  const trustedScreenW = trustedScreenWidth(
    input.screenW,
    input.screenH,
    viewW,
    input.viewH
  );
  const physicalRight = Math.max(viewW, visualRight, trustedScreenW, input.cb.right);
  const gap = Math.max(0, physicalRight - input.cb.right);
  const colRaw = Math.max(input.sar, gap);
  const inCol = colRaw >= RAIL_COL_MIN_PX;
  const col = inCol ? colRaw : RAIL_FALLBACK_PX;
  const right = inCol ? input.cb.right - physicalRight : 0;
  const layoutIncludesColumn = input.clientW >= physicalRight - 1;
  const contentPr = inCol ? (layoutIncludesColumn ? col : 0) : RAIL_FALLBACK_PX;
  const top = Math.max(input.sat, inCol ? Math.min(col * 2, RAIL_STATUS_CLUSTER_PX) : 0);
  return {
    mode: inCol ? 'in-column' : 'beside',
    col,
    right,
    contentPr,
    top,
    physicalRight,
    gap,
    trustedScreenW,
  };
}

function applyGeometry(g: RailGeometry) {
  const root = document.documentElement;
  root.style.setProperty('--rail-col', `${g.col}px`);
  root.style.setProperty('--rail-right', `${g.right}px`);
  root.style.setProperty('--rail-content-pr', `${g.contentPr}px`);
  root.style.setProperty('--rail-top', `${g.top}px`);
  root.setAttribute('data-rail-layout', g.mode);
}

export function applyRailLayout() {
  const { used: sar } = measureSafeAreaRight();
  const sat = measureSafeAreaTop();
  const cb = measureFixedCB();
  const g = computeRailGeometry({
    sar,
    sat,
    cb,
    viewW: window.innerWidth,
    viewH: window.innerHeight,
    clientW: document.documentElement.clientWidth,
    screenW: window.screen.width,
    screenH: window.screen.height,
    visualW: window.visualViewport?.width ?? null,
    visualOffsetLeft: window.visualViewport?.offsetLeft ?? 0,
  });
  applyGeometry(g);
  return { used: Math.max(sar, g.gap), mode: g.mode, geometry: g };
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
  cbLeft: number;
  cbRight: number;
  physicalRight: number;
  gap: number;
  railRight: number;
  railCol: number;
};

export function collectLayoutDebug(): LayoutDebugInfo {
  const applied = applyRailLayout();
  const measures = measureSafeAreaRight();
  const cb = measureFixedCB();
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
    cbLeft: cb.left,
    cbRight: cb.right,
    physicalRight: applied.geometry.physicalRight,
    gap: applied.geometry.gap,
    railRight: applied.geometry.right,
    railCol: applied.geometry.col,
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
  return {left:r.left,right:r.right,width:r.width};
}
var sar=Math.max(probe('padding-right','safe-area-inset-right'),probe('width','safe-area-inset-right'),px(getComputedStyle(document.documentElement).getPropertyValue('--sar')));
var sat=Math.max(probe('padding-top','safe-area-inset-top'),px(getComputedStyle(document.documentElement).getPropertyValue('--sat')));
var cb=measureCB();
var vw=window.innerWidth, vh=window.innerHeight, cw=document.documentElement.clientWidth;
var sw=window.screen.width, sh=window.screen.height;
var vv=window.visualViewport, visualRight=vv?(vv.width+(vv.offsetLeft||0)):vw;
function near(a,b){return a>=b-2&&a<=b+200;}
var tsw=sw;
if(!near(sw,vw)){
  var mn=Math.min(sw,sh), mx=Math.max(sw,sh);
  if(vw>vh&&near(mx,vw)) tsw=mx;
  else if(vh>=vw&&near(mn,vw)) tsw=mn;
  else tsw=vw;
}
var physical=Math.max(vw,visualRight,tsw,cb.right);
var gap=Math.max(0,physical-cb.right);
var colRaw=Math.max(sar,gap);
var inCol=colRaw>=MIN;
var col=inCol?colRaw:FB;
var right=inCol?cb.right-physical:0;
var contentPr=inCol?(cw>=physical-1?col:0):FB;
var top=Math.max(sat,inCol?Math.min(col*2,CL):0);
var root=document.documentElement;
root.style.setProperty('--rail-col',col+'px');
root.style.setProperty('--rail-right',right+'px');
root.style.setProperty('--rail-content-pr',contentPr+'px');
root.style.setProperty('--rail-top',top+'px');
root.setAttribute('data-rail-layout',inCol?'in-column':'beside');
}catch(e){}})();`;
