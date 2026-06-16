export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
    timeout: 30000,
  },
  auth: {
    tokenKey: 'access_token',
    refreshTokenKey: 'refresh_token',
    userKey: 'current_user',
  },
  app: {
    name: 'AI Chatbot Platform',
    version: '1.0.0',
    supportEmail: 'support@chatbot.com',
  },
  upload: {
    maxFileSize: 25 * 1024 * 1024,
    allowedTypes: [
      'image/*',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/csv',
    ],
  },
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
  },
  ai: {
    defaultModel: 'gpt-4',
    maxTokens: 4096,
    temperature: 0.7,
  },
  subscription: {
    trialDays: 14,
  },
} as const;

export type Config = typeof config;
