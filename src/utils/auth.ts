import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request } from 'express';
import prisma from './database';
import { logger } from './logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthUser {
  id: string;
  username?: string;
  email?: string;
  isAnonymous: boolean;
  isAdmin: boolean;
}

export interface JWTPayload {
  userId: string;
  isAnonymous: boolean;
  isAdmin: boolean;
  sessionId?: string;
}

// Generate JWT token
export const generateToken = async (user: AuthUser, sessionId?: string): Promise<string> => {
  const payload: JWTPayload = {
    userId: user.id,
    isAnonymous: user.isAnonymous,
    isAdmin: user.isAdmin,
    sessionId,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Create anonymous user
export const createAnonymousUser = async (ipAddress?: string, userAgent?: string) => {
  try {
    const user = await prisma.user.create({
      data: {
        isAnonymous: true,
        ipAddress,
        userAgent,
      },
    });

    logger.info(`Created anonymous user: ${user.id}`);
    return user;
  } catch (error) {
    logger.error('Error creating anonymous user:', error);
    throw error;
  }
};

// Create session
export const createSession = async (userId: string, ipAddress?: string, userAgent?: string) => {
  const token = jwt.sign({ userId, type: 'session' }, JWT_SECRET);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  try {
    const session = await prisma.userSession.create({
      data: {
        userId,
        token,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return session;
  } catch (error) {
    logger.error('Error creating session:', error);
    throw error;
  }
};

// Get or create anonymous user from request
export const getOrCreateAnonymousUser = async (req: Request) => {
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  // Try to find existing anonymous user with same IP (recent session)
  const recentAnonymous = await prisma.user.findFirst({
    where: {
      isAnonymous: true,
      ipAddress,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (recentAnonymous) {
    // Update session count
    await prisma.user.update({
      where: { id: recentAnonymous.id },
      data: { sessionCount: { increment: 1 } },
    });
    
    return recentAnonymous;
  }

  // Create new anonymous user
  return createAnonymousUser(ipAddress, userAgent);
};

// Extract user from token
export const getUserFromToken = async (token: string): Promise<AuthUser | null> => {
  try {
    const payload = verifyToken(token);
    
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        isAnonymous: true,
        isAdmin: true,
      },
    });

    return user;
  } catch (error) {
    logger.warn('Invalid token in getUserFromToken:', error);
    return null;
  }
};

// Clean expired sessions
export const cleanExpiredSessions = async () => {
  try {
    const result = await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    if (result.count > 0) {
      logger.info(`Cleaned ${result.count} expired sessions`);
    }
  } catch (error) {
    logger.error('Error cleaning expired sessions:', error);
  }
};

// Update user location for notifications
export const updateUserLocation = async (userId: string, latitude: number, longitude: number) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        lastLatitude: latitude,
        lastLongitude: longitude,
        lastLocationUpdate: new Date(),
      },
    });
  } catch (error) {
    logger.error('Error updating user location:', error);
    throw error;
  }
};