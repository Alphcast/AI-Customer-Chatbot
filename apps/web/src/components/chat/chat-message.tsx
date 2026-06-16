'use client';

import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Image, Headphones, Download, AlertCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { MessageStatus } from './message-status';
import { cn, formatTime, getInitials, formatDate } from '@/lib/utils';
import type { Message, Attachment } from '@/types';

interface ChatMessageProps {
  message: Message;
  isOwn?: boolean;
  showAvatar?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  sentiment?: 'positive' | 'neutral' | 'negative' | null;
  customerName?: string | null;
  customerAvatar?: string | null;
}

function FileAttachment({ attachment }: { attachment: Attachment }) {
  const isImage = attachment.fileType.startsWith('image/');
  const isAudio = attachment.fileType.startsWith('audio/');
  const fileSize =
    attachment.fileSize > 1024 * 1024
      ? `${(attachment.fileSize / (1024 * 1024)).toFixed(1)} MB`
      : `${(attachment.fileSize / 1024).toFixed(1)} KB`;

  if (isImage) {
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-1 rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
      >
        <img
          src={attachment.url}
          alt={attachment.fileName}
          className="max-w-full max-h-64 object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  const Icon = isAudio ? Headphones : FileText;

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 mt-1 p-3 rounded-lg border bg-muted/50 hover:bg-accent transition-colors group"
    >
      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:underline">{attachment.fileName}</p>
        <p className="text-xs text-muted-foreground">{fileSize}</p>
      </div>
      <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
    </a>
  );
}

function SentimentBadge({ sentiment }: { sentiment: 'positive' | 'neutral' | 'negative' }) {
  const config = {
    positive: { label: 'Positive', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    neutral: { label: 'Neutral', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    negative: { label: 'Negative', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  const { label, className } = config[sentiment];

  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${className}`}>
      <AlertCircle className="h-3 w-3" />
      {label}
    </span>
  );
}

export function ChatMessage({
  message,
  isOwn = false,
  showAvatar = true,
  status,
  sentiment,
  customerName,
  customerAvatar,
}: ChatMessageProps) {
  const isAI = message.sender === 'ai';
  const isAgent = message.sender === 'agent';
  const isSystem = message.sender === 'system';
  const isCustomer = message.sender === 'customer';

  const senderLabel = useMemo(() => {
    if (isAI) return 'AI Assistant';
    if (isAgent) return 'Agent';
    if (isCustomer) return customerName || 'Customer';
    return 'System';
  }, [isAI, isAgent, isCustomer, customerName]);

  const fallbackInitials = useMemo(() => {
    if (isCustomer) return getInitials(customerName, '');
    if (isAI) return 'AI';
    if (isAgent) return 'AG';
    return 'S';
  }, [isCustomer, isAI, isAgent, customerName]);

  if (isSystem) {
    return (
      <div className="flex justify-center py-2" role="status" aria-label="System message">
        <div className="px-4 py-1.5 rounded-full bg-muted text-xs text-muted-foreground text-center max-w-[80%]">
          {message.content}
        </div>
      </div>
    );
  }

  const bubbleSide = isOwn ? 'justify-end' : 'justify-start';
  const bubbleColor = isOwn
    ? 'bg-primary text-primary-foreground'
    : isAI
      ? 'bg-muted border'
      : 'bg-secondary text-secondary-foreground';
  const bubbleRadius = isOwn ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm';

  return (
    <div
      className={cn('flex gap-2 px-4 py-1.5 chat-message-enter', bubbleSide)}
      role="listitem"
      aria-label={`Message from ${senderLabel}`}
    >
      {!isOwn && showAvatar && (
        <div className="flex-shrink-0 self-end">
          <Avatar
            src={isCustomer ? customerAvatar : undefined}
            fallback={fallbackInitials}
            size="sm"
            alt={senderLabel}
          />
        </div>
      )}

      <div className={cn('flex flex-col max-w-[75%] sm:max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        {showAvatar && (
          <span className="text-[10px] text-muted-foreground mb-0.5 px-1">
            {senderLabel}
          </span>
        )}

        <div className={cn('px-3 py-2 shadow-sm', bubbleColor, bubbleRadius)}>
          {message.content && (
            <div className={cn(
              'prose prose-sm max-w-none dark:prose-invert',
              isOwn && 'prose-invert',
            )}>
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={isOwn ? 'text-primary-foreground underline' : 'text-primary underline'}
                    >
                      {children}
                    </a>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="px-1 py-0.5 rounded bg-black/10 text-sm" {...props}>
                        {children}
                      </code>
                    ) : (
                      <pre className="p-2 rounded bg-black/10 overflow-x-auto">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {message.attachments?.map((attachment) => (
            <FileAttachment key={attachment.id} attachment={attachment} />
          ))}
        </div>

        <div className="flex items-center gap-2 mt-0.5 px-1">
          <span className="text-[10px] text-muted-foreground">
            {formatTime(message.createdAt)}
            {(() => {
              const today = new Date();
              const msgDate = new Date(message.createdAt);
              if (msgDate.toDateString() !== today.toDateString()) {
                return ` ${formatDate(message.createdAt)}`;
              }
              return '';
            })()}
          </span>

          {isOwn && status && <MessageStatus status={status} />}

          {sentiment && !isOwn && (
            <SentimentBadge sentiment={sentiment} />
          )}
        </div>
      </div>

      {isOwn && showAvatar && (
        <div className="flex-shrink-0 self-end">
          <Avatar fallback="You" size="sm" alt="You" />
        </div>
      )}
    </div>
  );
}
