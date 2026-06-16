'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, MessageSquare } from 'lucide-react';
import { ChatHeader } from './chat-header';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { TypingIndicator } from './typing-indicator';
import { QuickReplies } from './quick-replies';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

interface ChatWindowProps {
  conversationId?: string;
  companyId: string;
  agentId?: string;
  customer?: { email: string; firstName: string; lastName: string } | null;
  onClose?: () => void;
  isWidget?: boolean;
  messages?: Message[];
  isTyping?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onSendMessage?: (content: string) => void;
  onSendFiles?: (files: File[]) => void;
  onSendVoice?: (blob: Blob) => void;
  onLoadMore?: () => void;
  hasMoreMessages?: boolean;
  quickReplies?: string[];
  onQuickReplySelect?: (reply: string) => void;
  streamingContent?: string | null;
  handoffStatus?: 'none' | 'requested' | 'active';
  onMinimize?: () => void;
  agentName?: string;
  isOnline?: boolean;
}

export function ChatWindow({
  companyId,
  customer,
  onClose,
  isWidget,
  messages = [],
  isTyping,
  isLoading,
  error,
  onSendMessage,
  onSendFiles,
  onSendVoice,
  onLoadMore,
  hasMoreMessages,
  quickReplies,
  onQuickReplySelect,
  streamingContent,
  handoffStatus,
  onMinimize,
  agentName,
  isOnline,
  agentId,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, []);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, streamingContent, isTyping, shouldAutoScroll, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const nearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(nearBottom);

    if (scrollTop < 50 && hasMoreMessages && !isLoading && onLoadMore) {
      onLoadMore();
    }
  }, [hasMoreMessages, isLoading, onLoadMore]);

  const allMessages = messages;
  const hasStreaming = streamingContent !== null && streamingContent !== undefined;

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-background',
        isWidget ? 'rounded-xl border shadow-2xl' : '',
      )}
      role="region"
      aria-label="Chat window"
    >
      <ChatHeader
        agentName={agentName}
        isOnline={isOnline}
        isWidget={isWidget}
        handoffStatus={handoffStatus}
        onClose={onClose}
        onMinimize={onMinimize}
      />

      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin"
        role="log"
        aria-label="Messages"
        aria-live="polite"
      >
        {isLoading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full" role="status">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Loading messages...</p>
            </div>
          </div>
        )}

        {error && messages.length === 0 && (
          <div className="flex items-center justify-center h-full p-4" role="alert">
            <div className="flex flex-col items-center gap-2 text-destructive text-center">
              <MessageSquare className="h-8 w-8" />
              <p className="text-sm font-medium">Failed to load messages</p>
              <p className="text-xs">{error}</p>
              <button
                onClick={onLoadMore}
                className="text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {!isLoading && messages.length === 0 && !error && (
          <div className="flex items-center justify-center h-full p-4" role="status">
            <div className="flex flex-col items-center gap-2 text-muted-foreground text-center">
              <MessageSquare className="h-8 w-8" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs">Start the conversation by sending a message.</p>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="py-2" role="list">
            {hasMoreMessages && (
              <div className="flex justify-center py-2">
                <button
                  onClick={onLoadMore}
                  disabled={isLoading}
                  className="text-xs text-primary hover:underline disabled:opacity-50"
                  aria-label="Load earlier messages"
                >
                  {isLoading ? 'Loading...' : 'Load earlier messages'}
                </button>
              </div>
            )}

            {allMessages.map((msg, idx) => {
              const isOwn = msg.sender === 'customer';
              const prevMsg = idx > 0 ? allMessages[idx - 1] : null;
              const showAvatar = !prevMsg || prevMsg.sender !== msg.sender;

              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isOwn={isOwn}
                  showAvatar={showAvatar}
                  status={msg.metadata?.status as 'sending' | 'sent' | 'delivered' | 'read' | undefined}
                  sentiment={msg.metadata?.sentiment as 'positive' | 'neutral' | 'negative' | null | undefined}
                  customerName={
                    customer
                      ? `${customer.firstName} ${customer.lastName}`
                      : undefined
                  }
                />
              );
            })}

            {hasStreaming && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  content: streamingContent || '',
                  type: 'text',
                  sender: 'ai',
                  senderId: agentId || 'ai',
                  conversationId: '',
                  metadata: null,
                  attachments: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }}
                isOwn={false}
                showAvatar={true}
                customerName={customer ? `${customer.firstName} ${customer.lastName}` : undefined}
              />
            )}

            {isTyping && !hasStreaming && <TypingIndicator name={agentName} />}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {quickReplies && quickReplies.length > 0 && onQuickReplySelect && (
        <QuickReplies replies={quickReplies} onSelect={onQuickReplySelect} />
      )}

      {onSendMessage && (
        <ChatInput
          onSendMessage={onSendMessage}
          onSendFiles={onSendFiles}
          onSendVoice={onSendVoice}
          disabled={!companyId}
          isLoading={false}
          placeholder="Type a message..."
        />
      )}
    </div>
  );
}
