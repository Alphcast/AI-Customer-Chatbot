import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus, DocumentType } from '@prisma/client';

class EmbeddingSummary {
  @ApiProperty()
  id: string;

  @ApiProperty()
  vectorId: string;

  @ApiProperty()
  chunkIndex: number;

  @ApiProperty()
  content: string;
}

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  fileUrl?: string;

  @ApiProperty({ enum: DocumentType })
  fileType: DocumentType;

  @ApiPropertyOptional()
  fileSize?: number;

  @ApiPropertyOptional()
  content?: string;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiProperty()
  chunkCount: number;

  @ApiPropertyOptional()
  metadata?: any;

  @ApiProperty()
  knowledgeBaseId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [EmbeddingSummary] })
  embeddings?: EmbeddingSummary[];
}
