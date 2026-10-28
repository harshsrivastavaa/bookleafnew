import { Router } from 'express';
import { getDashboardData, listAdmins, listBooks } from '../controllers/books.controller.js';
import { requireAuth, allowRoles } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';

const router = Router();
router.use(requireAuth);
router.get('/books', asyncHandler(listBooks));
router.get('/admins', allowRoles('admin'), asyncHandler(listAdmins));
router.get('/dashboard', asyncHandler(getDashboardData));

export default router;
