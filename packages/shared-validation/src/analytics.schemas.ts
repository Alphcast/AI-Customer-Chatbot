import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime({ message: 'Invalid start date' }),
  endDate: z.string().datetime({ message: 'Invalid end date' }),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']),
  companyId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  channel: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
