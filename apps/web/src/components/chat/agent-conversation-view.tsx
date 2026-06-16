'use client';

import { useState, useCallback } from 'react';
import {
  PanelLeftOpen,
  PanelLeftClose,
  ChevronRight,
  CheckCircle2,
  Users,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatWindow } from './chat-window';
import { ConversationListItem } from './conversation-list-item';
import { CustomerInfoSidebar } from './customer-info-sidebar';
import { CopilotPanel } from './copilot-panel';
import { useIsDesktop } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import type { Conversation, Customer, Message, Ticket } from '@/types';

interface AgentConversationViewProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isTyping: boolean;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  customer: Customer | null;
  openTickets: Ticket[];
  suggestedResponses?: { id: string; content: string; confidence: number }[];
  streamingContent?: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onSendMessage: (content: string) => void;
  onSendFiles?: (files: File[]) => void;
  onSendVoice?: (blob: Blob) => void;
  onLoadMoreMessages?: () => void;
  hasMoreMessages?: boolean;
  onQuickReplySelect?: (reply: string) => void;
  quickReplies?: string[];
  onHandoff?: () => void;
  onResolve?: () => void;
  onGenerateSummary?: () => void;
  onRecommendSolution?: () => void;
  onUseCopilotResponse?: (content: string) => void;
  onViewPreviousConversation?: (conversationId: string) => void;
  onViewTicket?: (ticketId: string) => void;
  onAddCustomerNote?: (note: string) => Promise<void>;
  summary?: string | null;
  solution?: string | null;
  isLoadingSummary?: boolean;
  isLoadingSolution?: boolean;
}

export function AgentConversationView({
  conversations,
  activeConversation,
  messages,
  isTyping,
  isLoadingConversations,
  isLoadingMessages,
  error,
  customer,
  openTickets,
  suggestedResponses,
  streamingContent,
  onSelectConversation,
  onSendMessage,
  onSendFiles,
  onSendVoice,
  onLoadMoreMessages,
  hasMoreMessages,
  onQuickReplySelect,
  quickReplies,
  onHandoff,
  onResolve,
  onGenerateSummary,
  onRecommendSolution,
  onUseCopilotResponse,
  onViewPreviousConversation,
  onViewTicket,
  onAddCustomerNote,
  summary,
  solution,
  isLoadingSummary,
  isLoadingSolution,
}: AgentConversationViewProps) {
  const isDesktop = useIsDesktop();
  const [showSidebar, setShowSidebar] = useState(isDesktop);
  const [showConversationsList, setShowConversationsList] = useState(isDesktop);

  const handleHandoff = useCallback(() => {
    onHandoff?.();
  }, [onHandoff]);

  const handleResolve = useCallback(() => {
    onResolve?.();
  }, [onResolve]);

  const toggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev);
  }, []);

  const toggleConversationsList = useCallback(() => {
    setShowConversationsList((prev) => !prev);
  }, []);

  return (
    <div className="flex h-full bg-background" role="main" aria-label="Agent conversation view">
      {showConversationsList && (
        <div
          className={cn(
            'border-r bg-background flex-shrink-0',
            isDesktop ? 'w-80' : 'absolute inset-y-0 left-0 z-20 w-80 shadow-lg',
          )}
          role="region"
          aria-label="Conversations list"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </h2>
            <Badge variant="secondary" className="text-xs">
              {conversations.length}
            </Badge>
          </div>

          <div className="overflow-y-auto h-[calc(100%-49px)] scrollbar-thin">
            {isLoadingConversations && conversations.length === 0 && (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                Loading...
              </div>
            )}

            {!isLoadingConversations && conversations.length === 0 && (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                No conversations
              </div>
            )}

            {conversations.map((conv) => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversation?.id === conv.id}
                onClick={() => onSelectConversation(conv)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between px-3 py-1.5 border-b bg-muted/30">
          <div className="flex items-center gap-1">
            <button
              onClick={toggleConversationsList}
              className="p-1.5 rounded-md hover:bg-accent transition-colors"
              aria-label={showConversationsList ? 'Hide conversations list' : 'Show conversations list'}
            >
              {showConversationsList ? (
                <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
              ) : (
                <PanelLeftOpen className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {activeConversation && (
              <>
                <span className="text-xs text-muted-foreground mx-1">|</span>
                <span className="text-xs font-medium truncate max-w-[200px]">
                  {activeConversation.customer
                    ? `${activeConversation.customer.firstName || ''} ${activeConversation.customer.lastName || ''}`.trim() || 'Unknown Customer'
                    : 'Unknown Customer'}
                </span>
                {activeConversation.status && (
                  <Badge
                    variant={
                      activeConversation.status === 'waiting'
                        ? 'warning'
                        : activeConversation.status === 'resolved'
                          ? 'success'
                          : 'secondary'
                    }
                    className="h-5 text-[10px] px-1.5 capitalize ml-1"
                  >
                    {activeConversation.status}
                  </Badge>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {activeConversation && (
              <>
                {onHandoff && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleHandoff}
                    aria-label="Request handoff"
                  >
                    <Users className="h-3.5 w-3.5 mr-1" />
                    Handoff
                  </Button>
                )}
                {onResolve && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    onClick={handleResolve}
                    aria-label="Resolve conversation"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Resolve
                  </Button>
                )}
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 rounded-md hover:bg-accent transition-colors ml-1"
                  aria-label={showSidebar ? 'Hide customer info' : 'Show customer info'}
                >
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-muted-foreground transition-transform',
                      showSidebar && 'rotate-180',
                    )}
                  />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            {activeConversation ? (
              <>
                <div className="flex-1 overflow-hidden">
                  <ChatWindow
                    companyId={activeConversation.companyId || ''}
                    messages={messages}
                    isTyping={isTyping}
                    isLoading={isLoadingMessages}
                    error={error}
                    onSendMessage={onSendMessage}
                    onSendFiles={onSendFiles}
                    onSendVoice={onSendVoice}
                    onLoadMore={onLoadMoreMessages}
                    hasMoreMessages={hasMoreMessages}
                    quickReplies={quickReplies}
                    onQuickReplySelect={onQuickReplySelect}
                    streamingContent={streamingContent}
                    handoffStatus={activeConversation.assignedTo ? 'active' : 'none'}
                    agentName={activeConversation.agent?.name}
                  />
                </div>
                <CopilotPanel
                  suggestedResponses={suggestedResponses}
                  onUseResponse={onUseCopilotResponse}
                  onGenerateSummary={onGenerateSummary}
                  onRecommendSolution={onRecommendSolution}
                  summary={summary}
                  solution={solution}
                  isLoadingSummary={isLoadingSummary}
                  isLoadingSolution={isLoadingSolution}
                />
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Select a conversation</p>
                  <p className="text-xs mt-1">
                    Choose a conversation from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>

          {showSidebar && activeConversation && (
            <div
              className={cn(
                'border-l bg-background flex-shrink-0',
                isDesktop ? 'w-72' : 'w-64',
              )}
              role="region"
              aria-label="Customer information sidebar"
            >
              <CustomerInfoSidebar
                customer={customer}
                previousConversations={conversations.filter(
                  (c) => c.customerId === customer?.id,
                ).length}
                openTickets={openTickets}
                onViewConversation={onViewPreviousConversation}
                onViewTicket={onViewTicket}
                onAddNote={onAddCustomerNote}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


