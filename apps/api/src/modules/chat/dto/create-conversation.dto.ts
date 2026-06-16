import { IsString, IsOptional, IsEnum, IsEmail, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';

export class CustomerInfoDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;
}

export class CreateConversationDto {
  @ApiProperty()
  @IsString()
  companyId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ type: CustomerInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer?: CustomerInfoDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aiAgentId?: string;

  @ApiPropertyOptional({ enum: ChannelType })
  @IsOptional()
  @IsEnum(ChannelType)
  channel?: ChannelType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
