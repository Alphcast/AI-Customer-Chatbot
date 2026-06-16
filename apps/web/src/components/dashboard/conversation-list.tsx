'use client';

import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, truncate } from '@/lib/utils';
import type { Conversation } from '@/types';
import { MessageCircle, Mail, Phone, Bot } from 'lucide-react';
import type { ReactNode } from 'react';

const channelIcons: Record<string, ReactNode> = {
  chat: <MessageCircle className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  phone: <Phone className="h-3.5 w-3.5" />,
  api: <Bot className="h-3.5 w-3.5" />,
};

const statusVariants: Record<string, 'default' | 'secondary' | 'success' | 'warning'> = {
  active: 'success',
  waiting: 'warning',
  resolved: 'secondary',
  closed: 'default',
};

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

function ConversationListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  isLoading,
}: ConversationListProps) {
  if (isLoading) return <ConversationListSkeleton />;

  return (
    <div className="divide-y">
      {conversations.map((conv) => {
        const customerName = conv.customer
          ? `${conv.customer.firstName || ''} ${conv.customer.lastName || ''}`.trim() || conv.customer.email
          : 'Anonymous';
        const lastMessage = conv.messages?.[conv.messages.length - 1];

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              'flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-muted/50',
              selectedId === conv.id && 'bg-muted',
            )}
          >
            <Avatar
              size="md"
              fallback={customerName.charAt(0).toUpperCase()}
              src={conv.customer?.avatar}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {customerName}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {channelIcons[conv.channel]}
                  {conv.unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
              {lastMessage && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {truncate(lastMessage.content, 50)}
                </p>
              )}
              <div className="mt-1 flex items-center gap-2">
                {conv.status && (
                  <Badge variant={statusVariants[conv.status] || 'default'} className="capitalize">
                    {conv.status}
                  </Badge>
                )}
                {conv.lastMessageAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(conv.lastMessageAt)}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
      {conversations.length === 0 && (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No conversations found.
        </div>
      )}
    </div>
  );
}
