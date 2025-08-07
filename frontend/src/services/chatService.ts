import apiClient from './authService';
import { ChatMessage, PaginatedResponse } from '../types';

export const chatService = {
  async getSightingMessages(sightingId: string, page = 1, limit = 50): Promise<PaginatedResponse<ChatMessage>> {
    const response = await apiClient.get(`/chat/sighting/${sightingId}?page=${page}&limit=${limit}`);
    return {
      data: response.data.messages,
      pagination: response.data.pagination,
    };
  },

  async createMessage(sightingId: string, message: string, anonymousName?: string): Promise<ChatMessage> {
    const response = await apiClient.post(`/chat/sighting/${sightingId}`, {
      message,
      anonymousName,
    });
    return response.data.chatMessage;
  },

  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/chat/message/${messageId}`);
  },

  async getUserMessages(page = 1, limit = 20): Promise<PaginatedResponse<ChatMessage>> {
    const response = await apiClient.get(`/chat/user/messages?page=${page}&limit=${limit}`);
    return {
      data: response.data.messages,
      pagination: response.data.pagination,
    };
  },

  async hideMessage(messageId: string, reason?: string): Promise<void> {
    await apiClient.patch(`/chat/message/${messageId}/hide`, { reason });
  },
};