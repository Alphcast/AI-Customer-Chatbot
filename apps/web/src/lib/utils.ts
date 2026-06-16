import { cn, formatDate, formatTime, formatRelativeTime, truncate } from '@shared/utils';
export { cn, formatDate, formatTime, formatRelativeTime, truncate };

export function getInitials(firstName?: string | null, lastName?: string | null) {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || '?';
}

export function generateId() {
  return crypto.randomUUID?.() || Math.random().toString(36).substring(2, 15);
}
