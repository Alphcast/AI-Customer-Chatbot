import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-abc-123' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewStrongP@ss456' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
