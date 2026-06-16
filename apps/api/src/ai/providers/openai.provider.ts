import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { AiProvider, ChatOptions } from './ai-provider.interface';

@Injectable()
export class OpenaiProvider implements AiProvider {
  private readonly logger = new Logger(OpenaiProvider.name);
  private readonly client: OpenAI;
  private readonly defaultModel = 'gpt-4';
  private readonly embeddingModel = 'text-embedding-3-small';
  private readonly maxRetries = 3;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({
      apiKey: this.config.get<string>('app.openai.apiKey') || '',
    });
  }

  getProviderName(): string {
    return 'openai';
  }

  async generateChatCompletion(messages: any[], options?: ChatOptions): Promise<string> {
    const model = options?.model || this.defaultModel;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.chat.completions.create({
          model,
          messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
          temperature: options?.temperature ?? 0.7,
          max_tokens: options?.maxTokens ?? 4096,
        });

        return response.choices[0]?.message?.content || '';
      } catch (error) {
        this.logger.error(
          `OpenAI chat completion failed (attempt ${attempt}/${this.maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        if (attempt === this.maxRetries) throw error;
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    return '';
  }

  async generateStreamingChatCompletion(
    messages: any[],
    options?: ChatOptions,
    callback?: (chunk: string) => void,
  ): Promise<void> {
    const model = options?.model || this.defaultModel;

    try {
      const stream = await this.client.chat.completions.create({
        model,
        messages: messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 4096,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content && callback) {
          callback(content);
        }
      }
    } catch (error) {
      this.logger.error(
        `OpenAI streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.embeddings.create({
          model: this.embeddingModel,
          input: text,
        });

        return response.data[0].embedding;
      } catch (error) {
        this.logger.error(
          `OpenAI embedding failed (attempt ${attempt}/${this.maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        if (attempt === this.maxRetries) throw error;
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    return [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
