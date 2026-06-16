export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_OWNER = 'COMPANY_OWNER',
  TEAM_MANAGER = 'TEAM_MANAGER',
  SUPPORT_AGENT = 'SUPPORT_AGENT',
  CUSTOMER = 'CUSTOMER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
  DELETED = 'DELETED',
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  soundEnabled: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  companyId: string;
  status: UserStatus;
  preferences: UserPreferences;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
