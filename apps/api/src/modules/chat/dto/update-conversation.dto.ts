import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatus, Sentiment } from '@prisma/client';

export class UpdateConversationDto {
  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @ApiPropertyOptional({ enum: Sentiment })
  @IsOptional()
  @IsEnum(Sentiment)
  sentiment?: Sentiment;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
