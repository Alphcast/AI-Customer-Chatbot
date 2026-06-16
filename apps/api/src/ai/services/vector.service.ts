import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VectorResult } from '../providers/ai-provider.interface';

@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);
  private index: any;
  private initialized = false;
  private vectorDbType: 'pinecone' | 'qdrant' | 'memory';

  constructor(private readonly config: ConfigService) {
    this.vectorDbType = (config.get<string>('app.vectorDb') as 'pinecone' | 'qdrant' | 'memory') || 'memory';
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    try {
      switch (this.vectorDbType) {
        case 'pinecone':
          await this.initPinecone();
          break;
        case 'qdrant':
          await this.initQdrant();
          break;
        case 'memory':
        default:
          this.initMemoryStore();
          break;
      }
      this.initialized = true;
      this.logger.log(`Vector DB initialized: ${this.vectorDbType}`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize vector DB: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      this.initMemoryStore();
      this.initialized = true;
    }
  }

  private async initPinecone(): Promise<void> {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const client = new Pinecone({
      apiKey: this.config.get<string>('app.pinecone.apiKey') || '',
    });
    this.index = client.index(this.config.get<string>('app.pinecone.index') || 'default');
  }

  private async initQdrant(): Promise<void> {
    const { QdrantClient } = await import('@qdrant/js-client-rest');
    this.index = new QdrantClient({
      url: this.config.get<string>('app.qdrant.url') || 'http://localhost:6333',
      apiKey: this.config.get<string>('app.qdrant.apiKey') || undefined,
    });
  }

  private memoryStore: Map<string, { values: number[]; metadata: Record<string, any> }> = new Map();

  private initMemoryStore(): void {
    this.memoryStore = new Map();
    this.index = {
      upsert: async (options: { vectors: { id: string; values: number[]; metadata?: Record<string, any> }[] }) => {
        for (const v of options.vectors) {
          this.memoryStore.set(v.id, { values: v.values, metadata: v.metadata || {} });
        }
      },
      query: async (options: { vector: number[]; topK: number; filter?: Record<string, any> }) => {
        const results: VectorResult[] = [];
        const queryVec = options.vector;

        for (const [id, data] of this.memoryStore.entries()) {
          if (options.filter) {
            const matches = Object.entries(options.filter).every(
              ([key, value]) => data.metadata[key] === value,
            );
            if (!matches) continue;
          }

          const score = this.cosineSimilarity(queryVec, data.values);
          results.push({ id, score, metadata: data.metadata });
        }

        results.sort((a, b) => b.score - a.score);
        return { matches: results.slice(0, options.topK) };
      },
      deleteMany: async (ids: string[]) => {
        for (const id of ids) {
          this.memoryStore.delete(id);
        }
      },
      deleteManyByFilter: async (filter: Record<string, any>) => {
        for (const [id, data] of this.memoryStore.entries()) {
          const matches = Object.entries(filter).every(
            ([key, value]) => data.metadata[key] === value,
          );
          if (matches) this.memoryStore.delete(id);
        }
      },
    };
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }

  async upsertVectors(
    vectors: { id: string; values: number[]; metadata: Record<string, any> }[],
  ): Promise<void> {
    await this.ensureInitialized();

    try {
      if (this.vectorDbType === 'pinecone') {
        await this.index.upsert({
          vectors: vectors.map((v) => ({
            id: v.id,
            values: v.values,
            metadata: v.metadata,
          })),
        });
      } else if (this.vectorDbType === 'qdrant') {
        const collectionName = this.config.get<string>('app.qdrant.collection') || 'default';
        await this.index.upsert(collectionName, {
          points: vectors.map((v) => ({
            id: v.id,
            vector: v.values,
            payload: v.metadata,
          })),
        });
      } else {
        await this.index.upsert({ vectors });
      }

      this.logger.log(`Upserted ${vectors.length} vectors`);
    } catch (error) {
      this.logger.error(
        `Failed to upsert vectors: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async queryVectors(
    vector: number[],
    topK: number,
    filter?: Record<string, any>,
  ): Promise<VectorResult[]> {
    await this.ensureInitialized();

    try {
      if (this.vectorDbType === 'pinecone') {
        const result = await this.index.query({
          vector,
          topK,
          filter,
          includeMetadata: true,
        });
        return (result.matches || []).map((m: any) => ({
          id: m.id,
          score: m.score || 0,
          metadata: m.metadata || {},
          content: m.metadata?.content as string | undefined,
        }));
      } else if (this.vectorDbType === 'qdrant') {
        const collectionName = this.config.get<string>('app.qdrant.collection') || 'default';
        const result = await this.index.search(collectionName, {
          vector,
          limit: topK,
          filter: filter ? this.buildQdrantFilter(filter) : undefined,
        });
        return (result as any[]).map((m: any) => ({
          id: m.id,
          score: m.score || 0,
          metadata: m.payload || {},
          content: m.payload?.content as string | undefined,
        }));
      } else {
        const result = await this.index.query({ vector, topK, filter });
        return (result.matches || []).map((m: any) => ({
          id: m.id,
          score: m.score || 0,
          metadata: m.metadata || {},
          content: m.metadata?.content as string | undefined,
        }));
      }
    } catch (error) {
      this.logger.error(
        `Failed to query vectors: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async deleteVectors(ids: string[]): Promise<void> {
    await this.ensureInitialized();

    try {
      if (this.vectorDbType === 'pinecone') {
        await this.index.deleteMany(ids);
      } else if (this.vectorDbType === 'qdrant') {
        const collectionName = this.config.get<string>('app.qdrant.collection') || 'default';
        await this.index.delete(collectionName, { points: ids });
      } else {
        await this.index.deleteMany(ids);
      }

      this.logger.log(`Deleted ${ids.length} vectors`);
    } catch (error) {
      this.logger.error(
        `Failed to delete vectors: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async deleteVectorsByFilter(filter: Record<string, any>): Promise<void> {
    await this.ensureInitialized();

    try {
      if (this.vectorDbType === 'pinecone') {
        await this.index.deleteManyByFilter(filter);
      } else if (this.vectorDbType === 'qdrant') {
        const collectionName = this.config.get<string>('app.qdrant.collection') || 'default';
        await this.index.delete(collectionName, {
          filter: this.buildQdrantFilter(filter),
        });
      } else {
        await this.index.deleteManyByFilter(filter);
      }

      this.logger.log(`Deleted vectors matching filter`);
    } catch (error) {
      this.logger.error(
        `Failed to delete vectors by filter: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async createIndexIfNotExists(name: string, dimension: number): Promise<void> {
    if (this.vectorDbType === 'memory') return;

    try {
      if (this.vectorDbType === 'pinecone') {
        const { Pinecone } = await import('@pinecone-database/pinecone');
        const client = new Pinecone({
          apiKey: this.config.get<string>('app.pinecone.apiKey') || '',
        });
        const existingIndexes = await client.listIndexes();
        const indexExists = existingIndexes.indexes?.some((i: any) => i.name === name);

        if (!indexExists) {
          await client.createIndex({
            name,
            dimension,
            metric: 'cosine',
            spec: { serverless: { cloud: 'aws', region: 'us-east-1' } },
          });
          this.logger.log(`Created Pinecone index: ${name}`);
        }
      } else if (this.vectorDbType === 'qdrant') {
        const collectionName = this.config.get<string>('app.qdrant.collection') || 'default';
        const collections = await this.index.getCollections();
        const exists = collections.collections?.some((c: any) => c.name === collectionName);

        if (!exists) {
          await this.index.createCollection(collectionName, {
            vectors: { size: dimension, distance: 'Cosine' },
          });
          this.logger.log(`Created Qdrant collection: ${collectionName}`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to create index: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private buildQdrantFilter(filter: Record<string, any>): Record<string, any> {
    const conditions: any[] = [];
    for (const [key, value] of Object.entries(filter)) {
      conditions.push({ key, match: { value } });
    }
    return { must: conditions };
  }
}
