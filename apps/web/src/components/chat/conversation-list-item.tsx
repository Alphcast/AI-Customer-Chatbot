'use client';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeTime, truncate, getInitials } from '@/lib/utils';
import type { Conversation } from '@/types';

interface ConversationListItemProps {
  conversation: Conversation;
  isActive?: boolean;
  onClick?: () => void;
}

export function ConversationListItem({
  conversation,
  isActive,
  onClick,
}: ConversationListItemProps) {
  const { customer, agent, messages, unreadCount, lastMessageAt, status, subject } = conversation;

  const displayName =
    customer
      ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
      : agent
        ? agent.name
        : 'Unknown Customer';

  const avatarFallback = customer
    ? getInitials(customer.firstName, customer.lastName)
    : getInitials(displayName, '');

  const lastMessage = messages && messages.length > 0
    ? messages[messages.length - 1]
    : null;
  const lastMessagePreview = lastMessage
    ? truncate(lastMessage.content, 60)
    : subject
      ? truncate(subject, 60)
      : 'No messages yet';

  const isOnline = customer?.metadata?.isOnline as boolean | undefined;

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-accent/50',
        isActive ? 'bg-accent' : 'bg-transparent',
      )}
      aria-label={`Conversation with ${displayName}${unreadCount > 0 ? `, ${unreadCount} unread messages` : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative flex-shrink-0">
        <Avatar
          src={customer?.avatar}
          fallback={avatarFallback}
          size="md"
          alt={displayName}
        />
        {isOnline && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500"
            aria-label="Online"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{displayName}</span>
          {lastMessageAt && (
            <span className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
              {formatRelativeTime(lastMessageAt)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground truncate">
            {lastMessagePreview}
          </span>
          {unreadCount > 0 && (
            <Badge variant="default" className="h-5 min-w-[20px] px-1.5 text-[10px] flex-shrink-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </div>

      {status && status !== 'active' && (
        <Badge
          variant={status === 'waiting' ? 'warning' : status === 'resolved' ? 'success' : 'secondary'}
          className="h-5 text-[10px] px-1.5 capitalize flex-shrink-0"
        >
          {status}
        </Badge>
      )}
    </button>
  );
}
