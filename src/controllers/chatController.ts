import { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../utils/database';
import { logger } from '../utils/logger';

// Validation for chat messages
export const chatMessageValidation = [
  body('message')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be 1-1000 characters')
    .trim(),
  body('anonymousName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Anonymous name too long')
    .trim(),
];

// Get chat messages for a sighting
export const getSightingMessages = async (req: Request, res: Response) => {
  try {
    const { sightingId } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const skip = (pageNum - 1) * limitNum;

    // Verify sighting exists and is not hidden
    const sighting = await prisma.sighting.findUnique({
      where: { id: sightingId },
      select: { id: true, title: true, isHidden: true },
    });

    if (!sighting || sighting.isHidden) {
      return res.status(404).json({ error: 'Sighting not found' });
    }

    const messages = await prisma.chatMessage.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    const totalCount = await prisma.chatMessage.count({
      where: {
        sightingId,
        isHidden: false,
      },
    });

    // Format messages for response
    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      message: msg.message,
      createdAt: msg.createdAt,
      user: msg.user || {
        id: null,
        username: msg.anonymousName || 'Anonymous',
        isAnonymous: true,
      },
    }));

    res.json({
      messages: formattedMessages.reverse(), // Reverse to show oldest first
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
      sighting: {
        id: sighting.id,
        title: sighting.title,
      },
    });
  } catch (error) {
    logger.error('Get sighting messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Create chat message (REST endpoint as backup to Socket.IO)
export const createMessage = async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sightingId } = req.params;
    const { message, anonymousName } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'User required' });
    }

    // Verify sighting exists and is not hidden
    const sighting = await prisma.sighting.findUnique({
      where: { id: sightingId },
      select: { id: true, isHidden: true },
    });

    if (!sighting || sighting.isHidden) {
      return res.status(404).json({ error: 'Sighting not found' });
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        message: message.trim(),
        sightingId,
        userId: req.user.isAnonymous ? null : req.user.id,
        anonymousName: req.user.isAnonymous ? (anonymousName || 'Anonymous') : null,
        ipAddress: req.ip,
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

    const formattedMessage = {
      id: chatMessage.id,
      message: chatMessage.message,
      createdAt: chatMessage.createdAt,
      user: chatMessage.user || {
        id: null,
        username: chatMessage.anonymousName || 'Anonymous',
        isAnonymous: true,
      },
    };

    logger.info(`Chat message created via REST: ${chatMessage.id} by user ${req.user.id}`);

    res.status(201).json({
      message: 'Message created successfully',
      chatMessage: formattedMessage,
    });
  } catch (error) {
    logger.error('Create message error:', error);
    res.status(500).json({ error: 'Failed to create message' });
  }
};

// Delete chat message
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Find message
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        user: true,
      },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check ownership (owner or admin can delete)
    if (message.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await prisma.chatMessage.delete({
      where: { id: messageId },
    });

    logger.info(`Chat message deleted: ${messageId} by user ${req.user.id}`);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// Hide chat message (admin only)
export const hideMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { reason } = req.body;

    if (!req.user?.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Hide message
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: {
        isHidden: true,
        moderatedBy: req.user.id,
      },
    });

    // Create admin action log
    await prisma.adminAction.create({
      data: {
        action: 'hide_message',
        reason: reason || 'Inappropriate content',
        adminId: req.user.id,
        details: `Hidden message ${messageId} in sighting ${message.sightingId}`,
      },
    });

    logger.info(`Message hidden: ${messageId} by admin ${req.user.id}`);

    res.json({ message: 'Message hidden successfully' });
  } catch (error) {
    logger.error('Hide message error:', error);
    res.status(500).json({ error: 'Failed to hide message' });
  }
};

// Get user's chat messages
export const getUserMessages = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.isAnonymous) {
      return res.status(401).json({ error: 'Registration required' });
    }

    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 50);
    const skip = (pageNum - 1) * limitNum;

    const messages = await prisma.chatMessage.findMany({
      where: {
        userId: req.user.id,
        isHidden: false,
      },
      include: {
        sighting: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    const totalCount = await prisma.chatMessage.count({
      where: {
        userId: req.user.id,
        isHidden: false,
      },
    });

    res.json({
      messages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    logger.error('Get user messages error:', error);
    res.status(500).json({ error: 'Failed to fetch user messages' });
  }
};