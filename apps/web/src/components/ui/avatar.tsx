'use client';

import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import type { HTMLAttributes } from 'react';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

function Avatar({
  className,
  src,
  alt,
  fallback,
  size = 'md',
  ...props
}: AvatarProps) {
  if (src) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-full',
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        <img
          src={src}
          alt={alt || ''}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden absolute inset-0 flex items-center justify-center bg-muted font-medium text-muted-foreground">
          {fallback || '?'}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {fallback || '?'}
    </div>
  );
}

export { Avatar };
