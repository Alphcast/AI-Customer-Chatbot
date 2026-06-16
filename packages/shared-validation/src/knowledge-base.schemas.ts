import { z } from 'zod';

export const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export const queryKnowledgeBaseSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  topK: z.number().min(1).max(50).default(5),
  confidenceThreshold: z.number().min(0).max(1).default(0.5),
});

export type CreateKnowledgeBaseInput = z.infer<typeof createKnowledgeBaseSchema>;
export type QueryKnowledgeBaseInput = z.infer<typeof queryKnowledgeBaseSchema>;
