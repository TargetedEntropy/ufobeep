import { Request, Response, NextFunction } from 'express';
import { getUserFromToken, getOrCreateAnonymousUser, AuthUser } from '../utils/auth';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      isAuthenticated: boolean;
    }
  }
}

// Optional authentication middleware - supports both authenticated and anonymous users
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (token) {
      // Try to authenticate with token
      const user = await getUserFromToken(token);
      if (user) {
        req.user = user;
        req.isAuthenticated = true;
        return next();
      }
    }

    // No valid token - create/use anonymous user
    const anonymousUser = await getOrCreateAnonymousUser(req);
    req.user = {
      id: anonymousUser.id,
      username: anonymousUser.username || undefined,
      email: anonymousUser.email || undefined,
      isAnonymous: true,
      isAdmin: false,
    };
    req.isAuthenticated = false;
    
    next();
  } catch (error) {
    logger.error('Error in optionalAuth middleware:', error);
    
    // Fallback to anonymous user even on error
    try {
      const anonymousUser = await getOrCreateAnonymousUser(req);
      req.user = {
        id: anonymousUser.id,
        isAnonymous: true,
        isAdmin: false,
      };
      req.isAuthenticated = false;
      next();
    } catch (fallbackError) {
      logger.error('Failed to create fallback anonymous user:', fallbackError);
      res.status(500).json({ error: 'Authentication system error' });
    }
  }
};

// Require authentication - rejects anonymous users
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const user = await getUserFromToken(token);
    if (!user || user.isAnonymous) {
      return res.status(401).json({ error: 'Valid authentication required' });
    }

    req.user = user;
    req.isAuthenticated = true;
    next();
  } catch (error) {
    logger.error('Error in requireAuth middleware:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Require admin authentication
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First check if user is authenticated
    await requireAuth(req, res, (error) => {
      if (error) return;
      
      // Check if user is admin
      if (!req.user?.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      next();
    });
  } catch (error) {
    logger.error('Error in requireAdmin middleware:', error);
    res.status(403).json({ error: 'Admin access denied' });
  }
};

// Extract user information for socket connections
export const socketAuth = async (socket: any, next: any) => {
  try {
    const token = socket.handshake.auth?.token;
    
    if (token) {
      const user = await getUserFromToken(token);
      if (user) {
        socket.user = user;
        socket.isAuthenticated = true;
        return next();
      }
    }

    // Create anonymous socket user
    socket.user = {
      id: `anonymous_${socket.id}`,
      isAnonymous: true,
      isAdmin: false,
    };
    socket.isAuthenticated = false;
    
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    // Allow connection even on error, but mark as anonymous
    socket.user = {
      id: `anonymous_${socket.id}`,
      isAnonymous: true,
      isAdmin: false,
    };
    socket.isAuthenticated = false;
    next();
  }
};