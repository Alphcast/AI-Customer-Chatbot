import { z } from 'zod';
import { TicketPriority, TicketStatus } from '@shared/types';

export const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  priority: z.nativeEnum(TicketPriority).default(TicketPriority.MEDIUM),
  category: z.string().optional(),
  customerId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
});

export const updateTicketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  category: z.string().optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const internalNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
  isPrivate: z.boolean().default(true),
  attachments: z.array(z.string()).optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type InternalNoteInput = z.infer<typeof internalNoteSchema>;
