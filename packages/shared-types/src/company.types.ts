export enum CompanyPlan {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  BUSINESS = 'BUSINESS',
  ENTERPRISE = 'ENTERPRISE',
}

export interface CompanySettings {
  aiAgentsEnabled: boolean;
  multiLanguageSupport: boolean;
  customDomain?: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  businessHours: {
    enabled: boolean;
    timezone: string;
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
  integrations: {
    slack?: { webhookUrl: string; channel: string };
    notion?: { apiKey: string; databaseId: string };
    confluence?: { baseUrl: string; apiKey: string; spaceKey: string };
  };
  security: {
    mfaRequired: boolean;
    passwordPolicy: {
      minLength: number;
      requireNumbers: boolean;
      requireSymbols: boolean;
      requireUppercase: boolean;
    };
    sessionTimeout: number;
  };
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: number;
  logoUrl?: string;
  plan: CompanyPlan;
  settings: CompanySettings;
  isActive: boolean;
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}
