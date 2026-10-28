import { Router } from 'express';
import * as controller from '../controllers/tickets.controller.js';
import { allowRoles, requireAuth } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ticketAttachment } from '../middleware/upload.middleware.js';

const router = Router();
router.use('/tickets', requireAuth);
router.get('/tickets', asyncHandler(controller.list));
router.post('/tickets', allowRoles('author'), ticketAttachment, asyncHandler(controller.create));
router.get('/tickets/:id', asyncHandler(controller.getById));
router.post('/tickets/:id/replies', asyncHandler(controller.reply));
router.get('/tickets/:id/attachment', asyncHandler(controller.attachment));
router.patch('/tickets/:id', allowRoles('admin'), asyncHandler(controller.update));
router.post('/tickets/:id/notes', allowRoles('admin'), asyncHandler(controller.addNote));
router.post('/tickets/:id/ai-draft', allowRoles('admin'), asyncHandler(controller.draft));

export default router;
