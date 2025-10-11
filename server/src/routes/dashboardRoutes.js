import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getSummary } from '../controllers/dashboardController.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/summary', getSummary);

export default router;

