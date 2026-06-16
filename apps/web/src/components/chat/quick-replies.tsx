'use client';

export function QuickReplies({ replies, onSelect }: { replies: string[]; onSelect: (reply: string) => void }) {
  if (!replies.length) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2" role="group" aria-label="Quick replies">
      {replies.map((reply, i) => (
        <button
          key={i}
          onClick={() => onSelect(reply)}
          className="px-3 py-1.5 text-sm rounded-full border bg-background hover:bg-accent transition-colors"
          aria-label={`Quick reply: ${reply}`}
        >
          {reply}
        </button>
      ))}
    </div>
  );
}
