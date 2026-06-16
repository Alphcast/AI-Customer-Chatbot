'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'Faces',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤟', '✍️', '👏', '🙌', '🤲', '🤝', '🙏'],
  },
  {
    name: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💗', '💖', '💘', '💝', '💟', '❣️', '♥️'],
  },
  {
    name: 'Objects',
    emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '⭐', '🌟', '✨', '🔥', '💯', '💡', '📝', '📌', '📍', '🔒', '🔓', '🔑', '🗝️', '📎', '🖇️'],
  },
];

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
}

export function EmojiPicker({ onEmojiSelect, disabled }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    if (open) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open]);

  const handleSelect = useCallback(
    (emoji: string) => {
      onEmojiSelect(emoji);
      setOpen(false);
    },
    [onEmojiSelect],
  );

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        aria-label="Open emoji picker"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Smile className="h-5 w-5" />
      </Button>

      {open && (
        <div
          ref={pickerRef}
          className="absolute bottom-12 left-0 z-50 w-72 rounded-lg border bg-popover p-3 shadow-lg"
          role="dialog"
          aria-label="Emoji picker"
        >
          <div className="flex gap-1 mb-2 border-b pb-2" role="tablist">
            {EMOJI_CATEGORIES.map((cat, idx) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(idx)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  idx === activeCategory
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                role="tab"
                aria-selected={idx === activeCategory}
                aria-label={cat.name}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div
            className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto scrollbar-thin"
            role="tabpanel"
            aria-label={EMOJI_CATEGORIES[activeCategory].name}
          >
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className="p-1 text-lg hover:bg-accent rounded transition-colors"
                aria-label={`Insert emoji ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
