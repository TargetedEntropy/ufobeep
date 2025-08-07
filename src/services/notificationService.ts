import prisma, { geoUtils } from '../utils/database';
import { logger } from '../utils/logger';
import { SocketService } from './socketService';

export class NotificationService {
  private socketService: SocketService;

  constructor(socketService: SocketService) {
    this.socketService = socketService;
  }

  // Notify users of new sightings near their location
  async notifyNearbyUsers(sighting: any) {
    try {
      // Find users who have location tracking enabled and are within notification radius
      const users = await prisma.user.findMany({
        where: {
          isAnonymous: false,
          enableNotifications: true,
          lastLatitude: { not: null },
          lastLongitude: { not: null },
        },
        select: {
          id: true,
          username: true,
          email: true,
          lastLatitude: true,
          lastLongitude: true,
          notificationRadius: true,
        },
      });

      let notifiedCount = 0;

      for (const user of users) {
        if (user.lastLatitude && user.lastLongitude) {
          const distance = geoUtils.calculateDistance(
            sighting.latitude,
            sighting.longitude,
            user.lastLatitude,
            user.lastLongitude
          );

          if (distance <= user.notificationRadius) {
            // Send real-time notification via Socket.IO
            this.socketService.sendUserNotification(user.id, {
              type: 'new_nearby_sighting',
              id: `sighting_${sighting.id}`,
              title: 'UFO Sighting Near You!',
              message: `New sighting "${sighting.title}" reported ${distance.toFixed(1)}km away`,
              data: {
                sightingId: sighting.id,
                sightingTitle: sighting.title,
                distance: distance.toFixed(1),
                location: sighting.location,
              },
              timestamp: new Date().toISOString(),
            });

            notifiedCount++;
          }
        }
      }

      if (notifiedCount > 0) {
        logger.info(`Notified ${notifiedCount} users about new sighting ${sighting.id}`);
      }

      return notifiedCount;
    } catch (error) {
      logger.error('Error notifying nearby users:', error);
      return 0;
    }
  }

  // Send general notification to a specific user
  async sendUserNotification(
    userId: string, 
    type: string, 
    title: string, 
    message: string, 
    data?: any
  ) {
    try {
      const notification = {
        type,
        id: `${type}_${Date.now()}`,
        title,
        message,
        data: data || {},
        timestamp: new Date().toISOString(),
      };

      // Send via Socket.IO
      this.socketService.sendUserNotification(userId, notification);

      logger.info(`Notification sent to user ${userId}: ${title}`);
      return true;
    } catch (error) {
      logger.error('Error sending user notification:', error);
      return false;
    }
  }

  // Notify about new chat message in sighting user is interested in
  async notifyAboutChatMessage(chatMessage: any, excludeUserId?: string) {
    try {
      // Find users who have participated in this sighting's chat
      const participantMessages = await prisma.chatMessage.findMany({
        where: {
          sightingId: chatMessage.sightingId,
          userId: { not: null },
          userId: { not: excludeUserId },
        },
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              username: true,
              enableNotifications: true,
            },
          },
        },
        distinct: ['userId'],
      });

      const sighting = await prisma.sighting.findUnique({
        where: { id: chatMessage.sightingId },
        select: { id: true, title: true },
      });

      if (!sighting) return;

      let notifiedCount = 0;

      for (const participant of participantMessages) {
        if (participant.user?.enableNotifications) {
          await this.sendUserNotification(
            participant.userId!,
            'chat_activity',
            'New Chat Activity',
            `New message in "${sighting.title}" discussion`,
            {
              sightingId: sighting.id,
              sightingTitle: sighting.title,
              messagePreview: chatMessage.message.substring(0, 100),
            }
          );
          notifiedCount++;
        }
      }

      if (notifiedCount > 0) {
        logger.info(`Notified ${notifiedCount} users about chat activity in sighting ${chatMessage.sightingId}`);
      }

      return notifiedCount;
    } catch (error) {
      logger.error('Error notifying about chat message:', error);
      return 0;
    }
  }

  // Send system-wide announcements (admin only)
  async sendSystemAnnouncement(title: string, message: string, data?: any) {
    try {
      const announcement = {
        type: 'system_announcement',
        id: `announcement_${Date.now()}`,
        title,
        message,
        data: data || {},
        timestamp: new Date().toISOString(),
      };

      // Broadcast to all connected users
      const connectedUsers = this.socketService.getConnectedUsers();
      
      for (const [socketId, socket] of connectedUsers) {
        socket.emit('notification', announcement);
      }

      logger.info(`System announcement sent to ${connectedUsers.size} connected users`);
      return connectedUsers.size;
    } catch (error) {
      logger.error('Error sending system announcement:', error);
      return 0;
    }
  }

  // Clean up old notifications (if we were storing them)
  async cleanupOldNotifications() {
    try {
      // This would clean up stored notifications if we implement persistent notifications
      // For now, just log the cleanup attempt
      logger.info('Notification cleanup completed');
    } catch (error) {
      logger.error('Error during notification cleanup:', error);
    }
  }
}

// Export a function to create notification service with socket service
export const createNotificationService = (socketService: SocketService) => {
  return new NotificationService(socketService);
};