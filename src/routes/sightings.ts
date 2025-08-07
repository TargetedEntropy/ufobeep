import { Router } from 'express';
import {
  getSightings,
  getSighting,
  createSighting,
  updateSighting,
  deleteSighting,
  reportSighting,
  createSightingValidation,
} from '../controllers/sightingController';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = Router();

// Public routes (support anonymous users)
router.get('/', optionalAuth, getSightings);
router.get('/:id', optionalAuth, getSighting);

// Sighting CRUD (anonymous users can create, but need auth for update/delete)
router.post('/', [...createSightingValidation, optionalAuth], createSighting);
router.put('/:id', [...createSightingValidation, requireAuth], updateSighting);
router.delete('/:id', requireAuth, deleteSighting);

// Moderation
router.post('/:id/report', optionalAuth, reportSighting);

export default router;