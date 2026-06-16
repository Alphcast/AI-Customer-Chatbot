import React, { type ImgHTMLAttributes } from 'react';
import { cn, generateColorFromString } from '@shared/utils';

const sizeStyles = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  xxl: 'h-20 w-20 text-2xl',
};

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  name?: string;
  size?: keyof typeof sizeStyles;
  fallback?: string;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Avatar({ name, size = 'md', fallback, src, alt, className, ...props }: AvatarProps) {
  const initials = fallback || (name ? getInitials(name) : '?');
  const bgColor = name ? generateColorFromString(name) : '#6B7280';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={cn(' rounded-full object-cover', sizeStyles[size], className)}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white',
        sizeStyles[size],
        className,
      )}
      style={{ backgroundColor: bgColor }}
      aria-label={alt || name || 'Avatar'}
    >
      {initials}
    </div>
  );
}
