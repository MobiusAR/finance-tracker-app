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
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: TrendingUp },
  { name: 'Loans', href: '/loans', icon: HandCoins },
  { name: 'Spending', href: '/spending', icon: Receipt },
  { name: 'Categories', href: '/categories', icon: Tags },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar shadow-[0_-1px_4px_rgba(0,0,0,0.2)] md:hidden safe-area-bottom">
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
                  ? 'text-sidebar-foreground'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground'
              )}
            >
              <div className={cn(
                'flex h-7 w-12 items-center justify-center rounded-xl transition-colors',
                isActive && 'bg-sidebar-accent'
              )}>
                <item.icon className={cn('h-[18px] w-[18px]', isActive && 'text-sidebar-primary')} />
              </div>
              <span className={cn(isActive && 'font-semibold')}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
