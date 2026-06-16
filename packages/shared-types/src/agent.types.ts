export enum AgentType {
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  SALES = 'SALES',
  TECHNICAL_SUPPORT = 'TECHNICAL_SUPPORT',
  BILLING = 'BILLING',
  FAQ = 'FAQ',
  ONBOARDING = 'ONBOARDING',
}

export enum ModelProvider {
  OPENAI = 'OPENAI',
  CLAUDE = 'CLAUDE',
  GEMINI = 'GEMINI',
  CUSTOM = 'CUSTOM',
}

export interface AgentPersonality {
  tone: 'professional' | 'friendly' | 'casual' | 'empathetic' | 'humorous' | 'formal';
  language: string;
  temperature: number;
  style?: string;
  allowEmojis: boolean;
  allowMarkdown: boolean;
  greetingMessage?: string;
  fallbackMessage?: string;
}

export interface AgentConfig {
  modelProvider: ModelProvider;
  modelName: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  stopSequences?: string[];
  systemPrompt: string;
  knowledgeBaseIds?: string[];
  tools?: string[];
  maxConversationHistory: number;
  handoffThreshold: number;
  sentimentAnalysisEnabled: boolean;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  type: AgentType;
  avatarUrl?: string;
  companyId: string;
  config: AgentConfig;
  personality: AgentPersonality;
  isActive: boolean;
  isPublic: boolean;
  category?: string;
  tags?: string[];
  totalConversations: number;
  averageRating?: number;
  createdAt: string;
  updatedAt: string;
}
