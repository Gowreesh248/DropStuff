/**
 * Formats bytes into human-readable string (e.g. 53.1 MB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Returns formatted countdown time string (e.g., "23h 41m", "45m", "12s", "Expired")
 */
export function formatCountdown(expiresAtIso: string): { formatted: string; isExpired: boolean } {
  const expires = new Date(expiresAtIso).getTime();
  const now = new Date().getTime();
  const diffMs = expires - now;

  if (diffMs <= 0) {
    return { formatted: 'Expired', isExpired: true };
  }

  const diffSecs = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSecs / 86400);
  const hours = Math.floor((diffSecs % 86400) / 3600);
  const minutes = Math.floor((diffSecs % 3600) / 60);

  if (days > 0) {
    return { formatted: `${days}d ${hours}h remaining`, isExpired: false };
  }
  if (hours > 0) {
    return { formatted: `${hours}h ${minutes}m remaining`, isExpired: false };
  }
  if (minutes > 0) {
    return { formatted: `${minutes}m remaining`, isExpired: false };
  }
  return { formatted: `${diffSecs}s remaining`, isExpired: false };
}

/**
 * Determines file category from filename or mime type
 */
export function getFileCategory(filename: string, mimeType?: string): 'pdf' | 'image' | 'archive' | 'code' | 'video' | 'audio' | 'text' | 'generic' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (['pdf'].includes(ext) || mimeType?.includes('pdf')) return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'avif'].includes(ext) || mimeType?.startsWith('image/')) return 'image';
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext) || mimeType?.includes('zip') || mimeType?.includes('compressed')) return 'archive';
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'go', 'rs'].includes(ext)) return 'code';
  if (['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(ext) || mimeType?.startsWith('video/')) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext) || mimeType?.startsWith('audio/')) return 'audio';
  if (['txt', 'md', 'doc', 'docx', 'csv'].includes(ext) || mimeType?.startsWith('text/')) return 'text';

  return 'generic';
}
