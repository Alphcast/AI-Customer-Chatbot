import { IsString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IncomingWebhookDto {
  @ApiProperty({ enum: ['whatsapp', 'telegram', 'messenger', 'instagram'] })
  @IsString()
  provider: 'whatsapp' | 'telegram' | 'messenger' | 'instagram';

  @ApiProperty()
  @IsObject()
  payload: Record<string, any>;
}
