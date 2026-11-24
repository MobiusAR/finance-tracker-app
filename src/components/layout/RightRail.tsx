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
 * When iOS reports a wide right safe-area (the system status column), the rail
 * lives INSIDE that column, starting below the clock / wifi icons, with
 * actions at the top and tabs at the bottom. Otherwise it is a 60px rail
 * sitting just inside the (small or zero) inset.
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
    'flex size-[var(--rail-btn)] shrink-0 items-center justify-center rounded-full text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground in-col:bg-black/40 in-col:text-white/90 in-col:shadow-none in-col:ring-1 in-col:ring-white/15 in-col:backdrop-blur-md in-col:hover:bg-black/55 in-col:hover:text-white';

  return (
    <aside
      data-rail
      className="pointer-events-none fixed inset-y-0 right-[var(--rail-right)] z-50 flex w-[var(--rail-col)] flex-col items-center pt-[calc(var(--rail-top)+var(--rail-edge-gap))] pb-[calc(var(--sab)+var(--rail-edge-gap))]"
    >
      {/* Beside (no status column): one continuous capsule. In-column: no
          chrome, just individual translucent rounds under the status icons. */}
      <div className="pointer-events-auto flex h-full min-h-0 w-full flex-col items-center justify-between rounded-full bg-sidebar p-1 shadow-lg ring-1 ring-black/5 dark:bg-card dark:shadow-none dark:ring-white/10 in-col:rounded-none in-col:bg-transparent in-col:p-0 in-col:shadow-none in-col:ring-0 dark:in-col:bg-transparent dark:in-col:ring-0">
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
                  active &&
                    'bg-sidebar-accent text-sidebar-primary hover:text-sidebar-primary in-col:bg-white/20 in-col:text-white in-col:hover:bg-white/30 in-col:hover:text-white'
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
