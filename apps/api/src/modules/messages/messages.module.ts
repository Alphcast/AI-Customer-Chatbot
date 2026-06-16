import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    forwardRef(() => ChatModule),
    MulterModule.register({
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  ],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
