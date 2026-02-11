'use client';

import { format } from 'date-fns';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="mb-4 md:mb-8">
      <div className="flex items-start justify-between gap-4 md:items-center">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">{title}</h1>
          {description && (
            <p className="text-xs text-muted-foreground sm:text-sm md:mt-1">{description}</p>
          )}
        </div>
        <div className="shrink-0 text-right text-[11px] text-muted-foreground md:text-sm">
          <span className="md:hidden">{format(new Date(), 'MMM d')}</span>
          <span className="hidden md:inline">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
        </div>
      </div>
    </header>
  );
}
