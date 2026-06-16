import { Global, Module } from '@nestjs/common';
import { PrismaService } from './config/database';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
