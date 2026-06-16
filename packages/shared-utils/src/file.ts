export const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.xml': 'application/xml',
  '.zip': 'application/zip',
  '.rar': 'application/vnd.rar',
  '.7z': 'application/x-7z-compressed',
};

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`;
}

export function getFileExtension(filename: string): string {
  const ext = filename.split('.').pop();
  return ext ? `.${ext.toLowerCase()}` : '';
}

export function isImageFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'].includes(ext);
}

export function isVideoFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['.mp4', '.webm', '.mov', '.avi'].includes(ext);
}

export function isDocumentFile(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt'].includes(ext);
}

export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  return MIME_TYPES[ext] ?? 'application/octet-stream';
}
