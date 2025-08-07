import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { SocketNotification, SocketChatMessage } from '../types';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  notifications: SocketNotification[];
  joinSighting: (sightingId: string) => void;
  leaveSighting: (sightingId: string) => void;
  sendChatMessage: (sightingId: string, message: string, anonymousName?: string) => void;
  updateLocation: (latitude: number, longitude: number) => void;
  startTyping: (sightingId: string) => void;
  stopTyping: (sightingId: string) => void;
  clearNotifications: () => void;
}

interface SocketContextProviderProps {
  children: React.ReactNode;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<SocketContextProviderProps> = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<SocketNotification[]>([]);
  
  // Store active sighting rooms
  const activeSightings = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!token) {
      // Disconnect if no token
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const socketInstance = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Notification handlers
    socketInstance.on('notification', (notification: SocketNotification) => {
      console.log('Received notification:', notification);
      
      setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
      
      // Show toast for certain notification types
      if (notification.type === 'new_nearby_sighting') {
        toast.success(notification.message, {
          duration: 6000,
          icon: '🛸',
        });
      }
    });

    // Chat message handlers
    socketInstance.on('new_chat_message', (message: SocketChatMessage) => {
      console.log('Received chat message:', message);
      // This will be handled by individual chat components
    });

    socketInstance.on('chat_history', (data: { sightingId: string; messages: SocketChatMessage[] }) => {
      console.log('Received chat history for sighting:', data.sightingId);
      // This will be handled by individual chat components
    });

    // User presence handlers
    socketInstance.on('user_joined', (data: { userId: string; username: string; isAnonymous: boolean }) => {
      console.log('User joined sighting:', data);
    });

    socketInstance.on('user_left', (data: { userId: string; username: string }) => {
      console.log('User left sighting:', data);
    });

    // Typing indicators
    socketInstance.on('user_typing', (data: { userId: string; username: string; isAnonymous: boolean }) => {
      console.log('User typing:', data);
    });

    socketInstance.on('user_stopped_typing', (data: { userId: string }) => {
      console.log('User stopped typing:', data);
    });

    // Location update confirmation
    socketInstance.on('location_updated', (data: { message: string; latitude: number; longitude: number }) => {
      console.log('Location updated:', data);
    });

    // Nearby sightings notification
    socketInstance.on('nearby_sightings', (data: { message: string; sightings: any[] }) => {
      console.log('Nearby sightings:', data);
      if (data.sightings.length > 0) {
        toast.success(data.message, {
          duration: 5000,
          icon: '📍',
        });
      }
    });

    // Error handler
    socketInstance.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      toast.error(error.message);
    });

    setSocket(socketInstance);

    // Cleanup on unmount or token change
    return () => {
      socketInstance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token]);

  const joinSighting = (sightingId: string) => {
    if (socket && isConnected) {
      socket.emit('join_sighting', { sightingId });
      activeSightings.current.add(sightingId);
    }
  };

  const leaveSighting = (sightingId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_sighting', { sightingId });
      activeSightings.current.delete(sightingId);
    }
  };

  const sendChatMessage = (sightingId: string, message: string, anonymousName?: string) => {
    if (socket && isConnected) {
      socket.emit('chat_message', { sightingId, message, anonymousName });
    }
  };

  const updateLocation = (latitude: number, longitude: number) => {
    if (socket && isConnected) {
      socket.emit('update_location', { latitude, longitude });
    }
  };

  const startTyping = (sightingId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { sightingId });
    }
  };

  const stopTyping = (sightingId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { sightingId });
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const contextValue: SocketContextType = {
    socket,
    isConnected,
    notifications,
    joinSighting,
    leaveSighting,
    sendChatMessage,
    updateLocation,
    startTyping,
    stopTyping,
    clearNotifications,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};