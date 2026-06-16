export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  COMPANY_OWNER: 'COMPANY_OWNER',
  TEAM_MANAGER: 'TEAM_MANAGER',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  CUSTOMER: 'CUSTOMER',
} as const;

export const CHANNELS = {
  WEBSITE: 'WEBSITE',
  WHATSAPP: 'WHATSAPP',
  TELEGRAM: 'TELEGRAM',
  MESSENGER: 'MESSENGER',
  INSTAGRAM: 'INSTAGRAM',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  MOBILE: 'MOBILE',
} as const;

export const TICKET_STATUSES = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  ORDER: ['OPEN', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
} as const;

export const PRIORITIES = {
  LOW: { label: 'Low', slaResponseHours: 24, slaResolutionHours: 72 },
  MEDIUM: { label: 'Medium', slaResponseHours: 8, slaResolutionHours: 24 },
  HIGH: { label: 'High', slaResponseHours: 2, slaResolutionHours: 8 },
  CRITICAL: { label: 'Critical', slaResponseHours: 0.5, slaResolutionHours: 2 },
} as const;

export const SUBSCRIPTION_PLANS = {
  STARTER: {
    name: 'Starter',
    monthlyPrice: 29,
    annualPrice: 290,
    maxAgents: 1,
    maxConversations: 500,
    maxTeamMembers: 2,
    features: ['Basic AI Agents', 'Email Support', 'Website Integration'],
  },
  PROFESSIONAL: {
    name: 'Professional',
    monthlyPrice: 99,
    annualPrice: 990,
    maxAgents: 5,
    maxConversations: 2000,
    maxTeamMembers: 10,
    features: ['Advanced AI Agents', 'Multi-Channel', 'Analytics Dashboard', 'Priority Support'],
  },
  BUSINESS: {
    name: 'Business',
    monthlyPrice: 299,
    annualPrice: 2990,
    maxAgents: 20,
    maxConversations: 10000,
    maxTeamMembers: 50,
    features: ['Custom AI Agents', 'Knowledge Base', 'API Access', 'SLA Support', 'Dedicated Manager'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    monthlyPrice: 999,
    annualPrice: 9990,
    maxAgents: -1,
    maxConversations: -1,
    maxTeamMembers: -1,
    features: ['Unlimited AI Agents', 'Unlimited Conversations', 'Custom Integrations', 'White Label', '24/7 Support', 'On-Premise Option'],
  },
} as const;

export const AI_MODELS = {
  OPENAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  CLAUDE: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku', 'claude-2'],
  GEMINI: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  CUSTOM: [],
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  PLAN_LIMIT_EXCEEDED: 'PLAN_LIMIT_EXCEEDED',
  PAYMENT_REQUIRED: 'PAYMENT_REQUIRED',
  CONFLICT: 'CONFLICT',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export const EVENTS = {
  MESSAGE_CREATED: 'message:created',
  MESSAGE_UPDATED: 'message:updated',
  MESSAGE_DELETED: 'message:deleted',
  MESSAGE_READ: 'message:read',
  CONVERSATION_UPDATED: 'conversation:updated',
  CONVERSATION_RESOLVED: 'conversation:resolved',
  CONVERSATION_ASSIGNED: 'conversation:assigned',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  READ_RECEIPT: 'read:receipt',
  HANDOFF_REQUESTED: 'handoff:requested',
  HANDOFF_ACCEPTED: 'handoff:accepted',
  AGENT_CONNECTED: 'agent:connected',
  AGENT_DISCONNECTED: 'agent:disconnected',
  CUSTOMER_CONNECTED: 'customer:connected',
  CUSTOMER_DISCONNECTED: 'customer:disconnected',
  ERROR: 'error',
} as const;

export type Role = keyof typeof ROLES;
export type Channel = keyof typeof CHANNELS;
export type TicketStatus = keyof typeof TICKET_STATUSES;
export type Priority = keyof typeof PRIORITIES;
export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;
export type AiModelProvider = keyof typeof AI_MODELS;
