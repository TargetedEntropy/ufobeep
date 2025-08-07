import { Router } from 'express';
import {
  getUserSightings,
  getNearbyNotifications,
  getUserStats,
  searchUsers,
  getUser,
} from '../controllers/userController';
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth';

const router = Router();

// User routes
router.get('/sightings', requireAuth, getUserSightings);
router.get('/notifications', optionalAuth, getNearbyNotifications);
router.get('/stats', requireAuth, getUserStats);

// Admin routes
router.get('/search', requireAdmin, searchUsers);
router.get('/:id', requireAdmin, getUser);

export default router;