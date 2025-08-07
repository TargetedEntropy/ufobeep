import apiClient from './authService';
import { Sighting, PaginatedResponse, QueryOptions } from '../types';

export const sightingService = {
  async getSightings(options: QueryOptions = {}): Promise<PaginatedResponse<Sighting>> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.latitude) params.append('latitude', options.latitude.toString());
    if (options.longitude) params.append('longitude', options.longitude.toString());
    if (options.radius) params.append('radius', options.radius.toString());
    if (options.verified !== undefined) params.append('verified', options.verified.toString());
    if (options.recent !== undefined) params.append('recent', options.recent.toString());

    const response = await apiClient.get(`/sightings?${params.toString()}`);
    return {
      data: response.data.sightings,
      pagination: response.data.pagination,
    };
  },

  async getSighting(id: string): Promise<Sighting> {
    const response = await apiClient.get(`/sightings/${id}`);
    return response.data.sighting;
  },

  async createSighting(data: FormData): Promise<Sighting> {
    const response = await apiClient.post('/sightings', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.sighting;
  },

  async updateSighting(id: string, data: Partial<Sighting>): Promise<Sighting> {
    const response = await apiClient.put(`/sightings/${id}`, data);
    return response.data.sighting;
  },

  async deleteSighting(id: string): Promise<void> {
    await apiClient.delete(`/sightings/${id}`);
  },

  async reportSighting(id: string, reason: string): Promise<void> {
    await apiClient.post(`/sightings/${id}/report`, { reason });
  },
};