import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/database';
import { OpenaiProvider } from '../providers/openai.provider';
import { ClaudeProvider } from '../providers/claude.provider';
import { GeminiProvider } from '../providers/gemini.provider';
import { VectorService } from './vector.service';
import { SentimentService } from './sentiment.service';
import { CopilotService } from './copilot.service';
import { ModelProvider, MessageType, Sentiment } from '@prisma/client';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly openaiProvider: OpenaiProvider,
    private readonly claudeProvider: ClaudeProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly vectorService: VectorService,
    private readonly sentimentService: SentimentService,
    private readonly copilotService: CopilotService,
  ) {}

  async generateResponse(conversationId: string, messageContent: string): Promise<string> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          aiAgent: true,
          customer: true,
          company: true,
        },
      });

      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }

      const recentMessages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      recentMessages.reverse();

      const agent = conversation.aiAgent;
      if (!agent) {
        throw new Error(`No AI agent configured for conversation: ${conversationId}`);
      }

      const ragContext = await this.retrieveContext(
        messageContent,
        agent.id,
        conversation.companyId,
      );

      const systemPrompt = this.buildSystemPrompt(agent, ragContext);

      const formattedMessages = recentMessages.map((m) => ({
        role: (m.senderId || m.type === MessageType.SYSTEM ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      }));

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...formattedMessages,
        { role: 'user' as const, content: messageContent },
      ];

      const provider = this.getProvider(agent.modelProvider);
      const response = await provider.generateChatCompletion(messages, {
        model: agent.modelName,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
      });

      await this.prisma.message.create({
        data: {
          conversationId,
          content: response,
          type: MessageType.TEXT,
          sentiment: Sentiment.NEUTRAL,
        },
      });

      await this.trackUsage(
        conversation.companyId,
        agent.modelProvider,
        agent.modelName,
        this.estimateTokens(systemPrompt + messageContent),
        this.estimateTokens(response),
      );

      return response;
    } catch (error) {
      this.logger.error(
        `AI generateResponse failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async generateStreamingResponse(
    conversationId: string,
    messageContent: string,
    callback: (chunk: string) => void,
  ): Promise<void> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          aiAgent: true,
          customer: true,
          company: true,
        },
      });

      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }

      const recentMessages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      recentMessages.reverse();

      const agent = conversation.aiAgent;
      if (!agent) {
        throw new Error(`No AI agent configured for conversation: ${conversationId}`);
      }

      const ragContext = await this.retrieveContext(
        messageContent,
        agent.id,
        conversation.companyId,
      );

      const systemPrompt = this.buildSystemPrompt(agent, ragContext);

      const formattedMessages = recentMessages.map((m) => ({
        role: (m.senderId || m.type === MessageType.SYSTEM ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content,
      }));

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...formattedMessages,
        { role: 'user' as const, content: messageContent },
      ];

      const provider = this.getProvider(agent.modelProvider);

      let fullResponse = '';
      await provider.generateStreamingChatCompletion(
        messages,
        {
          model: agent.modelName,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
        },
        (chunk: string) => {
          fullResponse += chunk;
          callback(chunk);
        },
      );

      if (fullResponse) {
        await this.prisma.message.create({
          data: {
            conversationId,
            content: fullResponse,
            type: MessageType.TEXT,
            sentiment: Sentiment.NEUTRAL,
          },
        });

        await this.trackUsage(
          conversation.companyId,
          agent.modelProvider,
          agent.modelName,
          this.estimateTokens(systemPrompt + messageContent),
          this.estimateTokens(fullResponse),
        );
      }
    } catch (error) {
      this.logger.error(
        `AI generateStreamingResponse failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.openaiProvider.generateEmbedding(text);
  }

  async analyzeSentiment(text: string): Promise<{ sentiment: Sentiment; score: number }> {
    return this.sentimentService.analyzeWithConfidence(text);
  }

  async suggestResponse(conversationId: string): Promise<string> {
    return this.copilotService.suggestResponse(conversationId);
  }

  async generateSummary(conversationId: string): Promise<string> {
    return this.copilotService.generateSummary(conversationId);
  }

  private async retrieveContext(
    query: string,
    agentId: string,
    companyId: string,
  ): Promise<string> {
    try {
      const agentSources = await this.prisma.agentKnowledgeSource.findMany({
        where: { agentId },
        include: {
          knowledgeBase: {
            include: {
              documents: {
                where: { status: 'EMBEDDED' },
                select: { id: true },
              },
            },
          },
        },
      });

      if (agentSources.length === 0) {
        return '';
      }

      const embedding = await this.generateEmbedding(query);

      const results = await this.vectorService.queryVectors(
        embedding,
        5,
        { companyId },
      );

      if (!results || results.length === 0) {
        return '';
      }

      const contextChunks = results
        .filter((r) => r.content || r.metadata?.content)
        .map((r, i) => `[${i + 1}] ${r.content || r.metadata?.content || ''}`)
        .join('\n\n');

      return contextChunks;
    } catch (error) {
      this.logger.warn(
        `RAG context retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return '';
    }
  }

  private buildSystemPrompt(agent: {
    instructions?: string | null;
    personality?: string | null;
    tone?: string | null;
    language?: string;
    name?: string;
    type?: string;
  }, ragContext: string): string {
    const parts: string[] = [];

    if (agent.instructions) {
      parts.push(agent.instructions);
    } else {
      parts.push(`You are ${agent.name || 'an AI support agent'} for customer support.`);
    }

    if (agent.personality) {
      parts.push(`Personality: ${agent.personality}`);
    }

    if (agent.tone) {
      parts.push(`Tone: ${agent.tone}`);
    }

    parts.push(`Language: ${agent.language}`);

    if (agent.type) {
      parts.push(`Specialization: ${agent.type.replace(/_/g, ' ')}`);
    }

    parts.push(
      'You are helpful, accurate, and professional. If you don\'t know the answer, politely say so instead of making up information.',
    );

    if (ragContext) {
      parts.push(
        `\nUse the following knowledge base context to answer the user's question:\n${ragContext}`,
      );
    }

    return parts.join('\n\n');
  }

  private getProvider(modelProvider: ModelProvider) {
    switch (modelProvider) {
      case ModelProvider.OPENAI:
        return this.openaiProvider;
      case ModelProvider.CLAUDE:
        return this.claudeProvider;
      case ModelProvider.GEMINI:
        return this.geminiProvider;
      default:
        return this.openaiProvider;
    }
  }

  async trackUsage(
    companyId: string,
    provider: ModelProvider,
    model: string,
    tokensIn: number,
    tokensOut: number,
  ): Promise<void> {
    try {
      const totalTokens = tokensIn + tokensOut;

      const subscription = await this.prisma.subscription.findFirst({
        where: { companyId, status: 'ACTIVE' },
      });

      if (subscription) {
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            aiTokenLimit: subscription.aiTokenLimit - totalTokens,
          },
        });
      }

      this.logger.log(
        `Usage tracked: company=${companyId}, provider=${provider}, model=${model}, ` +
        `tokensIn=${tokensIn}, tokensOut=${tokensOut}, total=${totalTokens}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to track usage: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
