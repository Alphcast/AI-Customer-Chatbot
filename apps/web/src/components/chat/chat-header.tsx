'use client';

import { X, Minus, Info, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import type { Conversation, Agent, Customer } from '@/types';

interface ChatHeaderProps {
  conversation?: Conversation | null;
  agentName?: string;
  agentAvatar?: string | null;
  isOnline?: boolean;
  isWidget?: boolean;
  handoffStatus?: 'none' | 'requested' | 'active';
  onClose?: () => void;
  onMinimize?: () => void;
  onInfoClick?: () => void;
}

export function ChatHeader({
  conversation,
  agentName,
  agentAvatar,
  isOnline,
  isWidget,
  handoffStatus = 'none',
  onClose,
  onMinimize,
  onInfoClick,
}: ChatHeaderProps) {
  const customer = conversation?.customer;
  const displayName =
    agentName ||
    (customer
      ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
      : 'AI Assistant') ||
    'AI Assistant';

  const avatarFallback = customer
    ? getInitials(customer.firstName, customer.lastName)
    : getInitials(displayName, '');

  return (
    <header
      className="flex items-center gap-3 border-b px-4 py-3 bg-background"
      role="banner"
      aria-label="Chat header"
    >
      <div className="relative flex-shrink-0">
        <Avatar
          src={agentAvatar || customer?.avatar}
          fallback={avatarFallback}
          size="sm"
          alt={displayName}
        />
        {isOnline && (
          <span
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500"
            aria-label="Online"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold truncate">{displayName}</h2>
          {handoffStatus !== 'none' && (
            <Badge
              variant={handoffStatus === 'active' ? 'info' : 'warning'}
              className="h-5 text-[10px] px-1.5"
            >
              {handoffStatus === 'requested' ? (
                <ShieldAlert className="h-3 w-3 mr-0.5" />
              ) : (
                <ShieldCheck className="h-3 w-3 mr-0.5" />
              )}
              {handoffStatus === 'requested' ? 'Handoff Requested' : 'Agent Assigned'}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </p>
      </div>

      <div className="flex items-center gap-0.5">
        {onInfoClick && (
          <button
            onClick={onInfoClick}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Conversation information"
          >
            <Info className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {isWidget && onMinimize && (
          <button
            onClick={onMinimize}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Minimize chat"
          >
            <Minus className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {isWidget && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            aria-label="Close chat"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </header>
  );
}
