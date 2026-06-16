export enum DocumentType {
  PDF = 'PDF',
  DOCX = 'DOCX',
  TXT = 'TXT',
  CSV = 'CSV',
  XLSX = 'XLSX',
  URL = 'URL',
  NOTION = 'NOTION',
  CONFLUENCE = 'CONFLUENCE',
  PRODUCT_DOC = 'PRODUCT_DOC',
}

export enum DocumentStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
  DELETED = 'DELETED',
}

export interface Chunk {
  id: string;
  documentId: string;
  content: string;
  index: number;
  metadata?: Record<string, unknown>;
  tokenCount: number;
  createdAt: string;
}

export interface Embedding {
  id: string;
  chunkId: string;
  documentId: string;
  vector: number[];
  model: string;
  dimensions: number;
  createdAt: string;
}

export interface Document {
  id: string;
  knowledgeBaseId: string;
  title: string;
  description?: string;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  sourceUrl?: string;
  author?: string;
  metadata?: Record<string, unknown>;
  chunkCount: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeBase {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  documentCount: number;
  chunkCount: number;
  embeddingsModel?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
