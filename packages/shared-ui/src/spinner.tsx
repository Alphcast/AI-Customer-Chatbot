import React from 'react';
import { cn } from '@shared/utils';
import { Loader2 } from 'lucide-react';

const sizeStyles = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export interface SpinnerProps {
  size?: keyof typeof sizeStyles;
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-gray-500', sizeStyles[size], className)}
      aria-label="Loading"
    />
  );
}
