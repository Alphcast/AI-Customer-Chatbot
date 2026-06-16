import { z } from 'zod';
import { AgentType, ModelProvider } from '@shared/types';

export const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  type: z.nativeEnum(AgentType),
  modelProvider: z.nativeEnum(ModelProvider),
  modelName: z.string().min(1, 'Model name is required'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(1).max(32768).default(4096),
  instructions: z.string().optional(),
  personality: z.object({
    tone: z.enum(['professional', 'friendly', 'casual', 'empathetic', 'humorous', 'formal']).default('professional'),
    language: z.string().default('en'),
    temperature: z.number().min(0).max(2).optional(),
    allowEmojis: z.boolean().default(false),
    allowMarkdown: z.boolean().default(true),
    greetingMessage: z.string().optional(),
    fallbackMessage: z.string().optional(),
  }).optional(),
  isPublic: z.boolean().default(true),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  knowledgeBaseIds: z.array(z.string()).optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
