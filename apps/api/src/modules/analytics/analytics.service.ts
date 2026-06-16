import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../config/database';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { JwtPayload } from '../../common/interfaces';
import { ConversationStatus, Sentiment } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics(user: JwtPayload) {
    const companyId = user.companyId;
    if (!companyId && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('No company associated with user');
    }

    const companyFilter = user.role === 'SUPER_ADMIN' ? {} : { companyId };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalConversations,
      conversationsLast30d,
      activeUsers,
      pendingTickets,
      agentsCount,
      resolvedConversations,
      totalConversationsCount,
      messagesLast30d,
      paymentsThisMonth,
      ticketStats,
    ] = await Promise.all([
      this.prisma.conversation.count({ where: companyFilter }),
      this.prisma.conversation.count({ where: { ...companyFilter, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.user.count({ where: { ...companyFilter, isActive: true, role: { not: 'CUSTOMER' } } }),
      this.prisma.ticket.count({ where: { ...companyFilter, status: { in: ['OPEN', 'PENDING'] as any } } }),
      this.prisma.user.count({ where: { ...companyFilter, role: 'SUPPORT_AGENT', isActive: true } }),
      this.prisma.conversation.count({ where: { ...companyFilter, status: 'RESOLVED' as ConversationStatus } }),
      this.prisma.conversation.count({ where: companyFilter }),
      this.prisma.message.count({ where: { conversation: companyFilter, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.payment.aggregate({
        where: { ...companyFilter, createdAt: { gte: firstOfMonth }, status: 'SUCCEEDED' },
        _sum: { amount: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['status'],
        where: companyFilter,
        _count: true,
      }),
    ]);

    const resolutionRate = totalConversationsCount > 0
      ? Math.round((resolvedConversations / totalConversationsCount) * 10000) / 100
      : 0;

    const avgResponseTime = messagesLast30d > 0 && conversationsLast30d > 0
      ? Math.round((30 * 24 * 60) / conversationsLast30d)
      : 0;

    const ticketByStatus = ticketStats.map((t) => ({ status: t.status, count: t._count }));

    const sentimentData = await this.prisma.conversation.groupBy({
      by: ['sentiment'],
      where: companyFilter,
      _count: true,
    });
    const sentimentDistribution = sentimentData.map((s) => ({ sentiment: s.sentiment, count: s._count }));

    const resolvedConversationsWithData = await this.prisma.conversation.findMany({
      where: { ...companyFilter, status: { in: ['RESOLVED', 'CLOSED'] as any } },
      select: { sentiment: true },
    });
    const csatScore = resolvedConversationsWithData.length > 0
      ? Math.round(
          (resolvedConversationsWithData.filter(c => c.sentiment === 'POSITIVE' || c.sentiment === 'NEUTRAL').length /
            resolvedConversationsWithData.length) * 10000
        ) / 100
      : 0;

    return {
      totalConversations,
      activeUsers,
      resolutionRate,
      avgResponseTime,
      avgCsatScore: csatScore,
      activeAgents: agentsCount,
      pendingTickets,
      monthlyAiCost: Number(paymentsThisMonth._sum.amount || 0),
      ticketsByStatus: ticketByStatus,
      sentimentDistribution,
    };
  }

  async getConversationAnalytics(query: AnalyticsQueryDto, user: JwtPayload) {
    const companyFilter = this.buildCompanyFilter(query, user);
    const { startDate, endDate } = this.parseDateRange(query);
    const period = query.period || 'day';

    const conversations = await this.prisma.conversation.findMany({
      where: { ...companyFilter, createdAt: { gte: startDate, lte: endDate } },
      select: { createdAt: true, status: true, channel: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, { total: number; byStatus: Record<string, number>; byChannel: Record<string, number> }> = {};

    for (const c of conversations) {
      const key = this.getPeriodKey(c.createdAt, period);
      if (!grouped[key]) grouped[key] = { total: 0, byStatus: {}, byChannel: {} };
      grouped[key].total++;
      grouped[key].byStatus[c.status] = (grouped[key].byStatus[c.status] || 0) + 1;
      grouped[key].byChannel[c.channel] = (grouped[key].byChannel[c.channel] || 0) + 1;
    }

    return Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
  }

  async getMessageAnalytics(query: AnalyticsQueryDto, user: JwtPayload) {
    const companyFilter = this.buildCompanyFilter(query, user);
    const { startDate, endDate } = this.parseDateRange(query);
    const period = query.period || 'day';

    const messages = await this.prisma.message.findMany({
      where: {
        conversation: companyFilter,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true, type: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, { total: number; byType: Record<string, number> }> = {};

    for (const m of messages) {
      const key = this.getPeriodKey(m.createdAt, period);
      if (!grouped[key]) grouped[key] = { total: 0, byType: {} };
      grouped[key].total++;
      grouped[key].byType[m.type] = (grouped[key].byType[m.type] || 0) + 1;
    }

    return Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
  }

  async getSatisfactionScores(query: AnalyticsQueryDto, user: JwtPayload) {
    const companyFilter = this.buildCompanyFilter(query, user);
    const { startDate, endDate } = this.parseDateRange(query);

    const conversations = await this.prisma.conversation.findMany({
      where: { ...companyFilter, createdAt: { gte: startDate, lte: endDate } },
      select: { sentiment: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const sentimentCounts: Record<string, number> = {};
    for (const c of conversations) {
      sentimentCounts[c.sentiment] = (sentimentCounts[c.sentiment] || 0) + 1;
    }

    const total = conversations.length;
    const positive = (sentimentCounts['POSITIVE'] || 0) + (sentimentCounts['NEUTRAL'] || 0);
    const csatScore = total > 0 ? Math.round((positive / total) * 10000) / 100 : 0;

    return {
      averageCsat: csatScore,
      totalResponses: total,
      distribution: sentimentCounts,
    };
  }

  async getAgentPerformance(query: AnalyticsQueryDto, user: JwtPayload) {
    const companyFilter = this.buildCompanyFilter(query, user);
    const { startDate, endDate } = this.parseDateRange(query);
    const agentId = query.agentId;

    const agentsWhere: any = { ...companyFilter, role: 'SUPPORT_AGENT', isActive: true };
    if (agentId) agentsWhere.id = agentId;

    const agents = await this.prisma.user.findMany({
      where: agentsWhere,
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const result = [];

    for (const agent of agents) {
      const conversations = await this.prisma.conversation.findMany({
        where: {
          assignedUserId: agent.id,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { status: true, createdAt: true, resolvedAt: true },
      });

      const handled = conversations.length;
      const resolved = conversations.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
      const resolutionRate = handled > 0 ? Math.round((resolved / handled) * 10000) / 100 : 0;

      const tickets = await this.prisma.ticket.findMany({
        where: {
          assigneeId: agent.id,
          createdAt: { gte: startDate, lte: endDate },
        },
        select: { status: true, createdAt: true, resolvedAt: true },
      });

      const ticketsResolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
      const ticketResolutionRate = tickets.length > 0 ? Math.round((ticketsResolved / tickets.length) * 10000) / 100 : 0;

      result.push({
        agent: { id: agent.id, name: `${agent.firstName} ${agent.lastName}`, email: agent.email },
        conversationsHandled: handled,
        conversationsResolved: resolved,
        resolutionRate,
        ticketsAssigned: tickets.length,
        ticketsResolved,
        ticketResolutionRate,
      });
    }

    return result;
  }

  async getAiUsage(query: AnalyticsQueryDto, user: JwtPayload) {
    const companyFilter = this.buildCompanyFilter(query, user);
    const { startDate, endDate } = this.parseDateRange(query);
    const period = query.period || 'day';

    const messages = await this.prisma.message.findMany({
      where: {
        conversation: companyFilter,
        senderId: null,
        customerId: null,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const grouped: Record<string, { count: number; estimatedTokens: number; estimatedCost: number }> = {};

    for (const m of messages) {
      const key = this.getPeriodKey(m.createdAt, period);
      if (!grouped[key]) grouped[key] = { count: 0, estimatedTokens: 0, estimatedCost: 0 };
      grouped[key].count++;
      grouped[key].estimatedTokens += 500;
      grouped[key].estimatedCost += 500 * 0.000002;
    }

    const totalMessages = messages.length;
    const totalCost = totalMessages * 500 * 0.000002;

    return {
      totalAiMessages: totalMessages,
      totalEstimatedTokens: totalMessages * 500,
      totalEstimatedCost: Math.round(totalCost * 10000) / 10000,
      daily: Object.entries(grouped).map(([date, data]) => ({ date, ...data })),
    };
  }

  async getRevenueMetrics(query: AnalyticsQueryDto, user: JwtPayload) {
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Admin only');

    const { startDate, endDate } = this.parseDateRange(query);

    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'SUCCEEDED',
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { amount: true, currency: true, createdAt: true, provider: true },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const activeSubscriptions = await this.prisma.subscription.count({
      where: { status: 'ACTIVE' },
    });
    const canceledSubscriptions = await this.prisma.subscription.count({
      where: { status: 'CANCELED', updatedAt: { gte: startDate, lte: endDate } },
    });
    const totalSubscriptions = await this.prisma.subscription.count();
    const churnRate = totalSubscriptions > 0
      ? Math.round((canceledSubscriptions / totalSubscriptions) * 10000) / 100
      : 0;

    const revenueByPlan = await this.prisma.subscription.groupBy({
      by: ['plan'],
      where: { status: 'ACTIVE' },
      _count: true,
    });

    const mrr = activeSubscriptions > 0
      ? Math.round((totalRevenue / Math.max((new Date().getTime() - startDate.getTime()) / (86400000 * 30), 1)) * 100) / 100
      : 0;

    return {
      mrr,
      arr: mrr * 12,
      churnRate,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      activeSubscriptions,
      revenueByPlan: revenueByPlan.map((r) => ({ plan: r.plan, count: r._count })),
      paymentCount: payments.length,
    };
  }

  async getSentimentDistribution(query: AnalyticsQueryDto, user: JwtPayload) {
    const companyFilter = this.buildCompanyFilter(query, user);
    const { startDate, endDate } = this.parseDateRange(query);

    const conversations = await this.prisma.conversation.findMany({
      where: { ...companyFilter, createdAt: { gte: startDate, lte: endDate } },
      select: { sentiment: true },
    });

    const distribution: Record<string, number> = {};
    for (const c of conversations) {
      distribution[c.sentiment] = (distribution[c.sentiment] || 0) + 1;
    }

    return {
      total: conversations.length,
      distribution,
    };
  }

  async exportAnalytics(query: AnalyticsQueryDto, user: JwtPayload): Promise<string> {
    const companyFilter = this.buildCompanyFilter(query, user);
    const { startDate, endDate } = this.parseDateRange(query);

    const conversations = await this.prisma.conversation.findMany({
      where: { ...companyFilter, createdAt: { gte: startDate, lte: endDate } },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true } },
        assignedUser: { select: { firstName: true, lastName: true, email: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const header = 'ID,Date,Customer,Agent,Status,Channel,MessageCount,Sentiment\n';
    const rows = conversations.map((c) => [
      c.id,
      c.createdAt.toISOString(),
      `"${c.customer?.firstName || ''} ${c.customer?.lastName || ''}"`,
      `"${c.assignedUser?.firstName || ''} ${c.assignedUser?.lastName || ''}"`,
      c.status,
      c.channel,
      c._count.messages,
      c.sentiment,
    ].join(',')).join('\n');

    return header + rows;
  }

  private buildCompanyFilter(query: AnalyticsQueryDto, user: JwtPayload): any {
    if (user.role === 'SUPER_ADMIN' && query.companyId) {
      return { companyId: query.companyId };
    }
    if (!user.companyId) throw new ForbiddenException('No company associated');
    return { companyId: user.companyId };
  }

  private parseDateRange(query: AnalyticsQueryDto): { startDate: Date; endDate: Date } {
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const startDate = query.startDate ? new Date(query.startDate) : new Date(endDate.getTime() - 30 * 86400000);
    return { startDate, endDate };
  }

  private getPeriodKey(date: Date, period: string): string {
    const d = new Date(date);
    if (period === 'year') return `${d.getFullYear()}`;
    if (period === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (period === 'week') {
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      return `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
