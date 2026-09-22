'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { MoreHorizontal } from 'lucide-react';
import { mobileCoreNav, mobileMoreNav } from '@/lib/navigation';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { TransitionLink } from './TransitionLink';

export function MobileNav() {
  const pathname = usePathname();
  const isMoreActive = mobileMoreNav.some((item) => pathname === item.href);

  const renderItem = (item: { name: string; href: string; icon: typeof mobileCoreNav[number]['icon'] }, active: boolean) => (
    <TransitionLink
      key={item.href}
      href={item.href}
      aria-label={item.name}
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors',
        active
          ? 'text-sidebar-foreground'
          : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
      )}
    >
      <div className={cn(
        'flex h-7 w-12 items-center justify-center rounded-xl transition-colors',
        active && 'bg-sidebar-accent'
      )}>
        <item.icon className={cn('h-[18px] w-[18px]', active && 'text-sidebar-primary')} />
      </div>
      <span className={cn(active && 'font-semibold')}>{item.name}</span>
    </TransitionLink>
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar shadow-[0_-1px_4px_rgba(0,0,0,0.2)] md:hidden safe-area-bottom">
      <div className="flex items-center justify-around">
        {mobileCoreNav.map((item) => renderItem(item, pathname === item.href))}

        <Sheet>
          <SheetContent side="bottom" className="bg-sidebar text-sidebar-foreground" showCloseButton={false}>
            <SheetHeader>
              <SheetTitle className="text-sidebar-foreground font-serif">More</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 pb-6">
              {mobileMoreNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <SheetClose asChild key={item.href}>
                    <TransitionLink
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-foreground'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      )}
                    >
                      <item.icon className={cn('h-5 w-5', active && 'text-sidebar-primary')} />
                      {item.name}
                    </TransitionLink>
                  </SheetClose>
                );
              })}
            </div>
          </SheetContent>

          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="More pages"
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors',
                isMoreActive
                  ? 'text-sidebar-foreground'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
              )}
            >
              <div className={cn(
                'flex h-7 w-12 items-center justify-center rounded-xl transition-colors',
                isMoreActive && 'bg-sidebar-accent'
              )}>
                <MoreHorizontal className={cn('h-[18px] w-[18px]', isMoreActive && 'text-sidebar-primary')} />
              </div>
              <span className={cn(isMoreActive && 'font-semibold')}>More</span>
            </button>
          </SheetTrigger>
        </Sheet>
      </div>
    </nav>
  );
}
