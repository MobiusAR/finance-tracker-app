'use client';

import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
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

  const iconBtn =
    'flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground';

  return (
    <header className="mb-4 md:mb-8">
      <div className="flex items-start justify-between gap-4 md:items-center">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground sm:text-sm md:mt-1">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="text-right text-[11px] text-muted-foreground md:text-sm">
            <span className="md:hidden">{format(new Date(), 'MMM d')}</span>
            <span className="hidden md:inline">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          {/* iPhone Duo rail mode with a side status column: the system cluster
              fills the top of the rail column, so theme + sign-out live here.
              Width collapses to 0 when there is no side inset. */}
          <div className="hidden max-w-[var(--has-side-inset-8)] -my-2 items-center overflow-hidden rail:flex">
            <ThemeToggle className={iconBtn} />
            <button type="button" aria-label="Sign out" onClick={handleSignOut} className={iconBtn}>
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
