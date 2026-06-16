import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Document } from '@prisma/client';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.get('app.openai.apiKey') || '',
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  }

  async generateChatResponse(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    agent: { modelName?: string; temperature?: number; maxTokens?: number; instructions?: string },
  ): Promise<string> {
    const systemPrompt = agent.instructions || 'You are a helpful customer support assistant.';
    const fullMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    const response = await this.openai.chat.completions.create({
      model: agent.modelName || 'gpt-4',
      messages: fullMessages,
      temperature: agent.temperature ?? 0.7,
      max_tokens: agent.maxTokens ?? 4096,
    });

    return response.choices[0]?.message?.content || '';
  }

  async generateResponseWithContext(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    contextChunks: string[],
    agent: { modelName?: string; temperature?: number; maxTokens?: number; instructions?: string },
  ): Promise<string> {
    const context = contextChunks.join('\n\n');
    const systemPrompt = agent.instructions || 'You are a helpful customer support assistant.';
    const contextualizedSystem = `${systemPrompt}\n\nUse the following knowledge base context to answer the user's question:\n\n${context}`;

    const fullMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: contextualizedSystem },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: m.content,
      })),
    ];

    const response = await this.openai.chat.completions.create({
      model: agent.modelName || 'gpt-4',
      messages: fullMessages,
      temperature: agent.temperature ?? 0.7,
      max_tokens: agent.maxTokens ?? 4096,
    });

    return response.choices[0]?.message?.content || '';
  }

  async generateTitle(content: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Generate a concise title (max 10 words) for the following customer support conversation start. Return only the title, no quotes.',
        },
        { role: 'user', content },
      ],
      max_tokens: 30,
    });

    return response.choices[0]?.message?.content?.replace(/['"]/g, '') || 'Conversation';
  }
}
