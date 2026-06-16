export enum ConversationStatus {
  ACTIVE = 'ACTIVE',
  WAITING = 'WAITING',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  TRANSFERRED = 'TRANSFERRED',
  SPAM = 'SPAM',
}

export enum ChannelType {
  WEBSITE = 'WEBSITE',
  WHATSAPP = 'WHATSAPP',
  TELEGRAM = 'TELEGRAM',
  MESSENGER = 'MESSENGER',
  INSTAGRAM = 'INSTAGRAM',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  MOBILE = 'MOBILE',
}

export interface ConversationMetadata {
  browser?: string;
  os?: string;
  device?: string;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  referrer?: string;
  landingPage?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
  customAttributes?: Record<string, string>;
}

export interface Conversation {
  id: string;
  companyId: string;
  aiAgentId?: string;
  assignedToId?: string;
  customerId: string;
  channel: ChannelType;
  status: ConversationStatus;
  subject?: string;
  metadata: ConversationMetadata;
  tags?: string[];
  priority?: number;
  unreadCount: number;
  lastMessageAt?: string;
  messagesCount: number;
  satisfactionRating?: number;
  isHandoffRequested: boolean;
  closedById?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}
