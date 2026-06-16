import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super();
    this.$use(async (params, next) => {
      const softDeleteModels = ['User', 'Company', 'Agent'];
      if (params.action === 'findMany' || params.action === 'findFirst') {
        if (softDeleteModels.includes(params.model)) {
          if (!params.args) params.args = {};
          if (!params.args.where) params.args.where = {};
          if (params.args.where.deletedAt === undefined) {
            params.args.where.deletedAt = null;
          }
        }
      }
      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }
}
