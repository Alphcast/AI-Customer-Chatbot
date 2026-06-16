'use client';

export function TypingIndicator({ name }: { name?: string }) {
  return (
    <div className="flex items-center gap-2 p-3" aria-label={name ? `${name} is typing` : 'Someone is typing'}>
      <div className="flex gap-1">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
      {name && <span className="text-xs text-muted-foreground">{name} is typing...</span>}
    </div>
  );
}
