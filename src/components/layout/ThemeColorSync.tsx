'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

const COLORS = { light: '#F5EBE0', dark: '#121A2A' } as const;

/**
 * Keep <meta name="theme-color"> equal to the page background for the theme
 * the app is actually showing (the in-app toggle can differ from the system
 * setting the media-query metas follow). Safari paints its side column on the
 * folded iPhone Duo from the page colour, so a mismatch shows as a seam.
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (resolvedTheme !== 'light' && resolvedTheme !== 'dark') return;
    const color = COLORS[resolvedTheme];
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', color));
  }, [resolvedTheme]);
  return null;
}
