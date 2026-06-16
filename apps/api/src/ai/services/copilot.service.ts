import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../config/database';
import { OpenaiProvider } from '../providers/openai.provider';
import { ClaudeProvider } from '../providers/claude.provider';
import { GeminiProvider } from '../providers/gemini.provider';
import { VectorService } from './vector.service';
import { ModelProvider } from '@prisma/client';

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly openaiProvider: OpenaiProvider,
    private readonly claudeProvider: ClaudeProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly vectorService: VectorService,
  ) {}

  async suggestResponse(conversationId: string): Promise<string> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          aiAgent: true,
          customer: true,
        },
      });

      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }

      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          sender: { select: { firstName: true, lastName: true, role: true } },
          customer: { select: { firstName: true, lastName: true } },
        },
      });

      messages.reverse();

      const formattedMessages = messages.map((m) => {
        const senderName = m.sender
          ? `${m.sender.firstName} ${m.sender.lastName} (${m.sender.role})`
          : m.customer
            ? `${m.customer.firstName} ${m.customer.lastName} (Customer)`
            : 'System';
        return `${senderName}: ${m.content}`;
      });

      const prompt = `You are an AI copilot assisting a human support agent. Based on the conversation history below, suggest a response the agent can send to the customer.

Customer: ${conversation.customer.firstName} ${conversation.customer.lastName}
Agent context: ${conversation.aiAgent?.name || 'General Support'} (${conversation.aiAgent?.type || 'CUSTOMER_SUPPORT'})

Conversation history:
${formattedMessages.join('\n')}

Suggest a professional, helpful response for the agent to send. Be concise and address the customer's needs:`;

      const provider = this.getProviderForAgent(conversation.aiAgent);
      const response = await provider.generateChatCompletion([
        { role: 'user', content: prompt },
      ], {
        model: conversation.aiAgent?.modelName,
        temperature: 0.7,
        maxTokens: 500,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to suggest response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async generateSummary(conversationId: string): Promise<string> {
    try {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          customer: true,
          aiAgent: true,
        },
      });

      if (!conversation) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }

      const messages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { firstName: true, lastName: true, role: true } },
          customer: { select: { firstName: true, lastName: true } },
        },
      });

      const transcript = messages
        .map((m) => {
          const name = m.sender
            ? `${m.sender.firstName} ${m.sender.lastName}`
            : m.customer
              ? `${m.customer.firstName} ${m.customer.lastName}`
              : 'System';
          return `[${name}]: ${m.content}`;
        })
        .join('\n');

      const prompt = `Summarize the following customer support conversation in 3-5 sentences. Include the customer's issue, key details discussed, and any resolution or next steps.

Customer: ${conversation.customer.firstName} ${conversation.customer.lastName}
Channel: ${conversation.channel}
Duration: ${messages.length} messages

Transcript:
${transcript}

Summary:`;

      const provider = this.getProviderForAgent(conversation.aiAgent);
      const response = await provider.generateChatCompletion([
        { role: 'user', content: prompt },
      ], {
        temperature: 0.3,
        maxTokens: 300,
      });

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async recommendSolution(ticketId: string): Promise<{ articleId: string; title: string; relevance: number }[]> {
    try {
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          company: true,
          conversation: {
            include: { aiAgent: true },
          },
        },
      });

      if (!ticket) {
        throw new Error(`Ticket not found: ${ticketId}`);
      }

      const searchText = `${ticket.title} ${ticket.description || ''} ${ticket.category || ''}`;

      const embedding = await this.getEmbeddingProvider().generateEmbedding(searchText);

      const vectorResults = await this.vectorService.queryVectors(
        embedding,
        5,
        { companyId: ticket.companyId },
      );

      const recommendations: { articleId: string; title: string; relevance: number }[] = [];

      for (const result of vectorResults) {
        const docId = result.metadata?.documentId as string | undefined;
        if (docId) {
          const document = await this.prisma.document.findUnique({
            where: { id: docId },
            select: { id: true, title: true },
          });
          if (document) {
            recommendations.push({
              articleId: document.id,
              title: document.title,
              relevance: Math.round(result.score * 100) / 100,
            });
          }
        }
      }

      return recommendations;
    } catch (error) {
      this.logger.error(
        `Failed to recommend solutions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private getProviderForAgent(agent: { modelProvider?: ModelProvider } | null) {
    const providerMap: Record<string, any> = {
      [ModelProvider.OPENAI]: this.openaiProvider,
      [ModelProvider.CLAUDE]: this.claudeProvider,
      [ModelProvider.GEMINI]: this.geminiProvider,
    };
    return providerMap[agent?.modelProvider || ModelProvider.OPENAI] || this.openaiProvider;
  }

  private getEmbeddingProvider() {
    return this.openaiProvider;
  }
}
