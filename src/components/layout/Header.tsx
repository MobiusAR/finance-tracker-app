'use client';

import { format } from 'date-fns';
import { LayoutDebugHotspot } from './LayoutDebugToggle';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="mb-4 md:mb-8">
      <div className="flex items-start justify-between gap-4 md:items-center">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">
            <LayoutDebugHotspot>{title}</LayoutDebugHotspot>
          </h1>
          {description && (
            <p className="text-xs text-muted-foreground sm:text-sm md:mt-1">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="text-right text-[11px] text-muted-foreground md:text-sm">
            <LayoutDebugHotspot>
              <span className="md:hidden">{format(new Date(), 'MMM d')}</span>
              <span className="hidden md:inline">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
            </LayoutDebugHotspot>
          </div>
        </div>
      </div>
    </header>
  );
}
