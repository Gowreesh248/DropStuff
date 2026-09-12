export interface FileMetadata {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface DropResponse {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  totalSize: number;
  fileCount: number;
  downloadCount: number;
  status: string;
  files: FileMetadata[];
  recipientUrl: string;
}

export type ExpirationOption = '1h' | '6h' | '24h' | '3d' | '7d';
