import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@shared/utils';
import { Spinner } from './spinner';

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
  outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:opacity-50',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-blue-500 disabled:opacity-50',
  link: 'bg-transparent text-blue-600 hover:underline focus:ring-blue-500 disabled:opacity-50 underline-offset-2',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
  icon: 'p-2',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    ...props
  }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Spinner size="sm" className="text-current" />
        ) : leftIcon ? (
          leftIcon
        ) : null}
        {children}
        {!isLoading && rightIcon ? rightIcon : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
