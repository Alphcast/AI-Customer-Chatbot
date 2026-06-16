import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { S3Service } from './s3.service';

@Global()
@Module({
  providers: [AiService, S3Service],
  exports: [AiService, S3Service],
})
export class ProvidersModule {}
