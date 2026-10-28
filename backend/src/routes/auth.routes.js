import { Router } from 'express';
import { getCurrentUser, loginUser, logoutUser } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.post('/login', asyncHandler(loginUser));
router.post('/logout', logoutUser);
router.get('/me', requireAuth, getCurrentUser);

export default router;
