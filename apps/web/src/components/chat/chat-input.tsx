'use client';

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EmojiPicker } from './emoji-picker';
import { FileUpload } from './file-upload';
import { VoiceRecorder } from './voice-recorder';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onSendFiles?: (files: File[]) => void;
  onSendVoice?: (blob: Blob) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ChatInput({
  onSendMessage,
  onSendFiles,
  onSendVoice,
  placeholder = 'Type a message...',
  disabled,
  isLoading,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || isLoading) return;
    onSendMessage(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, disabled, isLoading, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleEmojiSelect = useCallback((emoji: string) => {
    setValue((prev) => prev + emoji);
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="border-t bg-background p-3" role="toolbar" aria-label="Chat input">
      <div className="flex items-end gap-2">
        <div className="flex items-center gap-0.5 pb-1">
          <EmojiPicker onEmojiSelect={handleEmojiSelect} disabled={disabled || isLoading} />
          {onSendFiles && <FileUpload onSend={onSendFiles} disabled={disabled || isLoading} />}
          {onSendVoice && <VoiceRecorder onSend={onSendVoice} disabled={disabled || isLoading} />}
        </div>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            rows={1}
            aria-label="Chat message input"
            className={cn(
              'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
              'placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'resize-none min-h-[36px] max-h-[160px]',
              'scrollbar-thin',
            )}
          />
        </div>

        <Button
          type="button"
          size="icon"
          onClick={handleSend}
          disabled={disabled || isLoading || !value.trim()}
          isLoading={isLoading}
          aria-label="Send message"
          className="flex-shrink-0"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
