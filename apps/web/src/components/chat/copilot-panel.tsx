'use client';

import { useState, useCallback } from 'react';
import {
  Sparkles,
  FileText,
  Lightbulb,
  Copy,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SuggestedResponse {
  id: string;
  content: string;
  confidence: number;
}

interface CopilotPanelProps {
  suggestedResponses?: SuggestedResponse[];
  onUseResponse?: (content: string) => void;
  onGenerateSummary?: () => void;
  onRecommendSolution?: () => void;
  summary?: string | null;
  solution?: string | null;
  isLoadingSummary?: boolean;
  isLoadingSolution?: boolean;
}

export function CopilotPanel({
  suggestedResponses = [],
  onUseResponse,
  onGenerateSummary,
  onRecommendSolution,
  summary,
  solution,
  isLoadingSummary,
  isLoadingSolution,
}: CopilotPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, []);

  return (
    <div className="border-t bg-background">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium hover:bg-accent/50 transition-colors"
        aria-expanded={expanded}
        aria-label="Toggle copilot panel"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>AI Copilot</span>
        </div>
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-3 space-y-3" role="region" aria-label="AI Copilot suggestions">
          {suggestedResponses.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-1.5">
                Suggested Responses
              </h4>
              <div className="space-y-1.5">
                {suggestedResponses.map((response) => (
                  <div
                    key={response.id}
                    className="group relative p-2 rounded-lg border bg-muted/30 hover:bg-accent/50 transition-colors"
                  >
                    <p className="text-xs text-foreground/90 pr-14 line-clamp-2">
                      {response.content}
                    </p>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge
                        variant={response.confidence > 0.8 ? 'success' : response.confidence > 0.5 ? 'warning' : 'secondary'}
                        className="h-4 text-[9px] px-1"
                      >
                        {Math.round(response.confidence * 100)}%
                      </Badge>
                      <button
                        onClick={() => copyToClipboard(response.content)}
                        className="p-0.5 hover:bg-accent rounded"
                        aria-label="Copy response"
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                      {onUseResponse && (
                        <button
                          onClick={() => onUseResponse(response.content)}
                          className="p-0.5 hover:bg-accent rounded"
                          aria-label="Use response"
                        >
                          <Send className="h-3 w-3 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={onGenerateSummary}
              disabled={isLoadingSummary}
              isLoading={isLoadingSummary}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              Generate Summary
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={onRecommendSolution}
              disabled={isLoadingSolution}
              isLoading={isLoadingSolution}
            >
              <Lightbulb className="h-3.5 w-3.5 mr-1" />
              Recommend Solution
            </Button>
          </div>

          {summary && (
            <div className="p-2 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-medium text-muted-foreground">Summary</h4>
                <button
                  onClick={() => copyToClipboard(summary)}
                  className="p-0.5 hover:bg-accent rounded"
                  aria-label="Copy summary"
                >
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
              </div>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">{summary}</p>
            </div>
          )}

          {solution && (
            <div className="p-2 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-medium text-muted-foreground">Recommended Solution</h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(solution)}
                    className="p-0.5 hover:bg-accent rounded"
                    aria-label="Copy solution"
                  >
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                  {onUseResponse && (
                    <button
                      onClick={() => onUseResponse(solution)}
                      className="p-0.5 hover:bg-accent rounded"
                      aria-label="Use solution"
                    >
                      <Send className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">{solution}</p>
            </div>
          )}

          {isLoadingSummary && !summary && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1" role="status">
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating summary...
            </div>
          )}

          {isLoadingSolution && !solution && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-1" role="status">
              <Loader2 className="h-3 w-3 animate-spin" />
              Analyzing conversation...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type { SuggestedResponse };
