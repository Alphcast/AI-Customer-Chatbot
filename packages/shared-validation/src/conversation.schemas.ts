import { z } from 'zod';
import { ChannelType } from '@shared/types';

export const createConversationSchema = z.object({
  companyId: z.string().uuid(),
  customer: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    metadata: z.record(z.unknown()).optional(),
  }),
  aiAgentId: z.string().uuid().optional(),
  channel: z.nativeEnum(ChannelType),
  subject: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, 'Message content is required'),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'FILE', 'VOICE']).default('TEXT'),
  attachments: z.array(z.object({
    url: z.string(),
    fileName: z.string(),
    fileSize: z.number(),
    mimeType: z.string(),
  })).optional(),
  parentId: z.string().uuid().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
