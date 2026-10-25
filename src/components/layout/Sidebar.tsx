'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { navigation } from '@/lib/navigation';
import { TransitionLink } from './TransitionLink';
import { ThemeToggle } from './ThemeToggle';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  // Below lg this renders as a compact icon rail (unfolded iPhone Duo, small
  // tablets); from lg up it expands into the full labelled sidebar.
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-dvh w-[calc(5rem+var(--sal))] flex-col bg-sidebar pl-[var(--sal)] pt-[var(--sat)] pb-[var(--sab)] text-sidebar-foreground lg:w-[calc(16rem+var(--sal))]">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center justify-center gap-2 border-b border-sidebar-border lg:justify-start lg:px-6">
        <Wallet className="h-6 w-6 text-terracotta" />
        <span className="hidden font-serif text-lg font-semibold tracking-wide lg:inline">Finance Tracker</span>
      </div>

      {/* Navigation */}
      <nav aria-label="Main" className="flex-1 space-y-1 overflow-y-auto p-2 lg:p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <TransitionLink
              key={item.name}
              href={item.href}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2 text-[10px] leading-tight transition-all duration-200 lg:flex-row lg:justify-start lg:gap-3 lg:px-3 lg:py-2.5 lg:text-sm',
                isActive
                  ? 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                  : 'font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-terracotta')} />
              <span className="max-w-full truncate">{item.name}</span>
            </TransitionLink>
          );
        })}
      </nav>

      {/* Footer with Theme Toggle and Sign Out */}
      <div className="flex shrink-0 flex-col items-center gap-1 border-t border-sidebar-border p-2 lg:items-stretch lg:p-4">
        <div className="flex items-center gap-2">
          <ThemeToggle className="size-11 text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground" />
          <span className="hidden text-sm text-sidebar-foreground/60 lg:inline">Theme</span>
        </div>
        <Button
          variant="ghost"
          aria-label="Sign out"
          className="size-11 justify-center p-0 text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground lg:h-9 lg:w-full lg:justify-start lg:px-4"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 lg:mr-2" />
          <span className="hidden lg:inline">Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
