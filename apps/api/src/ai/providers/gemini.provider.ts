import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AiProvider, ChatOptions } from './ai-provider.interface';

@Injectable()
export class GeminiProvider implements AiProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenerativeAI;
  private readonly defaultModel = 'gemini-1.5-pro';
  private readonly embeddingModel = 'embedding-001';
  private readonly maxRetries = 3;

  constructor(private readonly config: ConfigService) {
    this.client = new GoogleGenerativeAI(
      this.config.get<string>('app.gemini.apiKey') || '',
    );
  }

  getProviderName(): string {
    return 'gemini';
  }

  async generateChatCompletion(messages: any[], options?: ChatOptions): Promise<string> {
    const model = options?.model || this.defaultModel;
    const geminiModel = this.client.getGenerativeModel({ model });

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const contents = this.buildGeminiContents(messages);

        const result = await geminiModel.generateContent({
          contents,
          generationConfig: {
            temperature: options?.temperature ?? 0.7,
            maxOutputTokens: options?.maxTokens ?? 4096,
          },
        });

        const response = result.response;
        return response.text();
      } catch (error) {
        this.logger.error(
          `Gemini chat completion failed (attempt ${attempt}/${this.maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    const geminiModel = this.client.getGenerativeModel({ model });

    try {
      const contents = this.buildGeminiContents(messages);

      const result = await geminiModel.generateContentStream({
        contents,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 4096,
        },
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text && callback) {
          callback(text);
        }
      }
    } catch (error) {
      this.logger.error(
        `Gemini streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const embeddingModel = this.client.getGenerativeModel({ model: this.embeddingModel });

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
      } catch (error) {
        this.logger.error(
          `Gemini embedding failed (attempt ${attempt}/${this.maxRetries}): ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        if (attempt === this.maxRetries) throw error;
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    return [];
  }

  private buildGeminiContents(messages: any[]): any[] {
    const geminiContents: any[] = [];
    let systemInstruction = '';

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemInstruction = msg.content;
      } else if (msg.role === 'user') {
        const text = systemInstruction
          ? `[System Instruction]\n${systemInstruction}\n\n[User Message]\n${msg.content}`
          : msg.content;
        geminiContents.push({ role: 'user', parts: [{ text }] });
        systemInstruction = '';
      } else if (msg.role === 'assistant') {
        geminiContents.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }

    if (geminiContents.length === 0) {
      geminiContents.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    return geminiContents;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
