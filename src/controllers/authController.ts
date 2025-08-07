import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../utils/database';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  createSession,
  updateUserLocation
} from '../utils/auth';
import { logger } from '../utils/logger';

// Registration validation
export const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Valid email required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
];

// Login validation
export const loginValidation = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
];

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        isAnonymous: false,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    // Create session and generate token
    const session = await createSession(
      user.id, 
      req.ip, 
      req.get('User-Agent')
    );
    
    const token = await generateToken({
      id: user.id,
      username: user.username || undefined,
      email: user.email || undefined,
      isAnonymous: false,
      isAdmin: user.isAdmin,
    }, session.id);

    logger.info(`User registered: ${user.email}`);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAnonymous: false,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.isAnonymous || !user.password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create session and generate token
    const session = await createSession(
      user.id, 
      req.ip, 
      req.get('User-Agent')
    );
    
    const token = await generateToken({
      id: user.id,
      username: user.username || undefined,
      email: user.email || undefined,
      isAnonymous: false,
      isAdmin: user.isAdmin,
    }, session.id);

    // Update session count
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        sessionCount: { increment: 1 },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAnonymous: false,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        isAnonymous: true,
        isAdmin: true,
        lastLatitude: true,
        lastLongitude: true,
        notificationRadius: true,
        enableNotifications: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update user location for notifications
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ error: 'Valid latitude and longitude required' });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    await updateUserLocation(req.user.id, latitude, longitude);

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    logger.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req: Request, res: Response) => {
  try {
    const { enableNotifications, notificationRadius } = req.body;

    if (!req.user || req.user.isAnonymous) {
      return res.status(401).json({ error: 'Registration required for notification preferences' });
    }

    const updateData: any = {};
    
    if (typeof enableNotifications === 'boolean') {
      updateData.enableNotifications = enableNotifications;
    }
    
    if (typeof notificationRadius === 'number' && notificationRadius > 0 && notificationRadius <= 1000) {
      updateData.notificationRadius = notificationRadius;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid preferences provided' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    res.json({ message: 'Notification preferences updated' });
  } catch (error) {
    logger.error('Update notification preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
};

// Convert anonymous user to registered user
export const upgradeAnonymousUser = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user || !req.user.isAnonymous) {
      return res.status(400).json({ error: 'Can only upgrade anonymous users' });
    }

    const { username, email, password } = req.body;

    // Check if credentials are already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
    }

    // Hash password and upgrade user
    const hashedPassword = await hashPassword(password);
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        isAnonymous: false,
      },
    });

    // Generate new token
    const session = await createSession(
      updatedUser.id, 
      req.ip, 
      req.get('User-Agent')
    );
    
    const token = await generateToken({
      id: updatedUser.id,
      username: updatedUser.username || undefined,
      email: updatedUser.email || undefined,
      isAnonymous: false,
      isAdmin: updatedUser.isAdmin,
    }, session.id);

    logger.info(`Anonymous user upgraded: ${updatedUser.email}`);

    res.json({
      message: 'Account upgrade successful',
      token,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isAnonymous: false,
        isAdmin: updatedUser.isAdmin,
      },
    });
  } catch (error) {
    logger.error('Upgrade user error:', error);
    res.status(500).json({ error: 'Account upgrade failed' });
  }
};