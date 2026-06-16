import { IsString, IsOptional, IsEnum, IsObject, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '@prisma/client';

export class CreateMessageDto {
  @ApiProperty()
  @IsString()
  conversationId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(10000)
  content: string;

  @ApiPropertyOptional({ enum: MessageType })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
