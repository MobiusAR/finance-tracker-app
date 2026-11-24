'use client';

import { useRef, type PointerEvent, type ReactNode } from 'react';

export const DEBUG_LAYOUT_KEY = 'debugLayout';
export const DEBUG_LAYOUT_EVENT = 'debug-layout-change';

export function isDebugLayoutRequested(): boolean {
  if (typeof window === 'undefined') return false;
  if (/[#?&]debug=layout\b/.test(window.location.search + window.location.hash)) return true;
  try {
    const v = window.localStorage.getItem(DEBUG_LAYOUT_KEY);
    return v === '1' || v === 'true';
  } catch {
    return false;
  }
}

/** Toggle the overlay via localStorage. The ?debug=layout query still forces it on. */
export function toggleDebugLayout(): boolean {
  const next = !isDebugLayoutRequested();
  try {
    if (next) window.localStorage.setItem(DEBUG_LAYOUT_KEY, '1');
    else window.localStorage.removeItem(DEBUG_LAYOUT_KEY);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(DEBUG_LAYOUT_EVENT));
  return next;
}

/**
 * Hidden hotspot: triple-tap or long-press (~650ms) to toggle the layout
 * debug overlay. Used on the page title and date so it works in a
 * home-screen PWA that has no URL bar.
 */
export function LayoutDebugHotspot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const taps = useRef<number[]>([]);
  const holdTimer = useRef<number | null>(null);
  const ignoreClick = useRef(false);

  const fire = () => {
    toggleDebugLayout();
    try {
      navigator.vibrate?.(15);
    } catch {
      /* ignore */
    }
  };

  const clearHold = () => {
    if (holdTimer.current != null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    clearHold();
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      ignoreClick.current = true;
      fire();
    }, 650);
  };

  const onClick = () => {
    if (ignoreClick.current) {
      ignoreClick.current = false;
      return;
    }
    const now = Date.now();
    taps.current = taps.current.filter((t) => now - t < 500);
    taps.current.push(now);
    if (taps.current.length >= 3) {
      taps.current = [];
      fire();
    }
  };

  return (
    <span
      className={className}
      onPointerDown={onPointerDown}
      onPointerUp={clearHold}
      onPointerCancel={clearHold}
      onContextMenu={(e) => e.preventDefault()}
      onClick={onClick}
      style={{ WebkitUserSelect: 'none', userSelect: 'none', WebkitTouchCallout: 'none' }}
    >
      {children}
    </span>
  );
}
