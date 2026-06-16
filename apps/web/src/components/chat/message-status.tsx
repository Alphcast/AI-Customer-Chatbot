'use client';

import { Check, CheckCheck, Clock, Loader2 } from 'lucide-react';

type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'read';

interface MessageStatusProps {
  status: MessageStatusType;
  className?: string;
}

const statusConfig: Record<MessageStatusType, { icon: typeof Check; label: string; className: string }> = {
  sending: {
    icon: Loader2,
    label: 'Sending',
    className: 'text-muted-foreground animate-spin',
  },
  sent: {
    icon: Check,
    label: 'Sent',
    className: 'text-muted-foreground',
  },
  delivered: {
    icon: CheckCheck,
    label: 'Delivered',
    className: 'text-muted-foreground',
  },
  read: {
    icon: CheckCheck,
    label: 'Read',
    className: 'text-blue-500',
  },
};

export function MessageStatus({ status, className }: MessageStatusProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${config.className} ${className ?? ''}`}
      aria-label={config.label}
      title={config.label}
    >
      <Icon className="h-3 w-3" />
    </span>
  );
}

export { type MessageStatusType };
