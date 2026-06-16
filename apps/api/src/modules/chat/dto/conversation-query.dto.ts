import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationStatus, ChannelType } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ConversationQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @ApiPropertyOptional({ enum: ChannelType })
  @IsOptional()
  @IsEnum(ChannelType)
  channel?: ChannelType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedUserId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;
}
