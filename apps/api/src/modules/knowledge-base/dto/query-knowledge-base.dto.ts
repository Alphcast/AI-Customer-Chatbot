import { IsString, IsOptional, IsNumber, Min, Max, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryKnowledgeBaseDto {
  @ApiProperty()
  @IsString()
  @MaxLength(1000)
  query: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  topK?: number = 5;

  @ApiPropertyOptional({ default: 0.7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceThreshold?: number = 0.7;
}
