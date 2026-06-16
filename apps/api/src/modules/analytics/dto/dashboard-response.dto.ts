import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class StatusDistribution {
  @ApiProperty() status: string;
  @ApiProperty() count: number;
}

class PriorityDistribution {
  @ApiProperty() priority: string;
  @ApiProperty() count: number;
}

class DailyCount {
  @ApiProperty() date: string;
  @ApiProperty() count: number;
}

class SentimentCount {
  @ApiProperty() sentiment: string;
  @ApiProperty() count: number;
}

export class DashboardResponseDto {
  @ApiProperty() totalConversations: number;
  @ApiProperty() activeUsers: number;
  @ApiProperty() resolutionRate: number;
  @ApiProperty() avgResponseTime: number;
  @ApiProperty() avgCsatScore: number;
  @ApiProperty() activeAgents: number;
  @ApiProperty() pendingTickets: number;
  @ApiProperty() monthlyAiCost: number;

  @ApiPropertyOptional({ type: [StatusDistribution] })
  ticketsByStatus?: StatusDistribution[];

  @ApiPropertyOptional({ type: [PriorityDistribution] })
  ticketsByPriority?: PriorityDistribution[];

  @ApiPropertyOptional({ type: [DailyCount] })
  conversationTrend?: DailyCount[];

  @ApiPropertyOptional({ type: [SentimentCount] })
  sentimentDistribution?: SentimentCount[];
}
