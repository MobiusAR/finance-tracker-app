'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    if (!mounted) {
        // Prevent hydration mismatch — render a placeholder
        return (
            <Button variant="ghost" size="icon" className={cn('relative h-9 w-9', className)}>
                <span className="h-5 w-5" />
            </Button>
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className={cn('relative h-9 w-9 overflow-hidden', className)}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {/* Sun icon — visible in dark mode (click to go light) */}
            <Sun
                className={cn(
                    'absolute h-5 w-5 transition-all duration-500 ease-in-out',
                    isDark
                        ? 'rotate-0 scale-100 opacity-100'
                        : 'rotate-90 scale-0 opacity-0'
                )}
            />
            {/* Moon icon — visible in light mode (click to go dark) */}
            <Moon
                className={cn(
                    'absolute h-5 w-5 transition-all duration-500 ease-in-out',
                    isDark
                        ? '-rotate-90 scale-0 opacity-0'
                        : 'rotate-0 scale-100 opacity-100'
                )}
            />
        </Button>
    );
}
