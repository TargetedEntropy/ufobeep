// User types
export interface User {
  id: string;
  username?: string;
  email?: string;
  isAnonymous: boolean;
  isAdmin: boolean;
  lastLatitude?: number;
  lastLongitude?: number;
  notificationRadius?: number;
  enableNotifications?: boolean;
  createdAt?: string;
  sessionCount?: number;
  _count?: {
    sightings?: number;
    chatMessages?: number;
  };
}

// Sighting types
export interface Sighting {
  id: string;
  title: string;
  description: string;
  latitude?: number;
  longitude?: number;
  location?: string;
  sightingDate: string;
  duration?: number;
  witnesses: number;
  weather?: string;
  visibility?: string;
  imageUrls?: string[];
  videoUrls?: string[];
  mediaUrls?: string[];
  isVerified: boolean;
  isHidden: boolean;
  viewCount: number;
  reportCount: number;
  createdAt?: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'username' | 'isAnonymous'>;
  _count?: {
    chatMessages: number;
  };
}

// Chat message types
export interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'username' | 'isAnonymous'>;
  sightingId: string;
  isHidden: boolean;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// Form types
export interface SightingFormData {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  location?: string;
  sightingDate: string;
  duration?: number;
  witnesses: number;
  weather?: string;
  visibility?: string;
  imageUrls?: string[];
  videoUrls?: string[];
}

// Socket types
export interface SocketNotification {
  type: string;
  id: string;
  title: string;
  message: string;
  data?: any;
  timestamp: string;
}

export interface SocketChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'username' | 'isAnonymous'>;
  sightingId: string;
}

// Map types
export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

// Upload types
export interface UploadedFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
}

// Admin types
export interface AdminAction {
  id: string;
  actionType: string;
  reason?: string;
  details?: string;
  createdAt: string;
  adminUser?: Pick<User, 'id' | 'username'>;
  targetUser?: Pick<User, 'id' | 'username'>;
  targetSighting?: Pick<Sighting, 'id' | 'title'>;
}

export interface AdminStats {
  totalUsers: number;
  totalSightings: number;
  totalMessages: number;
  recentSightings: number;
  verifiedSightings: number;
  reportedSightings: number;
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  field?: string;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Query types for react-query
export interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  verified?: boolean;
  recent?: boolean;
}