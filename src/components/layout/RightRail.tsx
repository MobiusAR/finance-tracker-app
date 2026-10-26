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
 * folded outer display and the unfolded display in landscape. Actions are
 * grouped at the top (the quick-add + button from QuickAddExpense docks into
 * the first slot), navigation tabs sit in a capsule at the bottom.
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
    'flex size-11 items-center justify-center rounded-full text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground';

  return (
    <aside
      className="pointer-events-none fixed inset-y-0 right-0 z-50 flex w-[var(--rail-col)] flex-col items-center justify-between pt-[calc(var(--rail-top)+0.5rem)] pb-[calc(var(--sab)+0.5rem)]"
    >
      {/* Top: actions (slot 1 is the quick-add button, positioned by QuickAddExpense) */}
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        <div className="size-11" aria-hidden />
        {/* Theme + sign-out: shown here only without a side status column
            (browser testing). With one, the column is taken by the system
            cluster, so these collapse to 0 height and live in the page
            header instead (see Header). */}
        <div className="max-h-[calc(8rem-var(--has-side-inset-8))] overflow-hidden">
        <div className="flex flex-col items-center gap-1 rounded-full bg-sidebar p-1 shadow-md ring-1 ring-black/5 dark:bg-card dark:shadow-none dark:ring-white/10">
          <ThemeToggle className={cn(btn, 'h-11 w-11')} />
          <button type="button" aria-label="Sign out" onClick={handleSignOut} className={btn}>
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
        </div>
      </div>

      {/* Bottom: tab bar as a vertical capsule */}
      <nav
        aria-label="Main"
        className="pointer-events-auto flex min-h-0 flex-col items-center gap-1 overflow-y-auto rounded-full bg-sidebar p-1 shadow-lg ring-1 ring-black/5 dark:bg-card dark:shadow-none dark:ring-white/10 hide-scrollbar"
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
                'shrink-0',
                active && 'bg-sidebar-accent text-sidebar-primary hover:text-sidebar-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
            </TransitionLink>
          );
        })}
      </nav>
    </aside>
  );
}
