import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { AiProvider, ChatOptions } from './ai-provider.interface';

@Injectable()
export class ClaudeProvider implements AiProvider {
  private readonly logger = new Logger(ClaudeProvider.name);
  private readonly client: Anthropic;
  private readonly defaultModel = 'claude-3-sonnet-20240229';
  private readonly maxRetries = 3;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('app.anthropic.apiKey') || '',
    });
  }

  getProviderName(): string {
    return 'claude';
  }

  async generateChatCompletion(messages: any[], options?: ChatOptions): Promise<string> {
    const model = options?.model || this.defaultModel;
    const systemMessage = messages.find((m: any) => m.role === 'system');
    const nonSystemMessages = messages.filter((m: any) => m.role !== 'system');

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.client.messages.create({
          model,
          system: systemMessage?.content || '',
          messages: nonSystemMessages.map((m: any) => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })) as Anthropic.MessageParam[],
          max_tokens: options?.maxTokens ?? 4096,
          temperature: options?.temperature ?? 0.7,
        });

        const content = response.content
          .filter((block) => block.type === 'text')
          .map((block) => (block as Anthropic.TextBlock).text)
          .join('');

        return content;
      } catch (error) {
        this.logger.error(
          `Claude chat completion failed (attempt ${attempt}/${this.maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    const systemMessage = messages.find((m: any) => m.role === 'system');
    const nonSystemMessages = messages.filter((m: any) => m.role !== 'system');

    try {
      const stream = await this.client.messages.create({
        model,
        system: systemMessage?.content || '',
        messages: nonSystemMessages.map((m: any) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        })) as Anthropic.MessageParam[],
        max_tokens: options?.maxTokens ?? 4096,
        temperature: options?.temperature ?? 0.7,
        stream: true,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta' &&
          callback
        ) {
          callback(event.delta.text);
        }
      }
    } catch (error) {
      this.logger.error(
        `Claude streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    this.logger.warn('Claude does not support embeddings. Returning empty array.');
    return [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
