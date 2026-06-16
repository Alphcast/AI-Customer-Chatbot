import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType, Sentiment } from '@prisma/client';

class SenderInfo {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  avatar?: string;

  @ApiPropertyOptional()
  role?: string;
}

export class MessageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ enum: MessageType })
  type: MessageType;

  @ApiPropertyOptional()
  metadata?: any;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiPropertyOptional()
  mimeType?: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty({ enum: Sentiment })
  sentiment: Sentiment;

  @ApiProperty()
  conversationId: string;

  @ApiPropertyOptional()
  senderId?: string;

  @ApiPropertyOptional()
  customerId?: string;

  @ApiPropertyOptional({ type: SenderInfo })
  sender?: SenderInfo;

  @ApiPropertyOptional({ type: SenderInfo })
  customer?: SenderInfo;

  @ApiProperty()
  createdAt: Date;

  constructor(partial: Partial<MessageResponseDto>) {
    Object.assign(this, partial);
  }
}
