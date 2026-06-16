'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useChat } from '@/hooks/use-chat';
import { formatRelativeTime, getInitials, cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-media-query';
import {
  Send,
  MessageSquare,
  Plus,
  Search,
  ChevronLeft,
  MoreVertical,
  User,
  Bot,
  Loader2,
  LogOut,
} from 'lucide-react';
import type { Conversation, Message } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, fetchUser, logout } = useAuthStore();
  const {
    conversations,
    activeConversation,
    messages,
    isConnected,
    isTyping,
    isLoadingConversations,
    isLoadingMessages,
    sendMessage,
    getConversations,
    selectConversation,
    createConversation,
    emitTyping,
  } = useChat();

  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchUser();
    }
  }, [isAuthenticated, user, fetchUser]);

  useEffect(() => {
    if (isAuthenticated) {
      getConversations();
    }
  }, [isAuthenticated, getConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setShowSidebar(!isMobile);
  }, [isMobile]);

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !activeConversation) return;

    setInputValue('');
    await sendMessage(trimmed, activeConversation.id);
  }, [inputValue, activeConversation, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleNewConversation = useCallback(async () => {
    const conv = await createConversation({ subject: 'New conversation' });
    if (conv) {
      selectConversation(conv);
      if (isMobile) setShowSidebar(false);
    }
  }, [createConversation, selectConversation, isMobile]);

  const handleSelectConversation = useCallback(
    (conv: Conversation) => {
      selectConversation(conv);
      if (isMobile) setShowSidebar(false);
    },
    [selectConversation, isMobile],
  );

  const handleTyping = useCallback(
    (isTypingNow: boolean) => {
      if (activeConversation) {
        emitTyping(activeConversation.id, isTypingNow);
      }
    },
    [activeConversation, emitTyping],
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.subject?.toLowerCase().includes(query) ||
      conv.customer?.firstName?.toLowerCase().includes(query) ||
      conv.customer?.lastName?.toLowerCase().includes(query) ||
      conv.customer?.email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          'flex w-80 flex-col border-r bg-card transition-all duration-300',
          isMobile && !showSidebar && '-ml-80',
          isMobile && showSidebar && 'absolute inset-y-0 left-0 z-30 w-full',
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquare className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="font-semibold">Chats</h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewConversation}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="New conversation"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                logout();
                router.push('/login');
              }}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="border-b px-4 py-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No conversations found' : 'No conversations yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={handleNewConversation}
                  className="mt-2 text-sm font-medium text-primary hover:text-primary/80"
                >
                  Start a new chat
                </button>
              )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  'flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent/50',
                  activeConversation?.id === conv.id && 'bg-accent',
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {conv.customer
                    ? getInitials(conv.customer.firstName, conv.customer.lastName)
                    : '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-medium">
                      {conv.customer
                        ? `${conv.customer.firstName || ''} ${conv.customer.lastName || ''}`.trim() || conv.customer.email
                        : conv.subject || 'Unknown'}
                    </span>
                    {conv.lastMessageAt && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatRelativeTime(conv.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {conv.subject || 'No subject'}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 border-t px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              {isMobile && (
                <button
                  onClick={() => setShowSidebar(true)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {activeConversation.customer
                  ? getInitials(
                      activeConversation.customer.firstName,
                      activeConversation.customer.lastName,
                    )
                  : '?'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {activeConversation.customer
                    ? `${activeConversation.customer.firstName || ''} ${activeConversation.customer.lastName || ''}`.trim() ||
                      activeConversation.customer.email
                    : activeConversation.subject || 'Conversation'}
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-block h-1.5 w-1.5 rounded-full',
                      isConnected ? 'bg-green-500' : 'bg-yellow-500',
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {isConnected ? 'Connected' : 'Reconnecting...'}
                  </span>
                </div>
              </div>
              <button className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <MessageSquare className="mb-2 h-10 w-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2 px-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-2">
                        <span className="typing-dot" />
                        <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                        <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t px-4 py-3">
              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  <textarea
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (e.target.value.length > 0) {
                        handleTyping(true);
                      } else {
                        handleTyping(false);
                      }
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full resize-none rounded-lg border border-input bg-background py-2.5 pl-4 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                    onInput={(e) => {
                      const target = e.currentTarget;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Welcome to AI Chat</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Select a conversation from the sidebar or start a new one to
              begin chatting.
            </p>
            <button
              onClick={handleNewConversation}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Conversation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.sender === 'customer';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium',
          isUser ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-3 py-2 text-sm chat-message-enter',
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-muted text-foreground rounded-tl-sm',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={cn(
            'mt-1 text-right text-[10px]',
            isUser ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}
        >
          {formatRelativeTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
