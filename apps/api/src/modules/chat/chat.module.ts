import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [forwardRef(() => MessagesModule)],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService],
  exports: [ChatGateway, ChatService],
})
export class ChatModule {}
