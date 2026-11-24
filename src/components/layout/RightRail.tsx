'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { navigation } from '@/lib/navigation';
import { TransitionLink } from './TransitionLink';
import { ThemeToggle } from './ThemeToggle';

/**
 * iPhone Duo style vertical rail on the right (camera-side) edge, used on the
 * folded outer display and the unfolded display in landscape.
 *
 * Geometry comes from --rail-* tokens: left is calc(100vw - width) (or the
 * same in px from applyRailLayout), width is the inset when ≥ 44px else
 * 60px. The painted box is clamped so it never sits past the viewport.
 */
export function RightRail() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('Failed to sign out');
    }
  };

  const btn =
    'flex size-[var(--rail-btn)] shrink-0 items-center justify-center rounded-full bg-black/40 text-white/90 shadow-none ring-1 ring-white/15 backdrop-blur-md transition-colors hover:bg-black/55 hover:text-white';

  return (
    <aside
      data-rail
      className="pointer-events-none fixed top-0 left-[var(--rail-left)] right-auto z-50 flex h-dvh max-h-[100dvh] w-[var(--rail-col)] flex-col items-center overflow-visible pt-[calc(var(--rail-top)+var(--rail-edge-gap))] pb-[calc(var(--sab)+var(--rail-edge-gap))]"
    >
      <div className="pointer-events-auto flex h-full min-h-0 w-full flex-col items-center justify-between">
        {/* Top: actions (slot 1 is the quick-add button, positioned by QuickAddExpense) */}
        <div className="flex flex-col items-center gap-2">
          <div className="size-[var(--rail-btn)]" aria-hidden />
          <ThemeToggle className={cn(btn, 'h-[var(--rail-btn)] w-[var(--rail-btn)]')} />
          <button type="button" aria-label="Sign out" onClick={handleSignOut} className={btn}>
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <nav
          aria-label="Main"
          className="flex min-h-0 flex-col items-center gap-2 overflow-y-auto hide-scrollbar"
        >
          {navigation.map((item) => {
            const active = pathname === item.href;
            return (
              <TransitionLink
                key={item.href}
                href={item.href}
                aria-label={item.name}
                title={item.name}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  btn,
                  active && 'bg-white/20 text-white hover:bg-white/30 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" />
              </TransitionLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
