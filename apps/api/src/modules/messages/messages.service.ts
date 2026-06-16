import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../config/database';
import { AiService } from '../../providers/ai.service';
import { S3Service } from '../../providers/s3.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtPayload, PaginatedResult } from '../../common/interfaces';
import { ChatGateway } from '../chat/chat.gateway';
import { Conversation, Message } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    private readonly aiService: AiService,
    private readonly s3Service: S3Service,
  ) {}

  async create(
    dto: CreateMessageDto,
    senderId?: string,
    userId?: string,
  ): Promise<any> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversationId },
      include: { aiAgent: true },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        content: dto.content,
        type: dto.type || 'TEXT',
        metadata: dto.metadata || undefined,
        senderId: userId || null,
        customerId: senderId && !userId ? senderId : null,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    this.chatGateway.emitNewMessage(dto.conversationId, message);

    if (conversation.aiAgentId && !conversation.assignedUserId && !userId) {
      this.triggerAiResponse(conversation, message).catch((err) =>
        this.logger.error(`AI response error: ${err.message}`),
      );
    }

    return message;
  }

  async findAll(
    conversationId: string,
    pagination: { page: number; limit: number },
    user?: JwtPayload,
  ): Promise<PaginatedResult<Message>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
          },
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string): Promise<Message> {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async softDelete(id: string): Promise<void> {
    const message = await this.prisma.message.findUnique({ where: { id } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    await this.prisma.message.update({
      where: { id },
      data: {
        content: '[deleted]',
        metadata: { ...(message.metadata as any), deletedAt: new Date().toISOString() },
      },
    });
  }

  async markAsRead(messageIds: string[], userId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: {
        id: { in: messageIds },
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async uploadFile(
    conversationId: string,
    file: Express.Multer.File,
    metadata?: Record<string, any>,
  ): Promise<any> {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const key = `conversations/${conversationId}/${uuidv4()}-${file.originalname}`;
    const fileUrl = await this.s3Service.uploadFile(file.buffer, key, file.mimetype);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        content: file.originalname,
        type: 'FILE',
        fileUrl,
        fileSize: file.size,
        mimeType: file.mimetype,
        metadata: metadata || undefined,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true },
        },
        customer: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
      },
    });

    this.chatGateway.emitNewMessage(conversationId, message);

    return message;
  }

  private async triggerAiResponse(conversation: Conversation & { aiAgent?: any }, userMessage: Message): Promise<void> {
    try {
      const agent = await this.prisma.agent.findUnique({
        where: { id: conversation.aiAgentId! },
      });
      if (!agent || !agent.isActive) return;

      const recentMessages = await this.prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
        take: 20,
      });

      const chatHistory = recentMessages.map((msg) => {
        let role: 'user' | 'assistant' = 'user';
        if (msg.senderId) role = 'assistant';
        if (msg.type === 'SYSTEM') role = 'assistant';
        return { role, content: msg.content } as const;
      });

      const aiResponse = await this.aiService.generateChatResponse(chatHistory, {
        modelName: agent.modelName || undefined,
        temperature: agent.temperature ?? undefined,
        maxTokens: agent.maxTokens ?? undefined,
        instructions: agent.instructions || undefined,
      });

      if (aiResponse) {
        const systemMessage = await this.prisma.message.create({
          data: {
            conversationId: conversation.id,
            content: aiResponse,
            type: 'SYSTEM',
            metadata: { aiAgentId: agent.id, aiAgentName: agent.name },
          },
          include: {
            sender: true,
            customer: true,
          },
        });

        this.chatGateway.emitNewMessage(conversation.id, systemMessage);
      }
    } catch (error) {
      this.logger.error(`Failed to generate AI response: ${(error as Error).message}`);

      await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: 'I apologize, but I encountered an error processing your request. Please try again or a human agent will assist you shortly.',
          type: 'SYSTEM',
          metadata: { error: true },
        },
      });
    }
  }
}
