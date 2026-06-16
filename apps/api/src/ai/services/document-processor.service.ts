import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import * as pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../../config/database';
import { AiService } from './ai.service';
import { VectorService } from './vector.service';
import { DocumentType, DocumentStatus } from '@prisma/client';

interface Chunk {
  content: string;
  index: number;
  metadata: Record<string, any>;
}

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly defaultChunkSize = 500;
  private readonly defaultOverlap = 50;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly vectorService: VectorService,
  ) {
    this.s3 = new S3Client({
      region: this.config.get<string>('app.aws.region') || 'us-east-1',
      credentials: {
        accessKeyId: this.config.get<string>('app.aws.accessKeyId') || '',
        secretAccessKey: this.config.get<string>('app.aws.secretAccessKey') || '',
      },
    });
    this.bucket = this.config.get<string>('app.aws.s3Bucket') || '';
  }

  async parsePdf(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      this.logger.error(
        `PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async parseDocx(buffer: Buffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      this.logger.error(
        `DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async parseCsv(buffer: Buffer): Promise<string> {
    try {
      const records = parse(buffer.toString('utf-8'), {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return records
        .map((row: Record<string, string>, i: number) => {
          return `Row ${i + 1}: ${Object.entries(row)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ')}`;
        })
        .join('\n');
    } catch (error) {
      this.logger.error(
        `CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async parseTxt(buffer: Buffer): Promise<string> {
    return buffer.toString('utf-8');
  }

  chunkText(
    text: string,
    chunkSize: number = this.defaultChunkSize,
    overlap: number = this.defaultOverlap,
  ): string[] {
    if (!text || text.length === 0) return [];

    const chunks: string[] = [];
    const separator = '\n';
    const sentences = text.split(separator);

    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5));
        currentChunk = overlapWords.join(' ') + separator + sentence;
      } else {
        currentChunk += (currentChunk ? separator : '') + sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    this.logger.log(`Split text into ${chunks.length} chunks (size=${chunkSize}, overlap=${overlap})`);
    return chunks;
  }

  async processDocument(documentId: string): Promise<void> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: { knowledgeBase: true },
    });

    if (!document) {
      this.logger.error(`Document not found: ${documentId}`);
      return;
    }

    if (!document.fileUrl) {
      this.logger.error(`Document has no fileUrl: ${documentId}`);
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.FAILED },
      });
      return;
    }

    try {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.PROCESSING },
      });

      const buffer = await this.downloadFromS3(document.fileUrl);

      let text = '';
      switch (document.fileType) {
        case DocumentType.PDF:
          text = await this.parsePdf(buffer);
          break;
        case DocumentType.DOCX:
          text = await this.parseDocx(buffer);
          break;
        case DocumentType.CSV:
          text = await this.parseCsv(buffer);
          break;
        case DocumentType.TXT:
        default:
          text = await this.parseTxt(buffer);
          break;
      }

      if (!text.trim()) {
        this.logger.warn(`No text extracted from document: ${documentId}`);
        await this.prisma.document.update({
          where: { id: documentId },
          data: { content: '', status: DocumentStatus.EMBEDDED, chunkCount: 0 },
        });
        return;
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: { content: text.slice(0, 50000) },
      });

      const chunks = this.chunkText(text);

      await this.prisma.embedding.deleteMany({
        where: { documentId },
      });

      const vectors: { id: string; values: number[]; metadata: Record<string, any> }[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await this.aiService.generateEmbedding(chunk);

        const vectorId = `${documentId}-chunk-${i}`;

        await this.prisma.embedding.create({
          data: {
            vectorId,
            content: chunk.slice(0, 8000),
            chunkIndex: i,
            metadata: {
              documentId,
              documentTitle: document.title,
              knowledgeBaseId: document.knowledgeBaseId,
              companyId: document.knowledgeBase.companyId,
              chunkIndex: i,
              totalChunks: chunks.length,
            },
            documentId,
          },
        });

        vectors.push({
          id: vectorId,
          values: embedding,
          metadata: {
            documentId,
            documentTitle: document.title,
            knowledgeBaseId: document.knowledgeBaseId,
            companyId: document.knowledgeBase.companyId,
            content: chunk.slice(0, 1000),
            chunkIndex: i,
            totalChunks: chunks.length,
            fileType: document.fileType,
          },
        });
      }

      await this.vectorService.upsertVectors(vectors);

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: DocumentStatus.EMBEDDED,
          chunkCount: chunks.length,
        },
      });

      this.logger.log(
        `Document processed successfully: ${document.title} (${chunks.length} chunks)`,
      );
    } catch (error) {
      this.logger.error(
        `Document processing failed: ${documentId} - ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: DocumentStatus.FAILED },
      });
    }
  }

  private async downloadFromS3(fileUrl: string): Promise<Buffer> {
    const key = this.parseKeyFromUrl(fileUrl);

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.s3.send(command);
    const chunks: Uint8Array[] = [];

    for await (const chunk of response.Body as any) {
      chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  private parseKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.slice(1);
    } catch {
      return url;
    }
  }
}
