'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  Tags,
  HandCoins,
  CalendarDays,
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: TrendingUp },
  { name: 'Spending', href: '/spending', icon: Receipt },
  { name: 'Subs', href: '/subscriptions', icon: CalendarDays },
  { name: 'Loans', href: '/loans', icon: HandCoins },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card shadow-[0_-1px_4px_rgba(27,38,59,0.06)] md:hidden safe-area-bottom">
      <div className="flex items-center justify-around">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors',
                isActive
                  ? 'text-terracotta'
                  : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                isActive && 'bg-terracotta/10'
              )}>
                <item.icon className="h-[18px] w-[18px]" />
              </div>
              <span className={cn(isActive && 'font-semibold')}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
