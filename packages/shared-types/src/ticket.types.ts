import { User } from './user.types';

export enum TicketStatus {
  OPEN = 'OPEN',
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum TicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface SLA {
  priority: TicketPriority;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  breached: boolean;
  responseDeadline: string;
  resolutionDeadline: string;
}

export interface InternalNote {
  id: string;
  ticketId: string;
  authorId: string;
  author: User;
  content: string;
  isPrivate: boolean;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: string;
  companyId: string;
  customerId: string;
  customer?: User;
  assignedToId?: string;
  assignedTo?: User;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category?: string;
  tags?: string[];
  sla?: SLA;
  conversationId?: string;
  source: string;
  internalNotes?: InternalNote[];
  attachments?: string[];
  resolvedById?: string;
  closedById?: string;
  resolvedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}
