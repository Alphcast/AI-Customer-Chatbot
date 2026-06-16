import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private pubClient: Redis;
  private subClient: Redis;

  async connectToRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.pubClient = new Redis(redisUrl);
    this.subClient = new Redis(redisUrl);

    this.pubClient.on('error', (err) => this.logger.error(`Redis pub error: ${err.message}`));
    this.subClient.on('error', (err) => this.logger.error(`Redis sub error: ${err.message}`));

    await Promise.all([this.pubClient.ping(), this.subClient.ping()]);
    this.logger.log('Redis adapter connected');
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);

    if (this.pubClient && this.subClient) {
      server.adapter(createAdapter(this.pubClient, this.subClient));
      this.logger.log('Redis adapter attached to Socket.IO server');
    }

    return server;
  }
}
