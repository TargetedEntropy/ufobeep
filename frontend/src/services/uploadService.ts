import apiClient from './authService';
import { UploadedFile } from '../types';

export const uploadService = {
  async uploadFiles(files: File[]): Promise<UploadedFile[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.files;
  },

  async deleteFile(filename: string): Promise<void> {
    await apiClient.delete(`/upload/${filename}`);
  },

  async getFileInfo(filename: string): Promise<UploadedFile> {
    const response = await apiClient.get(`/upload/${filename}/info`);
    return response.data.file;
  },

  getFileUrl(filename: string): string {
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/uploads/${filename}`;
  },

  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'Only JPEG, PNG, WebP images and MP4, WebM, MOV videos are allowed' 
      };
    }

    return { isValid: true };
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};