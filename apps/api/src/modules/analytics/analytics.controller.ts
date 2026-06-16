import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces';
import { AnalyticsService } from './analytics.service';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';
import { UserRole } from '@prisma/client';
import { Response } from 'express';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get main dashboard metrics' })
  getDashboard(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getDashboardMetrics(user);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversation analytics over time' })
  getConversations(@Query() query: AnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.analyticsService.getConversationAnalytics(query, user);
  }

  @Get('messages')
  @ApiOperation({ summary: 'Get message volume analytics' })
  getMessages(@Query() query: AnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.analyticsService.getMessageAnalytics(query, user);
  }

  @Get('satisfaction')
  @ApiOperation({ summary: 'Get CSAT scores' })
  getSatisfaction(@Query() query: AnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.analyticsService.getSatisfactionScores(query, user);
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get agent performance metrics' })
  @Roles(UserRole.BUSINESS_OWNER, UserRole.SUPER_ADMIN)
  getAgents(@Query() query: AnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.analyticsService.getAgentPerformance(query, user);
  }

  @Get('ai-usage')
  @ApiOperation({ summary: 'Get AI token usage and costs' })
  getAiUsage(@Query() query: AnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.analyticsService.getAiUsage(query, user);
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue metrics (admin only)' })
  @Roles(UserRole.SUPER_ADMIN)
  getRevenue(@Query() query: AnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.analyticsService.getRevenueMetrics(query, user);
  }

  @Get('sentiment')
  @ApiOperation({ summary: 'Get sentiment distribution' })
  getSentiment(@Query() query: AnalyticsQueryDto, @CurrentUser() user: JwtPayload) {
    return this.analyticsService.getSentimentDistribution(query, user);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export analytics as CSV' })
  async export(@Query() query: AnalyticsQueryDto, @CurrentUser() user: JwtPayload, @Res() res: Response) {
    const csv = await this.analyticsService.exportAnalytics(query, user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=analytics-export-${Date.now()}.csv`);
    res.send(csv);
  }
}
