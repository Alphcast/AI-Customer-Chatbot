import { ConfigService } from '@nestjs/config';
import { BullModuleOptions, SharedBullConfigurationFactory } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisConfig implements SharedBullConfigurationFactory {
  constructor(private config: ConfigService) {}

  createSharedConfiguration(): BullModuleOptions {
    const redisUrl = this.config.get('REDIS_URL');
    const url = redisUrl ? new URL(redisUrl) : null;

    return {
      redis: {
        host: url?.hostname || 'localhost',
        port: url ? Number(url.port) || 6379 : 6379,
        password: url?.password || undefined,
        db: url?.pathname ? parseInt(url.pathname.slice(1), 10) || 0 : 0,
      },
    };
  }

  getRedisConfig() {
    const redisUrl = this.config.get('REDIS_URL');
    const url = redisUrl ? new URL(redisUrl) : null;

    return {
      host: url?.hostname || 'localhost',
      port: url ? Number(url.port) || 6379 : 6379,
      password: url?.password || undefined,
      db: url?.pathname ? parseInt(url.pathname.slice(1), 10) || 0 : 0,
    };
  }
}
