import { useState, useCallback } from 'react';

interface UseClipboardOptions {
  timeout?: number;
}

interface UseClipboardReturn {
  copied: boolean;
  copy: (text: string) => Promise<boolean>;
  error: Error | null;
}

export function useClipboard(options: UseClipboardOptions = {}): UseClipboardReturn {
  const { timeout = 2000 } = options;
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (typeof navigator === 'undefined') {
        setError(new Error('Clipboard API not available'));
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setError(null);
        setTimeout(() => setCopied(false), timeout);
        return true;
      } catch (err) {
        const clipboardError = err instanceof Error ? err : new Error('Failed to copy');
        setError(clipboardError);
        setCopied(false);
        return false;
      }
    },
    [timeout],
  );

  return { copied, copy, error };
}
