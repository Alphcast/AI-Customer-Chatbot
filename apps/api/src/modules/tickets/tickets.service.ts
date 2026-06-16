import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketQueryDto } from './dto/ticket-query.dto';
import { CreateInternalNoteDto } from './dto/create-internal-note.dto';
import { JwtPayload, PaginatedResult } from '../../common/interfaces';
import { TicketStatus, TicketPriority, NotificationType } from '@prisma/client';

const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.OPEN]: [TicketStatus.PENDING, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.PENDING]: [TicketStatus.OPEN, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.OPEN],
  [TicketStatus.CLOSED]: [TicketStatus.OPEN],
};

const SLA_HOURS: Record<TicketPriority, number> = {
  [TicketPriority.LOW]: 72,
  [TicketPriority.MEDIUM]: 48,
  [TicketPriority.HIGH]: 24,
  [TicketPriority.CRITICAL]: 4,
};

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTicketDto, user: JwtPayload): Promise<any> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, companyId: user.companyId },
    });
    if (!customer) throw new NotFoundException('Customer not found in your company');

    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: dto.assigneeId, companyId: user.companyId, isActive: true, deletedAt: null },
      });
      if (!assignee) throw new NotFoundException('Assignee not found in your company');
    }

    if (dto.conversationId) {
      const conversation = await this.prisma.conversation.findFirst({
        where: { id: dto.conversationId, companyId: user.companyId },
      });
      if (!conversation) throw new NotFoundException('Conversation not found');
    }

    const priority = dto.priority || TicketPriority.MEDIUM;
    const slaDeadline = this.calculateSlaDeadline(priority);

    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority,
        category: dto.category,
        slaDeadline,
        companyId: user.companyId,
        customerId: dto.customerId,
        assigneeId: dto.assigneeId || null,
        conversationId: dto.conversationId || null,
      },
      include: {
        customer: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      },
    });

    if (dto.assigneeId) {
      await this.prisma.notification.create({
        data: {
          userId: dto.assigneeId,
          type: NotificationType.TICKET_CREATED,
          title: 'New ticket assigned to you',
          body: `Ticket: ${dto.title.slice(0, 100)}`,
          data: { ticketId: ticket.id, createdBy: user.sub },
        },
      });
    }

    return this.formatTicketResponse(ticket);
  }

  async findAll(query: TicketQueryDto, user: JwtPayload): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', status, priority, category, assigneeId, customerId } = query;
    const skip = (page - 1) * limit;

    const where: any = { companyId: user.companyId };

    if (user.role === 'SUPPORT_AGENT') {
      where.assigneeId = user.sub;
    } else if (user.role === 'CUSTOMER') {
      where.customerId = user.sub;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assigneeId) where.assigneeId = assigneeId;
    if (customerId) where.customerId = customerId;

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          customer: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } },
          assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          _count: { select: { internalNotes: true } },
        },
        orderBy: { [sortBy || 'createdAt']: sortOrder || 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data.map((t) => ({
        ...t,
        sla: this.buildSlaInfo(t.slaDeadline),
      })),
      meta: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
    };
  }

  async findById(id: string, user: JwtPayload): Promise<any> {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id },
      include: {
        customer: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
        internalNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    this.validateAccess(ticket, user);

    return {
      ...ticket,
      sla: this.buildSlaInfo(ticket.slaDeadline),
    };
  }

  async update(id: string, dto: UpdateTicketDto, user: JwtPayload): Promise<any> {
    const ticket = await this.findByIdInternal(id, user);
    this.validateAccess(ticket, user);

    if (dto.status) {
      this.validateStatusTransition(ticket.status, dto.status);
    }

    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: dto.assigneeId, companyId: user.companyId, isActive: true, deletedAt: null },
      });
      if (!assignee) throw new NotFoundException('Assignee not found in your company');
    }

    const updateData: any = {};
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) {
      updateData.priority = dto.priority;
      updateData.slaDeadline = this.calculateSlaDeadline(dto.priority);
    }
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.assigneeId !== undefined) updateData.assigneeId = dto.assigneeId;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;

    if (dto.status === TicketStatus.RESOLVED) updateData.resolvedAt = new Date();
    if (dto.status === TicketStatus.CLOSED) updateData.closedAt = new Date();

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      },
    });

    if (dto.assigneeId && dto.assigneeId !== ticket.assigneeId) {
      await this.prisma.notification.create({
        data: {
          userId: dto.assigneeId,
          type: NotificationType.TICKET_CREATED,
          title: 'Ticket assigned to you',
          body: `Ticket: ${ticket.title.slice(0, 100)}`,
          data: { ticketId: id, assignedBy: user.sub },
        },
      });
    }

    return this.formatTicketResponse(updated);
  }

  async remove(id: string, user: JwtPayload): Promise<void> {
    const ticket = await this.findByIdInternal(id, user);
    this.validateAccess(ticket, user);

    await this.prisma.ticket.update({
      where: { id },
      data: { status: TicketStatus.CLOSED, closedAt: new Date() },
    });
  }

  async addNote(id: string, dto: CreateInternalNoteDto, user: JwtPayload): Promise<any> {
    const ticket = await this.findByIdInternal(id, user);
    this.validateAccess(ticket, user);

    const note = await this.prisma.internalNote.create({
      data: {
        content: dto.content,
        ticketId: id,
        authorId: user.sub,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      },
    });

    return note;
  }

  async getNotes(id: string, user: JwtPayload): Promise<any[]> {
    const ticket = await this.findByIdInternal(id, user);
    this.validateAccess(ticket, user);

    return this.prisma.internalNote.findMany({
      where: { ticketId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      },
    });
  }

  async assign(id: string, assigneeId: string, user: JwtPayload): Promise<any> {
    const ticket = await this.findByIdInternal(id, user);
    this.validateAccess(ticket, user);

    const agent = await this.prisma.user.findFirst({
      where: { id: assigneeId, companyId: user.companyId, isActive: true, deletedAt: null },
    });
    if (!agent) throw new NotFoundException('Agent not found in your company');

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: { assigneeId },
      include: {
        customer: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      },
    });

    await this.prisma.notification.create({
      data: {
        userId: assigneeId,
        type: NotificationType.TICKET_CREATED,
        title: 'Ticket assigned to you',
        body: `Ticket: ${ticket.title.slice(0, 100)}`,
        data: { ticketId: id, assignedBy: user.sub },
      },
    });

    return this.formatTicketResponse(updated);
  }

  async resolve(id: string, user: JwtPayload): Promise<any> {
    const ticket = await this.findByIdInternal(id, user);
    this.validateAccess(ticket, user);

    this.validateStatusTransition(ticket.status, TicketStatus.RESOLVED);

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: { status: TicketStatus.RESOLVED, resolvedAt: new Date() },
      include: {
        customer: { select: { id: true, email: true, firstName: true, lastName: true, avatar: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      },
    });

    return this.formatTicketResponse(updated);
  }

  async getDashboardStats(companyId: string): Promise<any> {
    const tickets = await this.prisma.ticket.findMany({
      where: { companyId },
      select: { status: true, priority: true, resolvedAt: true, createdAt: true, slaDeadline: true },
    });

    const total = tickets.length;
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let resolvedCount = 0;
    let totalResolutionTime = 0;
    let resolutionCount = 0;
    let slaBreached = 0;

    for (const t of tickets) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;

      if (t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED) {
        resolvedCount++;
        if (t.resolvedAt) {
          totalResolutionTime += (t.resolvedAt.getTime() - t.createdAt.getTime());
          resolutionCount++;
        }
      }

      if (t.slaDeadline && !t.resolvedAt && t.slaDeadline < new Date()) {
        slaBreached++;
      }
    }

    const resolutionRate = total > 0 ? (resolvedCount / total) * 100 : 0;
    const avgResolutionTime = resolutionCount > 0 ? totalResolutionTime / resolutionCount / (1000 * 60 * 60) : 0;

    return {
      total,
      byStatus,
      byPriority,
      resolutionRate: Math.round(resolutionRate * 100) / 100,
      avgResolutionTimeHours: Math.round(avgResolutionTime * 100) / 100,
      slaBreached,
      pendingCount: byStatus[TicketStatus.OPEN] || 0 + (byStatus[TicketStatus.PENDING] || 0),
    };
  }

  private async findByIdInternal(id: string, user: JwtPayload): Promise<any> {
    const ticket = await this.prisma.ticket.findFirst({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  private validateAccess(ticket: any, user: JwtPayload): void {
    if (user.role === 'SUPER_ADMIN') return;
    if (ticket.companyId !== user.companyId) throw new ForbiddenException('Access denied to this ticket');
    if (user.role === 'SUPPORT_AGENT' && ticket.assigneeId && ticket.assigneeId !== user.sub) {
      throw new ForbiddenException('This ticket is assigned to another agent');
    }
    if (user.role === 'CUSTOMER' && ticket.customerId !== user.sub) {
      throw new ForbiddenException('Access denied');
    }
  }

  private validateStatusTransition(current: TicketStatus, next: TicketStatus): void {
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed || !allowed.includes(next)) {
      throw new BadRequestException(`Cannot transition from ${current} to ${next}`);
    }
  }

  private calculateSlaDeadline(priority: TicketPriority): Date {
    const hours = SLA_HOURS[priority] || 48;
    return new Date(Date.now() + hours * 60 * 60 * 1000);
  }

  private buildSlaInfo(slaDeadline: Date | null): { deadline: Date | null; isBreached: boolean; remainingHours: number | null } {
    if (!slaDeadline) return { deadline: null, isBreached: false, remainingHours: null };
    const now = new Date();
    const remainingMs = slaDeadline.getTime() - now.getTime();
    return {
      deadline: slaDeadline,
      isBreached: remainingMs < 0,
      remainingHours: Math.round((remainingMs / (1000 * 60 * 60)) * 100) / 100,
    };
  }

  private formatTicketResponse(ticket: any): any {
    return {
      ...ticket,
      sla: this.buildSlaInfo(ticket.slaDeadline),
    };
  }
}
