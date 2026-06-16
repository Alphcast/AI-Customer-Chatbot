import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'document-processing',
    }),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
