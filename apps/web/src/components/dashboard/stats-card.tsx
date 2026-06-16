'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  description?: string;
  className?: string;
  isLoading?: boolean;
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-8 w-16 rounded bg-muted" />
          <div className="h-3 w-32 rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCard({
  title,
  value,
  icon,
  trend,
  description,
  className,
  isLoading,
}: StatsCardProps) {
  if (isLoading) return <StatsCardSkeleton />;

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {icon && (
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
              {icon}
            </div>
          )}
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1.5">
            {trend.isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-emerald-600' : 'text-red-600',
              )}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}%
            </span>
            {trend.label && (
              <span className="text-xs text-muted-foreground">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
