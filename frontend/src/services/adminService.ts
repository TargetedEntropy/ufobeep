import apiClient from './authService';
import { User, Sighting, AdminStats, AdminAction, PaginatedResponse } from '../types';

export const adminService = {
  async getStats(): Promise<AdminStats> {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },

  async getUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'all' | 'registered' | 'anonymous';
  } = {}): Promise<PaginatedResponse<User>> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.search) params.append('q', options.search);
    if (options.type && options.type !== 'all') params.append('type', options.type);

    const response = await apiClient.get(`/users/search?${params.toString()}`);
    return {
      data: response.data.users,
      pagination: response.data.pagination,
    };
  },

  async getUser(userId: string): Promise<{
    user: User;
    recentSightings: Sighting[];
    recentMessages: any[];
  }> {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  async getSightings(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'all' | 'pending' | 'verified' | 'reported';
  } = {}): Promise<PaginatedResponse<Sighting>> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.search) params.append('search', options.search);

    // Apply filters based on status
    if (options.status === 'verified') {
      params.append('verified', 'true');
    } else if (options.status === 'reported') {
      params.append('reported', 'true');
    }

    const response = await apiClient.get(`/sightings?${params.toString()}`);
    return {
      data: response.data.sightings,
      pagination: response.data.pagination,
    };
  },

  async verifySighting(sightingId: string): Promise<void> {
    await apiClient.patch(`/admin/sightings/${sightingId}/verify`);
  },

  async hideSighting(sightingId: string, reason?: string): Promise<void> {
    await apiClient.patch(`/admin/sightings/${sightingId}/hide`, { reason });
  },

  async banUser(userId: string, reason?: string): Promise<void> {
    await apiClient.patch(`/admin/users/${userId}/ban`, { reason });
  },

  async unbanUser(userId: string): Promise<void> {
    await apiClient.patch(`/admin/users/${userId}/unban`);
  },

  async getAdminActions(options: {
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedResponse<AdminAction>> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());

    const response = await apiClient.get(`/admin/actions?${params.toString()}`);
    return {
      data: response.data.actions,
      pagination: response.data.pagination,
    };
  },

  async getReportedContent(): Promise<{
    sightings: Sighting[];
    messages: any[];
  }> {
    const response = await apiClient.get('/admin/reports');
    return response.data;
  },

  async bulkAction(action: string, ids: string[], reason?: string): Promise<void> {
    await apiClient.post('/admin/bulk', { action, ids, reason });
  },
};