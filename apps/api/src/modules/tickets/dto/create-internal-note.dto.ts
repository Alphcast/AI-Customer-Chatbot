import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInternalNoteDto {
  @ApiProperty({ description: 'Note content' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content: string;
}
