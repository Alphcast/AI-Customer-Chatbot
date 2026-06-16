import { IsString, IsArray, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterWebhookDto {
  @ApiProperty()
  @IsString()
  @IsUrl({ require_tld: false })
  url: string;

  @ApiProperty({ isArray: true, type: String })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secret?: string;
}
