export enum ChatEvent {
  MESSAGE_CREATED = 'message:created',
  MESSAGE_UPDATED = 'message:updated',
  MESSAGE_DELETED = 'message:deleted',
  MESSAGE_READ = 'message:read',
  CONVERSATION_UPDATED = 'conversation:updated',
  CONVERSATION_RESOLVED = 'conversation:resolved',
  CONVERSATION_ASSIGNED = 'conversation:assigned',
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
  READ_RECEIPT = 'read:receipt',
  HANDOFF_REQUESTED = 'handoff:requested',
  HANDOFF_ACCEPTED = 'handoff:accepted',
  AGENT_CONNECTED = 'agent:connected',
  AGENT_DISCONNECTED = 'agent:disconnected',
  CUSTOMER_CONNECTED = 'customer:connected',
  CUSTOMER_DISCONNECTED = 'customer:disconnected',
  ERROR = 'error',
}

export interface SocketEventMap {
  [ChatEvent.MESSAGE_CREATED]: { conversationId: string; message: import('./message.types').Message };
  [ChatEvent.MESSAGE_UPDATED]: { conversationId: string; message: import('./message.types').Message };
  [ChatEvent.MESSAGE_DELETED]: { conversationId: string; messageId: string };
  [ChatEvent.MESSAGE_READ]: { conversationId: string; messageId: string; userId: string };
  [ChatEvent.CONVERSATION_UPDATED]: { conversation: import('./conversation.types').Conversation };
  [ChatEvent.CONVERSATION_RESOLVED]: { conversationId: string };
  [ChatEvent.CONVERSATION_ASSIGNED]: { conversationId: string; agentId: string };
  [ChatEvent.TYPING_START]: TypingIndicator;
  [ChatEvent.TYPING_STOP]: TypingIndicator;
  [ChatEvent.READ_RECEIPT]: ReadReceipt;
  [ChatEvent.HANDOFF_REQUESTED]: HandoffRequest;
  [ChatEvent.HANDOFF_ACCEPTED]: HandoffRequest;
  [ChatEvent.AGENT_CONNECTED]: { agentId: string; conversationId: string };
  [ChatEvent.AGENT_DISCONNECTED]: { agentId: string; conversationId: string };
  [ChatEvent.CUSTOMER_CONNECTED]: { customerId: string; conversationId: string };
  [ChatEvent.CUSTOMER_DISCONNECTED]: { customerId: string; conversationId: string };
  [ChatEvent.ERROR]: { message: string; code?: string };
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface ReadReceipt {
  conversationId: string;
  messageId: string;
  userId: string;
  readAt: string;
}

export interface HandoffRequest {
  conversationId: string;
  requestedById: string;
  requestedByName: string;
  reason?: string;
  agentType?: string;
  status: 'pending' | 'accepted' | 'rejected';
  assignedToId?: string;
}
