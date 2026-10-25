'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';
import { QuickAddExpense } from '@/components/forms/QuickAddExpense';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage =
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/offline');

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Sidebar: compact icon rail on unfolded foldables / small tablets
          (fold..lg), full sidebar on lg+. Hidden on phone widths. */}
      <div className="hidden fold:block">
        <Sidebar />
      </div>

      {/* Phone header - hidden from fold width up */}
      <MobileHeader />

      {/* Main Content */}
      <main className="min-h-dvh bg-background pb-[calc(var(--mobile-nav-h)+var(--sab)+1.5rem)] fold:ml-[calc(5rem+var(--sal))] fold:pb-[calc(var(--sab)+1.5rem)] lg:ml-[calc(16rem+var(--sal))]">
        <div className="mx-auto w-full max-w-6xl py-4 pl-[max(1rem,var(--sal))] pr-[max(1rem,var(--sar))] fold:pt-[calc(var(--sat)+1.5rem)] fold:pl-6 fold:pr-[max(1.5rem,var(--sar))] lg:px-8 lg:pt-[calc(var(--sat)+2rem)]">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav - hidden on desktop */}
      <MobileNav />

      {/* Global quick-add expense FAB */}
      <QuickAddExpense />
    </>
  );
}
