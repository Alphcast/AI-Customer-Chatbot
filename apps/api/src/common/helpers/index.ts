import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

export function generateSlug(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
  const suffix = uuidv4().substring(0, 8);
  return `${slug}-${suffix}`;
}

export function generateApiKey(): string {
  return uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
}

export async function hashText(plainText: string, saltRounds = 12): Promise<string> {
  return bcrypt.hash(plainText, saltRounds);
}

export async function compareHash(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function truncateText(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trimEnd() + suffix;
}
