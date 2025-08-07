import { Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import prisma, { geoUtils } from '../utils/database';
import { logger } from '../utils/logger';

// Get user's sightings
export const getUserSightings = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50);
    const skip = (pageNum - 1) * limitNum;

    // For anonymous users, we can't track their sightings easily
    if (req.user.isAnonymous) {
      return res.json({
        sightings: [],
        pagination: { page: pageNum, limit: limitNum, total: 0, pages: 0 },
      });
    }

    const sightings = await prisma.sighting.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        _count: {
          select: {
            chatMessages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    const totalCount = await prisma.sighting.count({
      where: { userId: req.user.id },
    });

    res.json({
      sightings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    logger.error('Get user sightings error:', error);
    res.status(500).json({ error: 'Failed to fetch user sightings' });
  }
};

// Get nearby sightings based on user's last location
export const getNearbyNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        lastLatitude: true,
        lastLongitude: true,
        notificationRadius: true,
        enableNotifications: true,
      },
    });

    if (!user || !user.enableNotifications) {
      return res.json({ notifications: [] });
    }

    if (!user.lastLatitude || !user.lastLongitude) {
      return res.status(400).json({ error: 'Location not set for notifications' });
    }

    // Find recent sightings within notification radius
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const nearbySightings = await geoUtils.findNearbySync(
      user.lastLatitude,
      user.lastLongitude,
      user.notificationRadius,
      20
    );

    // Filter for recent sightings and calculate distances
    const notifications = nearbySightings
      .filter(sighting => sighting.createdAt >= oneWeekAgo)
      .map(sighting => ({
        ...sighting,
        distance: geoUtils.calculateDistance(
          user.lastLatitude!,
          user.lastLongitude!,
          sighting.latitude,
          sighting.longitude
        ).toFixed(2),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ notifications });
  } catch (error) {
    logger.error('Get nearby notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.isAnonymous) {
      return res.status(401).json({ error: 'Registration required' });
    }

    const stats = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        createdAt: true,
        sessionCount: true,
        lastLocationUpdate: true,
        _count: {
          select: {
            sightings: true,
            chatMessages: true,
          },
        },
      },
    });

    if (!stats) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get additional stats
    const sightingStats = await prisma.sighting.aggregate({
      where: { userId: req.user.id },
      _sum: {
        viewCount: true,
      },
      _avg: {
        viewCount: true,
      },
    });

    res.json({
      memberSince: stats.createdAt,
      totalSightings: stats._count.sightings,
      totalChatMessages: stats._count.chatMessages,
      totalViews: sightingStats._sum.viewCount || 0,
      averageViews: Math.round(sightingStats._avg.viewCount || 0),
      sessionCount: stats.sessionCount,
      lastLocationUpdate: stats.lastLocationUpdate,
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
};

// Search users (for admin purposes)
export const searchUsers = async (req: Request, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { q = '', page = '1', limit = '20', type } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    // Filter by user type
    if (type === 'anonymous') {
      where.isAnonymous = true;
    } else if (type === 'registered') {
      where.isAnonymous = false;
    }

    // Search by username or email
    if (q) {
      where.OR = [
        { username: { contains: q as string, mode: 'insensitive' } },
        { email: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        isAnonymous: true,
        isAdmin: true,
        createdAt: true,
        sessionCount: true,
        lastLocationUpdate: true,
        _count: {
          select: {
            sightings: true,
            chatMessages: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    const totalCount = await prisma.user.count({ where });

    res.json({
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    logger.error('Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

// Get user by ID (admin only)
export const getUser = async (req: Request, res: Response) => {
  try {
    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        isAnonymous: true,
        isAdmin: true,
        createdAt: true,
        sessionCount: true,
        lastLatitude: true,
        lastLongitude: true,
        lastLocationUpdate: true,
        notificationRadius: true,
        enableNotifications: true,
        ipAddress: true,
        userAgent: true,
        _count: {
          select: {
            sightings: true,
            chatMessages: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get recent activity
    const recentSightings = await prisma.sighting.findMany({
      where: { userId: id },
      select: {
        id: true,
        title: true,
        createdAt: true,
        viewCount: true,
        reportCount: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: id },
      select: {
        id: true,
        message: true,
        createdAt: true,
        sighting: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      user,
      recentSightings,
      recentMessages,
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};