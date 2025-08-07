import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server } from 'http';
import prisma, { geoUtils } from '../utils/database';
import { socketAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import { chatMessageLimiter } from '../middleware/rateLimiting';

interface SocketUser {
  id: string;
  username?: string;
  isAnonymous: boolean;
  isAdmin: boolean;
}

interface CustomSocket extends Socket {
  user: SocketUser;
  isAuthenticated: boolean;
}

interface JoinRoomData {
  sightingId: string;
}

interface ChatMessageData {
  sightingId: string;
  message: string;
  anonymousName?: string;
}

interface LocationUpdateData {
  latitude: number;
  longitude: number;
}

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, CustomSocket> = new Map();

  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(socketAuth);
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: any) => {
      const customSocket = socket as CustomSocket;
      
      logger.info(`Socket connected: ${socket.id}, User: ${customSocket.user.id}`);
      
      // Store connected user
      this.connectedUsers.set(socket.id, customSocket);

      // Join user to their personal room for notifications
      if (!customSocket.user.isAnonymous) {
        socket.join(`user:${customSocket.user.id}`);
      }

      // Handle joining sighting chat rooms
      socket.on('join_sighting', (data: JoinRoomData) => {
        this.handleJoinSighting(customSocket, data);
      });

      // Handle leaving sighting chat rooms
      socket.on('leave_sighting', (data: JoinRoomData) => {
        this.handleLeaveSighting(customSocket, data);
      });

      // Handle chat messages
      socket.on('chat_message', (data: ChatMessageData) => {
        this.handleChatMessage(customSocket, data);
      });

      // Handle location updates for notifications
      socket.on('update_location', (data: LocationUpdateData) => {
        this.handleLocationUpdate(customSocket, data);
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { sightingId: string }) => {
        this.handleTypingStart(customSocket, data);
      });

      socket.on('typing_stop', (data: { sightingId: string }) => {
        this.handleTypingStop(customSocket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(customSocket);
      });
    });
  }

  private async handleJoinSighting(socket: CustomSocket, data: JoinRoomData) {
    try {
      const { sightingId } = data;

      // Validate sighting exists and is not hidden
      const sighting = await prisma.sighting.findUnique({
        where: { id: sightingId },
        select: { id: true, title: true, isHidden: true },
      });

      if (!sighting || sighting.isHidden) {
        socket.emit('error', { message: 'Sighting not found' });
        return;
      }

      // Join the sighting room
      socket.join(`sighting:${sightingId}`);
      
      // Notify others in the room
      socket.to(`sighting:${sightingId}`).emit('user_joined', {
        userId: socket.user.id,
        username: socket.user.username || (socket.user.isAnonymous ? 'Anonymous' : 'User'),
        isAnonymous: socket.user.isAnonymous,
      });

      // Send recent chat messages
      const recentMessages = await prisma.chatMessage.findMany({
        where: { 
          sightingId,
          isHidden: false,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              isAnonymous: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      socket.emit('chat_history', {
        sightingId,
        messages: recentMessages.reverse(),
      });

      logger.info(`User ${socket.user.id} joined sighting ${sightingId}`);
    } catch (error) {
      logger.error('Error joining sighting:', error);
      socket.emit('error', { message: 'Failed to join sighting chat' });
    }
  }

  private handleLeaveSighting(socket: CustomSocket, data: JoinRoomData) {
    const { sightingId } = data;
    
    socket.leave(`sighting:${sightingId}`);
    
    // Notify others in the room
    socket.to(`sighting:${sightingId}`).emit('user_left', {
      userId: socket.user.id,
      username: socket.user.username || (socket.user.isAnonymous ? 'Anonymous' : 'User'),
    });

    logger.info(`User ${socket.user.id} left sighting ${sightingId}`);
  }

  private async handleChatMessage(socket: CustomSocket, data: ChatMessageData) {
    try {
      const { sightingId, message, anonymousName } = data;

      // Basic validation
      if (!message || message.trim().length === 0) {
        socket.emit('error', { message: 'Message cannot be empty' });
        return;
      }

      if (message.length > 1000) {
        socket.emit('error', { message: 'Message too long (max 1000 characters)' });
        return;
      }

      // Validate sighting exists
      const sighting = await prisma.sighting.findUnique({
        where: { id: sightingId },
        select: { id: true, isHidden: true },
      });

      if (!sighting || sighting.isHidden) {
        socket.emit('error', { message: 'Sighting not found' });
        return;
      }

      // Create chat message
      const chatMessage = await prisma.chatMessage.create({
        data: {
          message: message.trim(),
          sightingId,
          userId: socket.user.isAnonymous ? null : socket.user.id,
          anonymousName: socket.user.isAnonymous ? (anonymousName || 'Anonymous') : null,
          ipAddress: socket.handshake.address,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              isAnonymous: true,
            },
          },
        },
      });

      // Broadcast message to all users in the sighting room
      this.io.to(`sighting:${sightingId}`).emit('new_chat_message', {
        id: chatMessage.id,
        message: chatMessage.message,
        createdAt: chatMessage.createdAt,
        user: chatMessage.user || {
          id: null,
          username: chatMessage.anonymousName,
          isAnonymous: true,
        },
        sightingId,
      });

      logger.info(`Chat message created in sighting ${sightingId} by user ${socket.user.id}`);
    } catch (error) {
      logger.error('Error handling chat message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  private async handleLocationUpdate(socket: CustomSocket, data: LocationUpdateData) {
    try {
      if (socket.user.isAnonymous) {
        return; // Anonymous users can't set permanent location
      }

      const { latitude, longitude } = data;

      // Validate coordinates
      if (
        typeof latitude !== 'number' || 
        typeof longitude !== 'number' ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
      ) {
        socket.emit('error', { message: 'Invalid coordinates' });
        return;
      }

      // Update user location in database
      await prisma.user.update({
        where: { id: socket.user.id },
        data: {
          lastLatitude: latitude,
          lastLongitude: longitude,
          lastLocationUpdate: new Date(),
        },
      });

      // Check for nearby recent sightings and send notifications
      await this.checkNearbyNotifications(socket, latitude, longitude);

      socket.emit('location_updated', { 
        message: 'Location updated successfully',
        latitude,
        longitude,
      });
    } catch (error) {
      logger.error('Error updating location:', error);
      socket.emit('error', { message: 'Failed to update location' });
    }
  }

  private handleTypingStart(socket: CustomSocket, data: { sightingId: string }) {
    const { sightingId } = data;
    
    socket.to(`sighting:${sightingId}`).emit('user_typing', {
      userId: socket.user.id,
      username: socket.user.username || (socket.user.isAnonymous ? 'Anonymous' : 'User'),
      isAnonymous: socket.user.isAnonymous,
    });
  }

  private handleTypingStop(socket: CustomSocket, data: { sightingId: string }) {
    const { sightingId } = data;
    
    socket.to(`sighting:${sightingId}`).emit('user_stopped_typing', {
      userId: socket.user.id,
    });
  }

  private handleDisconnect(socket: CustomSocket) {
    this.connectedUsers.delete(socket.id);
    logger.info(`Socket disconnected: ${socket.id}`);
  }

  // Public methods for other parts of the application to use

  // Send notification to a specific user
  public sendUserNotification(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  // Broadcast new sighting to nearby users
  public async broadcastNewSighting(sighting: any) {
    try {
      // Find users within notification radius of the sighting
      const nearbyUsers = await prisma.user.findMany({
        where: {
          isAnonymous: false,
          enableNotifications: true,
          lastLatitude: { not: null },
          lastLongitude: { not: null },
        },
        select: {
          id: true,
          lastLatitude: true,
          lastLongitude: true,
          notificationRadius: true,
        },
      });

      for (const user of nearbyUsers) {
        if (user.lastLatitude && user.lastLongitude) {
          const distance = geoUtils.calculateDistance(
            sighting.latitude,
            sighting.longitude,
            user.lastLatitude,
            user.lastLongitude
          );

          if (distance <= user.notificationRadius) {
            this.sendUserNotification(user.id, {
              type: 'new_sighting',
              sighting: {
                id: sighting.id,
                title: sighting.title,
                distance: distance.toFixed(2),
                createdAt: sighting.createdAt,
              },
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error broadcasting new sighting:', error);
    }
  }

  private async checkNearbyNotifications(socket: CustomSocket, latitude: number, longitude: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: socket.user.id },
        select: {
          notificationRadius: true,
          enableNotifications: true,
        },
      });

      if (!user || !user.enableNotifications) {
        return;
      }

      // Find recent sightings within notification radius
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const nearbySightings = await geoUtils.findNearbySync(
        latitude,
        longitude,
        user.notificationRadius,
        5
      );

      const recentSightings = nearbySightings.filter(
        sighting => sighting.createdAt >= oneDayAgo
      );

      if (recentSightings.length > 0) {
        socket.emit('nearby_sightings', {
          message: `Found ${recentSightings.length} recent sightings near your location`,
          sightings: recentSightings.map(sighting => ({
            id: sighting.id,
            title: sighting.title,
            distance: geoUtils.calculateDistance(
              latitude,
              longitude,
              sighting.latitude,
              sighting.longitude
            ).toFixed(2),
            createdAt: sighting.createdAt,
          })),
        });
      }
    } catch (error) {
      logger.error('Error checking nearby notifications:', error);
    }
  }

  public getIO() {
    return this.io;
  }

  public getConnectedUsers() {
    return this.connectedUsers;
  }
}