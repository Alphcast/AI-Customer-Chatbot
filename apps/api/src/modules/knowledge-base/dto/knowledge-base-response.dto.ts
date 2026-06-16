import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class DocumentSummary {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  chunkCount?: number;
}

export class KnowledgeBaseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  companyId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [DocumentSummary] })
  documents?: DocumentSummary[];
}
