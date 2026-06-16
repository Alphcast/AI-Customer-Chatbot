export interface DashboardMetrics {
  totalConversations: number;
  activeConversations: number;
  resolvedConversations: number;
  averageResponseTime: number;
  averageSatisfactionScore: number;
  totalMessages: number;
  totalCustomers: number;
  activeAgents: number;
  totalTickets: number;
  openTickets: number;
  totalKnowledgeBases: number;
  totalDocuments: number;
}

export interface ConversationAnalytics {
  total: number;
  byChannel: Record<string, number>;
  byStatus: Record<string, number>;
  byDate: Array<{ date: string; count: number }>;
  averageDuration: number;
  averageMessagesPerConversation: number;
  resolutionRate: number;
  handoffRate: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalConversations: number;
  resolvedConversations: number;
  averageResponseTime: number;
  averageSatisfactionScore: number;
  averageConversationDuration: number;
  totalMessages: number;
  handoffRate: number;
  utilizationRate: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  recurringRevenue: number;
  oneTimeRevenue: number;
  byPlan: Record<string, number>;
  byPeriod: Array<{ date: string; amount: number }>;
  averageRevenuePerCustomer: number;
  churnRate: number;
  conversionRate: number;
  refundRate: number;
}

export interface SentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
  byPeriod: Array<{
    date: string;
    positive: number;
    neutral: number;
    negative: number;
  }>;
}

export interface AnalyticsQuery {
  startDate: string;
  endDate: string;
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  companyId?: string;
  agentId?: string;
  channel?: string;
  groupBy?: 'day' | 'week' | 'month';
}
