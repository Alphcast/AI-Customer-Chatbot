export enum WebhookEvent {
  MESSAGE_CREATED = 'message.created',
  MESSAGE_DELETED = 'message.deleted',
  CONVERSATION_CREATED = 'conversation.created',
  CONVERSATION_RESOLVED = 'conversation.resolved',
  CONVERSATION_CLOSED = 'conversation.closed',
  TICKET_CREATED = 'ticket.created',
  TICKET_UPDATED = 'ticket.updated',
  TICKET_RESOLVED = 'ticket.resolved',
  CUSTOMER_CREATED = 'customer.created',
  AGENT_CREATED = 'agent.created',
  AGENT_DELETED = 'agent.deleted',
  SUBSCRIPTION_UPDATED = 'subscription.updated',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
}

export interface WebhookPayload {
  event: WebhookEvent;
  companyId: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookConfig {
  id: string;
  companyId: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
  description?: string;
  retryCount: number;
  timeout: number;
  headers?: Record<string, string>;
  lastTriggeredAt?: string;
  lastFailureAt?: string;
  createdAt: string;
  updatedAt: string;
}
