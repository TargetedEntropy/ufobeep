import { Router } from 'express';
import {
  getSightingMessages,
  createMessage,
  deleteMessage,
  hideMessage,
  getUserMessages,
  chatMessageValidation,
} from '../controllers/chatController';
import { optionalAuth, requireAuth, requireAdmin } from '../middleware/auth';
import { chatMessageLimiter } from '../middleware/rateLimiting';

const router = Router();

// Chat message routes
router.get('/sighting/:sightingId', optionalAuth, getSightingMessages);
router.post('/sighting/:sightingId', [...chatMessageValidation, optionalAuth, chatMessageLimiter], createMessage);

// Message management
router.delete('/message/:messageId', requireAuth, deleteMessage);
router.patch('/message/:messageId/hide', requireAdmin, hideMessage);

// User messages
router.get('/user/messages', requireAuth, getUserMessages);

export default router;