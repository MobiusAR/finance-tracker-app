'use client';

import { format } from 'date-fns';

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="mb-4 md:mb-8">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground md:mt-1">{description}</p>
          )}
        </div>
        <div className="hidden text-right text-sm text-muted-foreground md:block">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>
    </header>
  );
}
