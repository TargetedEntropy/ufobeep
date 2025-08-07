import { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma, { geoUtils } from '../utils/database';
import { logger } from '../utils/logger';

// Validation for creating sightings
export const createSightingValidation = [
  body('title')
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be 5-100 characters'),
  body('description')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be 10-2000 characters'),
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude required (-90 to 90)'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude required (-180 to 180)'),
  body('sightingDate')
    .isISO8601()
    .withMessage('Valid ISO 8601 date required')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date < oneYearAgo || date > tomorrow) {
        throw new Error('Sighting date must be within the past year');
      }
      return true;
    }),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 86400 })
    .withMessage('Duration must be 1-86400 seconds'),
  body('witnesses')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Witnesses must be 1-1000'),
  body('weather')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Weather description too long'),
  body('visibility')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Visibility description too long'),
  body('location')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Location description too long'),
];

// Get all sightings with optional filtering
export const getSightings = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      latitude,
      longitude,
      radius = '50',
      verified,
      recent,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 per page
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      isHidden: false,
    };

    // Filter by verification status
    if (verified === 'true') {
      where.isVerified = true;
    }

    // Filter by recent sightings (last 30 days)
    if (recent === 'true') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      where.createdAt = { gte: thirtyDaysAgo };
    }

    let sightings;

    // If coordinates provided, find nearby sightings
    if (latitude && longitude) {
      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      const radiusKm = parseFloat(radius as string);

      if (isNaN(lat) || isNaN(lon) || isNaN(radiusKm)) {
        return res.status(400).json({ error: 'Invalid coordinates or radius' });
      }

      sightings = await geoUtils.findNearbySync(lat, lon, radiusKm, limitNum);
    } else {
      // Regular pagination query
      sightings = await prisma.sighting.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              isAnonymous: true,
            },
          },
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
    }

    // Get total count for pagination
    const totalCount = await prisma.sighting.count({ where });

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
    logger.error('Get sightings error:', error);
    res.status(500).json({ error: 'Failed to fetch sightings' });
  }
};

// Get single sighting by ID
export const getSighting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sighting = await prisma.sighting.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            isAnonymous: true,
          },
        },
        chatMessages: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                isAnonymous: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 50, // Limit initial chat messages
        },
        _count: {
          select: {
            chatMessages: true,
          },
        },
      },
    });

    if (!sighting || sighting.isHidden) {
      return res.status(404).json({ error: 'Sighting not found' });
    }

    // Increment view count
    await prisma.sighting.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    res.json({ sighting });
  } catch (error) {
    logger.error('Get sighting error:', error);
    res.status(500).json({ error: 'Failed to fetch sighting' });
  }
};

// Create new sighting
export const createSighting = async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User required' });
    }

    const {
      title,
      description,
      latitude,
      longitude,
      location,
      sightingDate,
      duration,
      witnesses = 1,
      weather,
      visibility,
      imageUrls = [],
      videoUrls = [],
    } = req.body;

    const sighting = await prisma.sighting.create({
      data: {
        title,
        description,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location,
        sightingDate: new Date(sightingDate),
        duration: duration ? parseInt(duration) : null,
        witnesses: parseInt(witnesses),
        weather,
        visibility,
        imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
        videoUrls: Array.isArray(videoUrls) ? videoUrls : [],
        userId: req.user.isAnonymous ? null : req.user.id,
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

    logger.info(`Sighting created: ${sighting.id} by user ${req.user.id}`);

    res.status(201).json({
      message: 'Sighting created successfully',
      sighting,
    });
  } catch (error) {
    logger.error('Create sighting error:', error);
    res.status(500).json({ error: 'Failed to create sighting' });
  }
};

// Update existing sighting
export const updateSighting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find existing sighting
    const existingSighting = await prisma.sighting.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingSighting || existingSighting.isHidden) {
      return res.status(404).json({ error: 'Sighting not found' });
    }

    // Check ownership (only owner or admin can update)
    if (
      existingSighting.userId !== req.user.id && 
      !req.user.isAdmin
    ) {
      return res.status(403).json({ error: 'Not authorized to update this sighting' });
    }

    const {
      title,
      description,
      latitude,
      longitude,
      location,
      sightingDate,
      duration,
      witnesses,
      weather,
      visibility,
    } = req.body;

    const updatedSighting = await prisma.sighting.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(latitude && { latitude: parseFloat(latitude) }),
        ...(longitude && { longitude: parseFloat(longitude) }),
        ...(location !== undefined && { location }),
        ...(sightingDate && { sightingDate: new Date(sightingDate) }),
        ...(duration !== undefined && { duration: duration ? parseInt(duration) : null }),
        ...(witnesses && { witnesses: parseInt(witnesses) }),
        ...(weather !== undefined && { weather }),
        ...(visibility !== undefined && { visibility }),
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

    logger.info(`Sighting updated: ${id} by user ${req.user.id}`);

    res.json({
      message: 'Sighting updated successfully',
      sighting: updatedSighting,
    });
  } catch (error) {
    logger.error('Update sighting error:', error);
    res.status(500).json({ error: 'Failed to update sighting' });
  }
};

// Delete sighting
export const deleteSighting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find existing sighting
    const existingSighting = await prisma.sighting.findUnique({
      where: { id },
    });

    if (!existingSighting) {
      return res.status(404).json({ error: 'Sighting not found' });
    }

    // Check ownership (only owner or admin can delete)
    if (
      existingSighting.userId !== req.user.id && 
      !req.user.isAdmin
    ) {
      return res.status(403).json({ error: 'Not authorized to delete this sighting' });
    }

    await prisma.sighting.delete({
      where: { id },
    });

    logger.info(`Sighting deleted: ${id} by user ${req.user.id}`);

    res.json({ message: 'Sighting deleted successfully' });
  } catch (error) {
    logger.error('Delete sighting error:', error);
    res.status(500).json({ error: 'Failed to delete sighting' });
  }
};

// Report sighting (for moderation)
export const reportSighting = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User required' });
    }

    if (!reason || reason.length < 10 || reason.length > 500) {
      return res.status(400).json({ error: 'Report reason must be 10-500 characters' });
    }

    // Find existing sighting
    const sighting = await prisma.sighting.findUnique({
      where: { id },
    });

    if (!sighting || sighting.isHidden) {
      return res.status(404).json({ error: 'Sighting not found' });
    }

    // Increment report count
    await prisma.sighting.update({
      where: { id },
      data: { reportCount: { increment: 1 } },
    });

    // Create admin action for review
    await prisma.adminAction.create({
      data: {
        action: 'sighting_reported',
        reason,
        targetSightingId: id,
        adminId: req.user.id, // Will be reviewed by actual admin later
        details: `Reported by user ${req.user.id}: ${reason}`,
      },
    });

    logger.info(`Sighting reported: ${id} by user ${req.user.id}`);

    res.json({ message: 'Report submitted successfully' });
  } catch (error) {
    logger.error('Report sighting error:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
};