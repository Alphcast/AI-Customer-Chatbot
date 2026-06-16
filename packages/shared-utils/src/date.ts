export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', options ?? {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return formatDate(d);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function isExpired(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() < Date.now();
}

export function daysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = d.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function groupByDay(dates: Date[]): Map<string, Date[]> {
  const groups = new Map<string, Date[]>();
  for (const date of dates) {
    const key = date.toISOString().slice(0, 10);
    const existing = groups.get(key) ?? [];
    existing.push(date);
    groups.set(key, existing);
  }
  return groups;
}

export function groupByWeek(dates: Date[]): Map<string, Date[]> {
  const groups = new Map<string, Date[]>();
  for (const date of dates) {
    const weekStart = startOfWeek(date);
    const key = weekStart.toISOString().slice(0, 10);
    const existing = groups.get(key) ?? [];
    existing.push(date);
    groups.set(key, existing);
  }
  return groups;
}

export function groupByMonth(dates: Date[]): Map<string, Date[]> {
  const groups = new Map<string, Date[]>();
  for (const date of dates) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const existing = groups.get(key) ?? [];
    existing.push(date);
    groups.set(key, existing);
  }
  return groups;
}
