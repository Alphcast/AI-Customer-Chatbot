import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../config/database';
import { ChatGateway } from './chat.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { ConversationQueryDto } from './dto/conversation-query.dto';
import { JwtPayload, PaginatedResult } from '../../common/interfaces';
import { Conversation, Message, UserRole, ConversationStatus } from '@prisma/client';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async createConversation(dto: CreateConversationDto, user: JwtPayload): Promise<Conversation> {
    const company = await this.prisma.company.findFirst({
      where: { id: dto.companyId, deletedAt: null, isActive: true },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    let customerId = dto.customerId;

    if (!customerId && dto.customer) {
      const existingCustomer = await this.prisma.customer.findFirst({
        where: { companyId: dto.companyId, email: dto.customer.email },
      });

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const newCustomer = await this.prisma.customer.create({
          data: {
            companyId: dto.companyId,
            email: dto.customer.email,
            firstName: dto.customer.firstName,
            lastName: dto.customer.lastName,
          },
        });
        customerId = newCustomer.id;
      }
    }

    if (!customerId) {
      throw new BadRequestException('Either customerId or customer details are required');
    }

    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, companyId: dto.companyId },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (dto.aiAgentId) {
      const agent = await this.prisma.agent.findFirst({
        where: { id: dto.aiAgentId, companyId: dto.companyId, isActive: true, deletedAt: null },
      });
      if (!agent) {
        throw new NotFoundException('AI Agent not found');
      }
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        companyId: dto.companyId,
        customerId,
        aiAgentId: dto.aiAgentId || null,
        channel: dto.channel || 'WEBSITE',
        metadata: dto.metadata || undefined,
        status: 'ACTIVE',
      },
      include: {
        customer: true,
        aiAgent: true,
        assignedUser: true,
      },
    });

    this.chatGateway.emitConversationUpdated(conversation.id, {
      action: 'created',
      conversation,
    });

    return conversation;
  }

  async findAll(query: ConversationQueryDto, user: JwtPayload): Promise<PaginatedResult<Conversation>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, channel, assignedUserId, customerId, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { companyId: user.companyId };

    if (user.role === 'SUPPORT_AGENT') {
      where.assignedUserId = user.sub;
    } else if (user.role === 'CUSTOMER') {
      where.customerId = user.sub;
    }

    if (status) where.status = status;
    if (channel) where.channel = channel;
    if (assignedUserId) where.assignedUserId = assignedUserId;
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          customer: true,
          assignedUser: {
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
          },
          aiAgent: {
            select: { id: true, name: true, type: true },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
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

  async findById(id: string, user?: JwtPayload): Promise<Conversation> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id },
      include: {
        customer: true,
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        aiAgent: {
          select: { id: true, name: true, type: true, modelName: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (user) {
      this.validateAccess(conversation, user);
    }

    return conversation;
  }

  async update(id: string, dto: UpdateConversationDto, user: JwtPayload): Promise<Conversation> {
    const conversation = await this.findById(id, user);

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: {
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.assignedUserId !== undefined && { assignedUserId: dto.assignedUserId, assignedAt: new Date() }),
        ...(dto.sentiment !== undefined && { sentiment: dto.sentiment }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      },
      include: {
        customer: true,
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        aiAgent: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    this.chatGateway.emitConversationUpdated(id, {
      action: 'updated',
      conversation: updated,
    });

    return updated;
  }

  async assignAgent(id: string, agentUserId: string, user: JwtPayload): Promise<Conversation> {
    const conversation = await this.findById(id, user);

    const agent = await this.prisma.user.findFirst({
      where: { id: agentUserId, companyId: user.companyId, isActive: true, deletedAt: null },
    });
    if (!agent) {
      throw new NotFoundException('Agent not found in your company');
    }

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: {
        assignedUserId: agentUserId,
        assignedAt: new Date(),
      },
      include: {
        customer: true,
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        aiAgent: true,
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: agentUserId,
        type: 'CHAT_ASSIGNED',
        title: 'New conversation assigned',
        body: `Conversation #${id.slice(0, 8)} has been assigned to you`,
        data: { conversationId: id, assignedBy: user.sub },
      },
    });

    this.chatGateway.emitConversationUpdated(id, {
      action: 'assigned',
      conversation: updated,
      assignedBy: user.sub,
    });

    return updated;
  }

  async resolveConversation(id: string, user: JwtPayload): Promise<Conversation> {
    const conversation = await this.findById(id, user);

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      include: {
        customer: true,
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        aiAgent: true,
      },
    });

    this.chatGateway.emitConversationUpdated(id, {
      action: 'resolved',
      conversation: updated,
    });

    return updated;
  }

  async handoffToAgent(id: string, user: JwtPayload): Promise<Conversation> {
    const conversation = await this.findById(id, user);

    if (!conversation.aiAgentId) {
      throw new BadRequestException('Conversation is not in AI mode');
    }

    const supportUsers = await this.prisma.user.findMany({
      where: {
        companyId: user.companyId,
        role: { in: ['SUPPORT_AGENT', 'BUSINESS_OWNER', 'SUPER_ADMIN'] },
        isActive: true,
        deletedAt: null,
      },
      orderBy: { lastLoginAt: 'desc' },
      take: 1,
    });

    const assignedUserId = supportUsers[0]?.id || user.sub;

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: {
        aiAgentId: null,
        assignedUserId,
        assignedAt: new Date(),
        status: 'ACTIVE',
      },
      include: {
        customer: true,
        assignedUser: {
          select: { id: true, firstName: true, lastName: true, email: true, avatar: true },
        },
        aiAgent: true,
      },
    });

    if (supportUsers[0]) {
      await this.prisma.notification.create({
        data: {
          userId: supportUsers[0].id,
          type: 'CHAT_ASSIGNED',
          title: 'Conversation handed off to you',
          body: `A customer conversation has been handed off from AI to you`,
          data: { conversationId: id, handedOffBy: user.sub },
        },
      });
    }

    this.chatGateway.emitConversationUpdated(id, {
      action: 'handoff',
      conversation: updated,
    });

    return updated;
  }

  async returnToAi(id: string, user: JwtPayload): Promise<Conversation> {
    const conversation = await this.findById(id, user);

    if (!conversation.aiAgentId) {
      throw new BadRequestException('No AI agent configured for this conversation');
    }

    const updated = await this.prisma.conversation.update({
      where: { id },
      data: {
        assignedUserId: null,
        assignedAt: null,
        status: 'ACTIVE',
      },
      include: {
        customer: true,
        assignedUser: true,
        aiAgent: true,
      },
    });

    this.chatGateway.emitConversationUpdated(id, {
      action: 'return_to_ai',
      conversation: updated,
    });

    return updated;
  }

  async getMessages(
    id: string,
    pagination: { page: number; limit: number },
    user?: JwtPayload,
  ): Promise<PaginatedResult<Message>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const conversation = await this.prisma.conversation.findFirst({ where: { id } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    if (user) {
      this.validateAccess(conversation, user);
    }

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId: id },
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
      this.prisma.message.count({ where: { conversationId: id } }),
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

  private validateAccess(conversation: Conversation, user: JwtPayload): void {
    if (user.role === 'SUPER_ADMIN') return;

    if (conversation.companyId !== user.companyId) {
      throw new ForbiddenException('Access denied to this conversation');
    }

    if (user.role === 'SUPPORT_AGENT' && conversation.assignedUserId && conversation.assignedUserId !== user.sub) {
      throw new ForbiddenException('This conversation is assigned to another agent');
    }

    if (user.role === 'CUSTOMER' && conversation.customerId !== user.sub) {
      throw new ForbiddenException('Access denied');
    }
  }
}
