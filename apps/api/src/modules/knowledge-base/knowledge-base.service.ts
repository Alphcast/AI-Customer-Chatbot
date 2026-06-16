import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../config/database';
import { AiService } from '../../providers/ai.service';
import { CreateKnowledgeBaseDto } from './dto/create-knowledge-base.dto';
import { QueryKnowledgeBaseDto } from './dto/query-knowledge-base.dto';
import { JwtPayload } from '../../common/interfaces';
import { KnowledgeBase } from '@prisma/client';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async create(dto: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    const company = await this.prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.prisma.knowledgeBase.create({
      data: {
        name: dto.name,
        description: dto.description,
        companyId: dto.companyId,
      },
    });
  }

  async findAll(companyId: string): Promise<KnowledgeBase[]> {
    return this.prisma.knowledgeBase.findMany({
      where: { companyId, isActive: true },
      include: {
        _count: { select: { documents: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<KnowledgeBase> {
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id, isActive: true },
      include: {
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!kb) {
      throw new NotFoundException('Knowledge base not found');
    }

    return kb;
  }

  async update(id: string, data: { name?: string; description?: string; isActive?: boolean }): Promise<KnowledgeBase> {
    const kb = await this.prisma.knowledgeBase.findFirst({ where: { id } });
    if (!kb) {
      throw new NotFoundException('Knowledge base not found');
    }

    return this.prisma.knowledgeBase.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: { documents: true },
    });
  }

  async remove(id: string): Promise<void> {
    const kb = await this.prisma.knowledgeBase.findFirst({ where: { id } });
    if (!kb) {
      throw new NotFoundException('Knowledge base not found');
    }

    const documents = await this.prisma.document.findMany({
      where: { knowledgeBaseId: id },
      include: { embeddings: true },
    });

    for (const doc of documents) {
      for (const embedding of doc.embeddings) {
        try {
          await this.deleteFromVectorStore(embedding.vectorId);
        } catch (error) {
          this.logger.error(`Failed to delete vector ${embedding.vectorId}: ${(error as Error).message}`);
        }
      }
    }

    await this.prisma.knowledgeBase.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async query(kbId: string, dto: QueryKnowledgeBaseDto): Promise<{ chunks: { content: string; documentId: string; documentTitle: string; score: number }[] }> {
    const kb = await this.prisma.knowledgeBase.findFirst({
      where: { id: kbId, isActive: true },
      include: { documents: { where: { status: 'EMBEDDED' } } },
    });

    if (!kb) {
      throw new NotFoundException('Knowledge base not found');
    }

    if (kb.documents.length === 0) {
      return { chunks: [] };
    }

    const queryEmbedding = await this.aiService.generateEmbedding(dto.query);

    const topK = dto.topK || 5;
    const threshold = dto.confidenceThreshold || 0.7;

    const results = await this.vectorSearch(queryEmbedding, kb.documents.map((d) => d.id), topK, threshold);

    const chunks = results.map((r) => ({
      content: r.content,
      documentId: r.documentId,
      documentTitle: r.documentTitle,
      score: r.score,
    }));

    return { chunks };
  }

  async addDocument(knowledgeBaseId: string, title: string, fileType: string, fileUrl?: string, content?: string): Promise<any> {
    const kb = await this.prisma.knowledgeBase.findFirst({ where: { id: knowledgeBaseId } });
    if (!kb) {
      throw new NotFoundException('Knowledge base not found');
    }

    const document = await this.prisma.document.create({
      data: {
        title,
        knowledgeBaseId,
        fileType: fileType as any,
        fileUrl,
        content: content || null,
        status: 'PROCESSING',
      },
    });

    return document;
  }

  async removeDocument(knowledgeBaseId: string, documentId: string): Promise<void> {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, knowledgeBaseId },
      include: { embeddings: true },
    });

    if (!document) {
      throw new NotFoundException('Document not found in this knowledge base');
    }

    for (const embedding of document.embeddings) {
      try {
        await this.deleteFromVectorStore(embedding.vectorId);
      } catch (error) {
        this.logger.error(`Failed to delete vector ${embedding.vectorId}: ${(error as Error).message}`);
      }
    }

    await this.prisma.document.delete({ where: { id: documentId } });
  }

  private async vectorSearch(
    queryEmbedding: number[],
    documentIds: string[],
    topK: number,
    threshold: number,
  ): Promise<{ content: string; documentId: string; documentTitle: string; score: number }[]> {
    const embeddings = await this.prisma.embedding.findMany({
      where: { documentId: { in: documentIds } },
      include: {
        document: { select: { id: true, title: true } },
      },
    });

    const scored = embeddings
      .map((e) => {
        const meta = e.metadata as { vector?: number[] } | null;
        const storedVector = meta?.vector;
        const score = storedVector
          ? this.cosineSimilarity(queryEmbedding, storedVector)
          : 0;
        return {
          content: e.content,
          documentId: e.documentId,
          documentTitle: e.document.title,
          score,
        };
      })
      .filter((r) => r.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map(({ content, documentId, documentTitle, score }) => ({
      content,
      documentId,
      documentTitle,
      score,
    }));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private async deleteFromVectorStore(vectorId: string): Promise<void> {
    this.logger.log(`Deleting vector ${vectorId} from vector store`);
  }
}
