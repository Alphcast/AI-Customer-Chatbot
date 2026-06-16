import React, { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@shared/utils';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const variantStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface ToastProps {
  id: string;
  message: string;
  variant?: keyof typeof variantStyles;
  description?: string;
  action?: { label: string; onClick: () => void };
  onDismiss: (id: string) => void;
  duration?: number;
  icon?: ReactNode;
}

export function Toast({
  id,
  message,
  variant = 'info',
  description,
  action,
  onDismiss,
  duration = 5000,
  icon,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const Icon = iconMap[variant];

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(id), 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => onDismiss(id), 300);
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg transition-all',
        variantStyles[variant],
        isExiting ? 'animate-fade-out opacity-0' : 'animate-fade-in',
      )}
    >
      <div className="flex-shrink-0">
        {icon || <Icon size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{message}</p>
        {description && (
          <p className="mt-1 text-sm opacity-80">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline underline-offset-2"
          >
            {action.label}
          </button>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="flex-shrink-0 rounded-lg p-1 hover:bg-black/5 transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: ToastProps[];
  className?: string;
}

export function ToastContainer({ toasts, className }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex flex-col gap-2',
        className,
      )}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
