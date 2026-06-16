import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Queue, Job } from 'bull';
import { PrismaService } from '../../config/database';
import { AiService } from '../../providers/ai.service';
import { S3Service } from '../../providers/s3.service';
import { JwtPayload, PaginatedResult } from '../../common/interfaces';
import { Document, DocumentStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
@Processor('document-processing')
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectQueue('document-processing') private readonly documentQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly s3Service: S3Service,
  ) {}

  async upload(
    file: Express.Multer.File,
    knowledgeBaseId: string,
    title: string,
    fileType?: string,
  ): Promise<Document> {
    const kb = await this.prisma.knowledgeBase.findFirst({ where: { id: knowledgeBaseId } });
    if (!kb) {
      throw new NotFoundException('Knowledge base not found');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const key = `documents/${knowledgeBaseId}/${uuidv4()}${ext}`;
    const fileUrl = await this.s3Service.uploadFile(file.buffer, key, file.mimetype);

    const detectedType = fileType || this.detectFileType(ext);

    const document = await this.prisma.document.create({
      data: {
        title,
        knowledgeBaseId,
        fileUrl,
        fileType: detectedType as any,
        fileSize: file.size,
        status: 'PROCESSING',
      },
    });

    await this.documentQueue.add(
      'process',
      { documentId: document.id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    this.logger.log(`Document ${document.id} queued for processing`);
    return document;
  }

  async findAll(
    query: {
      knowledgeBaseId?: string;
      status?: DocumentStatus;
      fileType?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResult<Document>> {
    const { page = 1, limit = 10, knowledgeBaseId, status, fileType } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (knowledgeBaseId) where.knowledgeBaseId = knowledgeBaseId;
    if (status) where.status = status;
    if (fileType) where.fileType = fileType;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string): Promise<Document> {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: {
        embeddings: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async remove(id: string): Promise<void> {
    const document = await this.findById(id);

    if (document.fileUrl) {
      try {
        const key = this.s3Service.parseKeyFromUrl(document.fileUrl);
        await this.s3Service.deleteFile(key);
      } catch (error) {
        this.logger.error(`Failed to delete file from S3: ${(error as Error).message}`);
      }
    }

    for (const embedding of document.embeddings) {
      try {
        await this.deleteFromVectorStore(embedding.vectorId);
      } catch (error) {
        this.logger.error(`Failed to delete vector ${embedding.vectorId}: ${(error as Error).message}`);
      }
    }

    await this.prisma.document.delete({ where: { id } });
  }

  async reprocess(id: string): Promise<Document> {
    const document = await this.prisma.document.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.embeddings) {
      for (const embedding of document.embeddings) {
        try {
          await this.deleteFromVectorStore(embedding.vectorId);
        } catch (error) {
          this.logger.error(`Failed to delete vector ${embedding.vectorId}: ${(error as Error).message}`);
        }
      }
    }

    await this.prisma.embedding.deleteMany({ where: { documentId: id } });

    const updated = await this.prisma.document.update({
      where: { id },
      data: {
        status: 'PROCESSING',
        chunkCount: 0,
        content: null,
      },
    });

    await this.documentQueue.add(
      'process',
      { documentId: id },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );

    return updated;
  }

  @Process('process')
  async processDocument(job: Job<{ documentId: string }>): Promise<void> {
    const { documentId } = job.data;
    this.logger.log(`Processing document ${documentId} (job ${job.id})`);

    try {
      const document = await this.prisma.document.findUnique({ where: { id: documentId } });
      if (!document) {
        throw new Error(`Document ${documentId} not found`);
      }

      let textContent = document.content || '';

      if (!textContent && document.fileUrl) {
        textContent = await this.downloadAndParse(document);
      }

      if (!textContent || textContent.trim().length === 0) {
        throw new Error('No content extracted from document');
      }

      const chunks = this.chunkText(textContent);
      this.logger.log(`Document ${documentId}: split into ${chunks.length} chunks`);

      const embeddings: { content: string; vector: number[] }[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const vector = await this.aiService.generateEmbedding(chunks[i]);
        embeddings.push({ content: chunks[i], vector });
      }

      const embeddingRecords = [];
      for (let i = 0; i < embeddings.length; i++) {
        const vectorId = `doc-${documentId}-chunk-${i}`;
        await this.storeInVectorStore(vectorId, embeddings[i].vector);

        embeddingRecords.push({
          documentId,
          vectorId,
          content: embeddings[i].content,
          chunkIndex: i,
          metadata: { vector: embeddings[i].vector },
        });
      }

      await this.prisma.$transaction(
        embeddingRecords.map((record) =>
          this.prisma.embedding.create({ data: record }),
        ),
      );

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'EMBEDDED',
          chunkCount: chunks.length,
          content: textContent.substring(0, 10000),
        },
      });

      this.logger.log(`Document ${documentId} processed successfully with ${chunks.length} chunks`);
    } catch (error) {
      this.logger.error(`Document ${documentId} processing failed: ${(error as Error).message}`);

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  }

  private async downloadAndParse(document: Document): Promise<string> {
    if (!document.fileUrl) return '';

    try {
      const response = await fetch(document.fileUrl);
      const buffer = Buffer.from(await response.arrayBuffer());

      switch (document.fileType) {
        case 'PDF': {
          const pdfParse = await import('pdf-parse');
          const pdfData = await pdfParse.default(buffer);
          return pdfData.text;
        }

        case 'DOCX': {
          const mammoth = await import('mammoth');
          const result = await mammoth.extractRawText({ buffer });
          return result.value;
        }

        case 'CSV': {
          const csvParse = await import('csv-parse/sync');
          const records = csvParse.parse(buffer.toString(), {
            columns: true,
            skip_empty_lines: true,
          });
          return JSON.stringify(records, null, 2);
        }

        case 'TXT':
        default:
          return buffer.toString('utf-8');
      }
    } catch (error) {
      this.logger.error(`Failed to download/parse document ${document.id}: ${(error as Error).message}`);
      throw error;
    }
  }

  private chunkText(text: string, chunkSize = 500, overlap = 50): string[] {
    if (!text || text.length === 0) return [];

    const chunks: string[] = [];
    let startIndex = 0;

    while (startIndex < text.length) {
      let endIndex = startIndex + chunkSize;

      if (endIndex >= text.length) {
        chunks.push(text.substring(startIndex).trim());
        break;
      }

      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastNewline = text.lastIndexOf('\n', endIndex);
      const lastSpace = text.lastIndexOf(' ', endIndex);

      let splitPoint = endIndex;
      if (lastPeriod > startIndex + chunkSize / 2) {
        splitPoint = lastPeriod + 1;
      } else if (lastNewline > startIndex + chunkSize / 2) {
        splitPoint = lastNewline;
      } else if (lastSpace > startIndex + chunkSize / 2) {
        splitPoint = lastSpace;
      }

      const chunk = text.substring(startIndex, splitPoint).trim();
      if (chunk) chunks.push(chunk);

      startIndex = Math.max(splitPoint - overlap, splitPoint - 50);
      if (startIndex >= text.length) break;
    }

    return chunks;
  }

  private detectFileType(extension: string): string {
    const typeMap: Record<string, string> = {
      '.pdf': 'PDF',
      '.docx': 'DOCX',
      '.doc': 'DOCX',
      '.txt': 'TXT',
      '.csv': 'CSV',
      '.md': 'TXT',
      '.json': 'TXT',
      '.xml': 'TXT',
      '.html': 'TXT',
      '.htm': 'TXT',
    };
    return typeMap[extension] || 'TXT';
  }

  private async storeInVectorStore(vectorId: string, _vector: number[]): Promise<void> {
    this.logger.log(`Storing vector ${vectorId} in vector store`);
  }

  private async deleteFromVectorStore(vectorId: string): Promise<void> {
    this.logger.log(`Deleting vector ${vectorId} from vector store`);
  }
}
