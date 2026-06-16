import React from 'react';
import { cn } from '@shared/utils';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className, variant = 'text', width, height }: SkeletonProps) {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        variantStyles[variant],
        className,
      )}
      style={{ width, height }}
    />
  );
}

export function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, idx) => (
        <td key={idx} className="px-4 py-3">
          <Skeleton className="h-4" />
        </td>
      ))}
    </tr>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <Skeleton className="mb-4 h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton key={idx} className="mb-2 h-4" />
      ))}
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
