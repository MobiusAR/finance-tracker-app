'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { MobileHeader } from './MobileHeader';
import { RightRail } from './RightRail';
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
      {/* Desktop (lg+): full left sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Unfolded portrait: standard horizontal bars */}
      <div className="hidden bars:block">
        <MobileHeader />
      </div>

      {/* Folded + unfolded landscape: right-side vertical rail (iPhone Duo HIG) */}
      <div className="hidden rail:block">
        <RightRail />
      </div>

      {/* Main content. Background stays full-bleed; only the inner content
          is padded away from the bars/rail and the (asymmetric) safe areas. */}
      <main className="min-h-dvh bg-background lg:ml-[calc(16rem+var(--sal))] bars:pb-[calc(var(--mobile-nav-h)+var(--sab)+1.5rem)] rail:pb-[calc(var(--sab)+1rem)]">
        <div className="mx-auto w-full max-w-6xl px-8 py-8 lg:pt-[calc(var(--sat)+2rem)] bars:max-w-3xl bars:py-6 bars:pl-[max(1.5rem,var(--sal))] bars:pr-[max(1.5rem,var(--sar))] rail:pt-[calc(var(--sat)+1rem)] rail:pl-[max(0.75rem,var(--sal))] rail:pr-[calc(var(--rail-w)+var(--sar)+0.5rem)]">
          {children}
        </div>
      </main>

      <div className="hidden bars:block">
        <MobileNav />
      </div>

      {/* Global quick-add expense: FAB on desktop/bars, top button of the rail in rail mode */}
      <QuickAddExpense />
    </>
  );
}
