export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  VOICE = 'VOICE',
  SYSTEM = 'SYSTEM',
  REACTION = 'REACTION',
}

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
  EDITED = 'EDITED',
  DELETED = 'DELETED',
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'ai_agent' | 'system';
  senderName: string;
  senderAvatar?: string;
  type: MessageType;
  content: string;
  attachments?: Attachment[];
  reactions?: MessageReaction[];
  status: MessageStatus;
  parentId?: string;
  editedAt?: string;
  deliveredAt?: string;
  readAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
