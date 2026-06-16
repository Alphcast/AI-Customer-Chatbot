'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { MessageCircle, X, Loader2 } from 'lucide-react';
import { ChatWindow } from './chat-window';
import { cn } from '@/lib/utils';

interface WidgetProps {
  companyId: string;
  agentId?: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
  greeting?: string;
  companyName?: string;
  companyLogo?: string;
}

export function Widget({
  companyId,
  agentId,
  position = 'bottom-right',
  primaryColor,
  greeting = 'Hi there! How can I help you today?',
  companyName,
  companyLogo,
}: WidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const greetingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (greetingTimeoutRef.current) {
        clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && !hasInteracted) {
      greetingTimeoutRef.current = setTimeout(() => {
        setHasInteracted(true);
      }, 3000);
    }
    return () => {
      if (greetingTimeoutRef.current) {
        clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, [isOpen, hasInteracted]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsMinimized(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const handleMaximize = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const positionClasses = position === 'bottom-right'
    ? 'right-4 sm:right-6'
    : 'left-4 sm:left-6';

  const windowPositionClasses = position === 'bottom-right'
    ? 'right-4 sm:right-6'
    : 'left-4 sm:left-6';

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed bottom-4 sm:bottom-6 z-50 flex flex-col items-end gap-3">
      {isOpen && !isMinimized && (
        <div
          className={cn(
            'absolute bottom-16 w-[calc(100vw-2rem)] sm:w-[380px] h-[600px] max-h-[calc(100vh-8rem)]',
            windowPositionClasses,
          )}
          role="dialog"
          aria-label="Chat widget"
          aria-modal="true"
        >
          <div
            className="h-full rounded-xl border shadow-2xl overflow-hidden bg-background flex flex-col"
          >
            <ChatWindow
              companyId={companyId}
              agentId={agentId}
              isWidget={true}
              onClose={handleClose}
              onMinimize={handleMinimize}
              agentName={companyName || 'AI Assistant'}
            />
          </div>
        </div>
      )}

      {isOpen && isMinimized && (
        <button
          onClick={handleMaximize}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border',
            positionClasses,
          )}
          style={{
            backgroundColor: primaryColor || 'hsl(var(--primary))',
            color: 'white',
          }}
          aria-label="Open chat"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{companyName || 'Chat'}</span>
        </button>
      )}

      {!isOpen && (
        <button
          onClick={handleOpen}
          className={cn(
            'flex items-center justify-center h-14 w-14 rounded-full shadow-lg border transition-transform hover:scale-105',
            positionClasses,
          )}
          style={{
            backgroundColor: primaryColor || 'hsl(var(--primary))',
            color: 'white',
          }}
          aria-label="Open chat widget"
          aria-expanded={false}
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
