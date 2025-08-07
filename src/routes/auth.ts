import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateLocation,
  updateNotificationPreferences,
  upgradeAnonymousUser,
  registerValidation,
  loginValidation,
} from '../controllers/authController';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/profile', requireAuth, getProfile);
router.put('/location', optionalAuth, updateLocation);
router.put('/notifications', requireAuth, updateNotificationPreferences);

// Anonymous user upgrade
router.post('/upgrade', [...registerValidation, optionalAuth], upgradeAnonymousUser);

export default router;