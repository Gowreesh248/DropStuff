import axios from 'axios';
import { DropData, ExpirationOption } from '../types/index.js';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  /**
   * Uploads files and creates a drop.
   */
  async createDrop(
    files: File[],
    expiration: ExpirationOption,
    onProgress?: (progressPercent: number) => void
  ): Promise<DropData> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('expiration', expiration);

    const response = await axios.post<DropData>(`${API_BASE}/drops`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  },

  /**
   * Fetches metadata for an active drop.
   */
  async getDrop(token: string): Promise<DropData> {
    const response = await axios.get<DropData>(`${API_BASE}/drops/${token}`);
    return response.data;
  },

  /**
   * Revokes a drop by token.
   */
  async revokeDrop(token: string): Promise<void> {
    await axios.delete(`${API_BASE}/drops/${token}`);
  },

  /**
   * Helper URL getter for individual file download.
   */
  getFileDownloadUrl(token: string, fileId: string): string {
    return `${API_BASE}/drops/${token}/files/${fileId}`;
  },

  /**
   * Helper URL getter for ZIP archive download.
   */
  getDownloadAllZipUrl(token: string): string {
    return `${API_BASE}/drops/${token}/download-all`;
  },
};
