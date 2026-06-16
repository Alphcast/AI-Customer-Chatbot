import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { AgentsModule } from './modules/agents/agents.module';
import { ChatModule } from './modules/chat/chat.module';
import { MessagesModule } from './modules/messages/messages.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { ProvidersModule } from './providers/providers.module';
import * as redisStore from 'cache-manager-ioredis-yet';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('REDIS_URL') ? new URL(config.get('REDIS_URL')!).hostname : 'localhost',
          port: config.get('REDIS_URL') ? Number(new URL(config.get('REDIS_URL')!).port) || 6379 : 6379,
        },
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        host: config.get('REDIS_URL') ? new URL(config.get('REDIS_URL')!).hostname : 'localhost',
        port: config.get('REDIS_URL') ? Number(new URL(config.get('REDIS_URL')!).port) || 6379 : 6379,
        ttl: 60,
      }),
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    ProvidersModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    AgentsModule,
    ChatModule,
    MessagesModule,
    KnowledgeBaseModule,
    DocumentsModule,
    TicketsModule,
    PaymentsModule,
    AnalyticsModule,
    NotificationsModule,
    WebhooksModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
