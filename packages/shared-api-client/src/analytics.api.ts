import {
  DashboardMetrics,
  ConversationAnalytics,
  AgentPerformance,
  RevenueMetrics,
  SentimentDistribution,
  AnalyticsQuery,
  ApiResponse,
} from '@shared/types';
import { apiClient } from './client';

export async function getDashboard(params?: Partial<AnalyticsQuery>): Promise<DashboardMetrics> {
  const response = await apiClient.get<ApiResponse<DashboardMetrics>>('/analytics/dashboard', { params });
  return response.data.data;
}

export async function getConversationAnalytics(params?: Partial<AnalyticsQuery>): Promise<ConversationAnalytics> {
  const response = await apiClient.get<ApiResponse<ConversationAnalytics>>('/analytics/conversations', { params });
  return response.data.data;
}

export async function getAgentPerformance(params?: Partial<AnalyticsQuery>): Promise<AgentPerformance[]> {
  const response = await apiClient.get<ApiResponse<AgentPerformance[]>>('/analytics/agents', { params });
  return response.data.data;
}

export async function getAiUsage(params?: Partial<AnalyticsQuery>): Promise<{ totalTokens: number; cost: number; byModel: Record<string, { tokens: number; cost: number }> }> {
  const response = await apiClient.get<ApiResponse<{ totalTokens: number; cost: number; byModel: Record<string, { tokens: number; cost: number }> }>>('/analytics/ai-usage', { params });
  return response.data.data;
}

export async function getRevenueMetrics(params?: Partial<AnalyticsQuery>): Promise<RevenueMetrics> {
  const response = await apiClient.get<ApiResponse<RevenueMetrics>>('/analytics/revenue', { params });
  return response.data.data;
}

export async function getSentimentDistribution(params?: Partial<AnalyticsQuery>): Promise<SentimentDistribution> {
  const response = await apiClient.get<ApiResponse<SentimentDistribution>>('/analytics/sentiment', { params });
  return response.data.data;
}
