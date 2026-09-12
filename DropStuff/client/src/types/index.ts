export interface FileItem {
  id: string; // client-side temp id for selected file before upload
  file: File;
  name: string;
  size: number;
  type: string;
}

export interface FileMetadata {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

export interface DropData {
  id: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  totalSize: number;
  fileCount: number;
  downloadCount: number;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  files: FileMetadata[];
  recipientUrl: string;
}

export type ExpirationOption = '1h' | '6h' | '24h' | '3d' | '7d';
