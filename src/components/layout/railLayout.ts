/**
 * iPhone Duo rail geometry.
 *
 * Two modes, picked from the safe-area insets alone:
 *
 *  strip  - iOS hands the page its side status column as a safe-area inset
 *           (a Home Screen web app on the Duo with viewport-fit=cover: 84px on
 *           the camera side). The rail sits *in* that column, under the clock
 *           and Dynamic Island, like a native app's vertical bars.
 *  inline - no side inset (a Safari tab, where Safari owns its column, or any
 *           other browser): a rail of our own inside the right edge of the page.
 *
 * Numbers in DUO are the native SwiftUI bar positions measured on the iPhone
 * Duo simulator (iOS 27.1) and checked on a device by the duet-ui project
 * (github.com/JayFarei/duet, packages/duet-ui/src/geometry.ts, MIT). They are
 * iOS points, which equal CSS px.
 */
export const DUO = {
  /** A side inset at or above this is the Duo's status column (84 measured; an iPhone's landscape sensor inset is 59). */
  stripMin: 60,
  /** Top of the first native bar item, in screen coordinates: clear of the clock and a bare Dynamic Island. */
  firstSlotTop: 173.3,
  /** Native bar bottom above the screen bottom. */
  bottom: 23.7,
  /** Native control centre line from the screen edge. */
  centerFromEdge: 48.2,
  /** Round control size. */
  control: 49,
  /** Tab capsule: padding (both ends together) and per-item pitch. */
  pillPad: 12.7,
  pillItem: 50,
  /** Gap between stacked groups. */
  gap: 11,
  /** Width of our own rail when iOS gives us no column. */
  inlineCol: 72,
} as const;

export type RailMode = 'strip' | 'inline';
export type RailSide = 'left' | 'right';

export type InsetSides = { top: number; right: number; bottom: number; left: number };

export type RailGeometryInput = {
  insets: InsetSides;
  innerWidth: number;
  innerHeight: number;
  screenWidth: number;
  screenHeight: number;
};

export type RailGeometry = {
  mode: RailMode;
  side: RailSide;
  /** Rail width: the inset in strip mode, DUO.inlineCol inline. */
  col: number;
  /** Rail control area top / bottom, in viewport px. */
  top: number;
  bottom: number;
  /** Distance from the screen edge to the controls' outer edge. */
  edge: number;
  /** Page-coordinate offset of the viewport below the screen top (strip mode). */
  offsetTop: number;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

export function computeRailGeometry(i: RailGeometryInput): RailGeometry {
  const { insets } = i;
  const side: RailSide = insets.left > insets.right ? 'left' : 'right';
  const inset = Math.max(insets.left, insets.right);

  if (inset >= DUO.stripMin) {
    const landscape = i.innerWidth > i.innerHeight;
    const long = Math.max(i.screenWidth, i.screenHeight);
    const short = Math.min(i.screenWidth, i.screenHeight);
    const screenH = landscape ? short : long;
    const offsetTop = Math.max(0, screenH - i.innerHeight);
    const top = Math.max(insets.top + DUO.gap, DUO.firstSlotTop - offsetTop);
    return {
      mode: 'strip',
      side,
      col: inset,
      top: round1(top),
      bottom: round1(Math.max(DUO.bottom, insets.bottom)),
      edge: round1(DUO.centerFromEdge - DUO.control / 2),
      offsetTop: round1(offsetTop),
    };
  }

  return {
    mode: 'inline',
    side: 'right',
    col: DUO.inlineCol + insets.right,
    top: round1(insets.top + 12),
    bottom: round1(insets.bottom + 12),
    edge: round1(insets.right + (DUO.inlineCol - DUO.control) / 2),
    offsetTop: 0,
  };
}

/** How many tabs fit in the bottom capsule under a top group of `topControls` round buttons. */
export function tabsThatFit(g: Pick<RailGeometry, 'top' | 'bottom'>, viewH: number, topControls: number): number {
  const topGroup = topControls * DUO.control + Math.max(0, topControls - 1) * DUO.gap;
  const room = viewH - g.top - g.bottom - topGroup - DUO.gap;
  return Math.max(1, Math.floor((room - DUO.pillPad) / DUO.pillItem));
}

function parsePx(raw: string): number {
  const n = parseFloat(String(raw).trim());
  return Number.isFinite(n) ? n : 0;
}

/** env(safe-area-inset-*) read through padding (more reliable on iOS than width). */
function probeInset(side: keyof InsetSides): number {
  const el = document.createElement('div');
  // Through the --sa* custom properties (globals.css: env(safe-area-inset-*)),
  // so there is one definition of each inset.
  const v = { top: '--sat', right: '--sar', bottom: '--sab', left: '--sal' }[side];
  el.style.cssText = `position:absolute;left:0;top:0;width:0;height:0;padding-${side}:var(${v},env(safe-area-inset-${side},0px));visibility:hidden;pointer-events:none`;
  document.documentElement.appendChild(el);
  const r = el.getBoundingClientRect();
  const box = side === 'top' || side === 'bottom' ? r.height : r.width;
  const cs = getComputedStyle(el);
  const pad = parsePx(
    side === 'top' ? cs.paddingTop : side === 'right' ? cs.paddingRight : side === 'bottom' ? cs.paddingBottom : cs.paddingLeft
  );
  el.remove();
  return Math.max(box, pad);
}

export function measureInsets(): InsetSides {
  return {
    top: probeInset('top'),
    right: probeInset('right'),
    bottom: probeInset('bottom'),
    left: probeInset('left'),
  };
}

export function applyGeometry(g: RailGeometry) {
  const root = document.documentElement;
  root.style.setProperty('--rail-col', `${g.col}px`);
  root.style.setProperty('--rail-top', `${g.top}px`);
  root.style.setProperty('--rail-bottom', `${g.bottom}px`);
  root.style.setProperty('--rail-edge', `${g.edge}px`);
  root.setAttribute('data-rail-layout', g.mode);
  root.setAttribute('data-rail-side', g.side);
}

export function readRailGeometry(): RailGeometry {
  return computeRailGeometry({
    insets: measureInsets(),
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  });
}

export function applyRailLayout(): RailGeometry {
  const g = readRailGeometry();
  applyGeometry(g);
  window.dispatchEvent(new CustomEvent(RAIL_GEOMETRY_EVENT, { detail: g }));
  return g;
}

export const RAIL_GEOMETRY_EVENT = 'rail-geometry';

/**
 * Inline pre-paint copy of applyGeometry(readRailGeometry()) so the first
 * frame already has the right rail. Kept in sync with computeRailGeometry
 * by hand: same constants, same branches.
 */
export const RAIL_LAYOUT_BOOT = `(function(){try{
var D=${JSON.stringify(DUO)};
var V={top:'--sat',right:'--sar',bottom:'--sab',left:'--sal'};
function p(s){var e=document.createElement('div');e.style.cssText='position:absolute;left:0;top:0;width:0;height:0;visibility:hidden;padding-'+s+':var('+V[s]+',env(safe-area-inset-'+s+',0px))';document.documentElement.appendChild(e);var r=e.getBoundingClientRect();var v=(s==='top'||s==='bottom')?r.height:r.width;e.remove();return v||0;}
var t=p('top'),r=p('right'),b=p('bottom'),l=p('left');
var side=l>r?'left':'right',ins=Math.max(l,r),w=innerWidth,h=innerHeight,g;
if(ins>=D.stripMin){var sw=screen.width,sh=screen.height,S=w>h?Math.min(sw,sh):Math.max(sw,sh),off=Math.max(0,S-h);
g={mode:'strip',side:side,col:ins,top:Math.max(t+D.gap,D.firstSlotTop-off),bottom:Math.max(D.bottom,b),edge:D.centerFromEdge-D.control/2};}
else g={mode:'inline',side:'right',col:D.inlineCol+r,top:t+12,bottom:b+12,edge:r+(D.inlineCol-D.control)/2};
var s=document.documentElement.style;
s.setProperty('--rail-col',g.col+'px');s.setProperty('--rail-top',(Math.round(g.top*10)/10)+'px');
s.setProperty('--rail-bottom',(Math.round(g.bottom*10)/10)+'px');s.setProperty('--rail-edge',(Math.round(g.edge*10)/10)+'px');
document.documentElement.setAttribute('data-rail-layout',g.mode);document.documentElement.setAttribute('data-rail-side',g.side);
}catch(e){}})();`;

export type LayoutDebugInfo = {
  geometry: RailGeometry;
  insets: InsetSides;
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  screenWidth: number;
  screenHeight: number;
  displayMode: string;
  navigatorStandalone: string;
  viewportMeta: string;
  railRect: string;
};

export function collectLayoutDebug(): LayoutDebugInfo {
  const geometry = applyRailLayout();
  const el = document.querySelector('[data-rail]') as HTMLElement | null;
  const box = el?.getBoundingClientRect();
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const navStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
  return {
    geometry,
    insets: measureInsets(),
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    displayMode: standalone ? 'standalone' : 'browser',
    navigatorStandalone: String(navStandalone),
    viewportMeta: document.querySelector('meta[name="viewport"]')?.getAttribute('content') ?? 'missing',
    railRect: box
      ? `${Math.round(box.left)},${Math.round(box.top)} ${Math.round(box.width)}×${Math.round(box.height)}`
      : 'none',
  };
}
