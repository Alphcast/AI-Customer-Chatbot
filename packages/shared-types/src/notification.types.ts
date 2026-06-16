export enum NotificationType {
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  IN_APP = 'IN_APP',
}

export interface NotificationChannel {
  type: NotificationType;
  enabled: boolean;
  priority: 'high' | 'normal' | 'low';
}

export interface Notification {
  id: string;
  userId: string;
  companyId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  imageUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}
