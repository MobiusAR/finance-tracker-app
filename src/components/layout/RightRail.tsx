'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Ellipsis, LogOut, Moon, Plus, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { navigation } from '@/lib/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TransitionLink } from './TransitionLink';
import { DUO, RAIL_GEOMETRY_EVENT, readRailGeometry, tabsThatFit, type RailGeometry } from './railLayout';
import { QUICK_ADD_EVENT } from '@/components/forms/QuickAddExpense';

/** Round controls in the top group: Add, More. */
const TOP_CONTROLS = 2;

/**
 * iPhone Duo vertical bars, used on the folded outer display and the unfolded
 * display in landscape. Laid out like the native ones: actions at the top
 * (Add, then the "…" overflow), tabs in a capsule at the bottom. Tabs that do
 * not fit the height move into "…", the selected one always stays visible.
 *
 * In a Home Screen app on the Duo the rail sits in iOS's status column under
 * the clock (strip mode); elsewhere it is a rail of our own at the page edge.
 */
export function RightRail() {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [geo, setGeo] = useState<RailGeometry | null>(null);
  const [viewH, setViewH] = useState(0);

  useEffect(() => {
    const read = () => {
      setGeo(readRailGeometry());
      setViewH(window.innerHeight);
    };
    read();
    const onGeo = (e: Event) => {
      setGeo((e as CustomEvent<RailGeometry>).detail);
      setViewH(window.innerHeight);
    };
    window.addEventListener(RAIL_GEOMETRY_EVENT, onGeo);
    window.addEventListener('resize', read);
    return () => {
      window.removeEventListener(RAIL_GEOMETRY_EVENT, onGeo);
      window.removeEventListener('resize', read);
    };
  }, []);

  const activeIndex = Math.max(
    0,
    navigation.findIndex((n) => (n.href === '/' ? pathname === '/' : pathname.startsWith(n.href)))
  );

  const { shown, hidden } = useMemo(() => {
    const fit = geo && viewH ? Math.min(navigation.length, tabsThatFit(geo, viewH, TOP_CONTROLS)) : navigation.length;
    if (fit >= navigation.length) return { shown: navigation, hidden: [] as typeof navigation };
    const shown = navigation.slice(0, fit);
    // Keep the selected tab on screen: it takes the last slot.
    if (activeIndex >= fit) shown[fit - 1] = navigation[activeIndex];
    return { shown, hidden: navigation.filter((n) => !shown.includes(n)) };
  }, [geo, viewH, activeIndex]);

  const bubbleIndex = shown.findIndex((n) => n === navigation[activeIndex]);

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

  const isDark = resolvedTheme === 'dark';
  const round =
    'flex size-[49px] shrink-0 items-center justify-center rounded-full outline-none transition-[transform,background-color,color] duration-200 active:scale-[0.92] focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <aside
      data-rail
      aria-label="App controls"
      className={cn(
        'pointer-events-none fixed inset-y-0 z-50 flex w-[var(--rail-col)] flex-col',
        'pt-[var(--rail-top)] pb-[var(--rail-bottom)]',
        'right-0 in-data-[rail-side=left]:right-auto in-data-[rail-side=left]:left-0'
      )}
    >
      <div
        className={cn(
          'flex h-full min-h-0 flex-col items-end justify-between',
          'pr-[var(--rail-edge)] in-data-[rail-side=left]:items-start in-data-[rail-side=left]:pr-0 in-data-[rail-side=left]:pl-[var(--rail-edge)]'
        )}
      >
        {/* Actions: Add is the primary job, "…" holds the rest. */}
        <div className="pointer-events-auto flex flex-col items-center" style={{ gap: DUO.gap }}>
          <button
            type="button"
            aria-label="Add expense"
            title="Add expense"
            onClick={() => window.dispatchEvent(new Event(QUICK_ADD_EVENT))}
            className={cn(round, 'rail-primary')}
          >
            <Plus className="size-[22px]" strokeWidth={2.25} />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="More"
                title="More"
                className={cn(round, 'rail-glass relative text-foreground/85 hover:text-foreground')}
              >
                <Ellipsis className="size-[21px]" strokeWidth={2} />
                {hidden.some((n) => n === navigation[activeIndex]) && (
                  <span className="absolute size-1.5 translate-x-3 -translate-y-3 rounded-full bg-terracotta" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="left"
              align="start"
              sideOffset={10}
              className="min-w-52 rounded-2xl border-border/60 bg-popover/95 p-1.5 shadow-2xl backdrop-blur-xl"
            >
              {hidden.length > 0 && (
                <>
                  <DropdownMenuLabel className="px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                    More places
                  </DropdownMenuLabel>
                  {hidden.map((item) => (
                    <DropdownMenuItem
                      key={item.href}
                      onSelect={() => router.push(item.href)}
                      className="gap-3 rounded-xl px-2.5 py-2.5 text-[15px]"
                    >
                      <item.icon className="size-[18px]" />
                      {item.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="mx-2 my-1.5" />
                </>
              )}
              <DropdownMenuItem
                onSelect={() => setTheme(isDark ? 'light' : 'dark')}
                className="gap-3 rounded-xl px-2.5 py-2.5 text-[15px]"
              >
                {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
                {isDark ? 'Light appearance' : 'Dark appearance'}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={handleSignOut}
                className="gap-3 rounded-xl px-2.5 py-2.5 text-[15px]"
              >
                <LogOut className="size-[18px]" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs: one capsule, the selected place in a sliding bubble. */}
        <nav
          aria-label="Main"
          className="rail-glass pointer-events-auto relative flex w-[49px] flex-col items-center rounded-full"
          style={{ paddingBlock: DUO.pillPad / 2 }}
        >
          {bubbleIndex >= 0 && (
            <span
              aria-hidden
              className="rail-bubble absolute left-1/2 size-[41px] rounded-full"
              style={{
                top: DUO.pillPad / 2 + (DUO.pillItem - 41) / 2,
                transform: `translate(-50%, ${bubbleIndex * DUO.pillItem}px)`,
              }}
            />
          )}
          {shown.map((item, i) => {
            const active = i === bubbleIndex;
            return (
              <TransitionLink
                key={item.href}
                href={item.href}
                aria-label={item.name}
                title={item.name}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex w-full items-center justify-center rounded-full outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'text-terracotta' : 'text-muted-foreground hover:text-foreground'
                )}
                style={{ height: DUO.pillItem }}
              >
                <item.icon className="size-[21px]" strokeWidth={active ? 2.1 : 1.75} />
              </TransitionLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
