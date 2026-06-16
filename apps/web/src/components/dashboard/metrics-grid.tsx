'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricsGrid({
  children,
  columns = 4,
  className,
}: MetricsGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div
      className={cn(
        'grid gap-4',
        gridCols[columns],
        className,
      )}
    >
      {children}
    </div>
  );
}
