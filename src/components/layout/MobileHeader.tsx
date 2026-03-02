'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function MobileHeader() {
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

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-sidebar text-sidebar-foreground shadow-[0_1px_3px_rgba(0,0,0,0.2)] px-4 md:hidden">
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-sidebar-primary" />
        <span className="font-serif font-semibold tracking-wide">Finance Tracker</span>
      </div>

      <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  );
}
