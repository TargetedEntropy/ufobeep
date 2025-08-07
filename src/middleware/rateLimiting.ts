import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import prisma from '../utils/database';
import { logger } from '../utils/logger';

// General API rate limiting
export const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for sighting submissions
export const sightingSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Maximum 10 sighting submissions per hour per IP
  message: {
    error: 'Too many sighting submissions. Please wait before submitting another.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat message rate limiting
export const chatMessageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Maximum 30 messages per minute per IP
  message: {
    error: 'Too many chat messages. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Maximum 20 file uploads per 15 minutes per IP
  message: {
    error: 'Too many file uploads. Please wait before uploading more files.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiting (stricter for login attempts)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Maximum 5 auth attempts per 15 minutes per IP
  message: {
    error: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Advanced spam detection based on content and patterns
export const spamDetection = async (req: Request, res: Response, next: any) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || '';

    // Get request content for analysis
    const content = JSON.stringify(req.body).toLowerCase();
    
    // Simple spam detection rules
    const spamKeywords = [
      'viagra', 'casino', 'loan', 'bitcoin', 'crypto', 
      'get rich quick', 'make money fast', 'click here',
      'limited time offer', 'act now', 'free money'
    ];

    const suspiciousPatterns = [
      /(.)\1{10,}/, // Repeated characters
      /[^\w\s]{5,}/, // Many special characters in a row
      /(http|https|www\.)/gi, // URLs (suspicious in UFO reports)
    ];

    let spamScore = 0;

    // Check for spam keywords
    spamKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        spamScore += 20;
      }
    });

    // Check for suspicious patterns
    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        spamScore += 15;
      }
    });

    // Check for very short or very long content
    if (req.body.description) {
      const desc = req.body.description;
      if (desc.length < 10) spamScore += 10;
      if (desc.length > 5000) spamScore += 25;
      
      // Check for excessive capitalization
      const capsRatio = (desc.match(/[A-Z]/g) || []).length / desc.length;
      if (capsRatio > 0.5) spamScore += 20;
    }

    // Check submission frequency for this IP
    const recentSubmissions = await prisma.submissionLog.findMany({
      where: {
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    });

    if (recentSubmissions.length > 5) {
      spamScore += 30;
    }

    // Log submission
    await prisma.submissionLog.upsert({
      where: {
        ipAddress_action_windowStart: {
          ipAddress,
          action: req.route?.path || req.path,
          windowStart: new Date(Math.floor(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000)),
        },
      },
      update: {
        count: { increment: 1 },
      },
      create: {
        ipAddress,
        userAgent,
        action: req.route?.path || req.path,
        count: 1,
        windowStart: new Date(Math.floor(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000)),
      },
    });

    // Block if spam score is too high
    if (spamScore >= 50) {
      logger.warn(`Potential spam blocked from IP ${ipAddress}. Score: ${spamScore}`);
      return res.status(429).json({
        error: 'Content flagged as potential spam. Please try again with different content.',
      });
    }

    // Log suspicious activity
    if (spamScore >= 30) {
      logger.warn(`Suspicious activity from IP ${ipAddress}. Score: ${spamScore}`);
    }

    next();
  } catch (error) {
    logger.error('Spam detection error:', error);
    // Don't block on error, just log and continue
    next();
  }
};