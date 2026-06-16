export interface AiProvider {
  generateChatCompletion(messages: any[], options?: ChatOptions): Promise<string>;
  generateStreamingChatCompletion(
    messages: any[],
    options?: ChatOptions,
    callback?: (chunk: string) => void,
  ): Promise<void>;
  generateEmbedding(text: string): Promise<number[]>;
  getProviderName(): string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ContextResult {
  id: string;
  content: string;
  score: number;
  metadata: Record<string, any>;
}

export interface VectorResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
  content?: string;
}
