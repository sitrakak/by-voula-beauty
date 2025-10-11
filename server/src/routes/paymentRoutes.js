import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { listPayments, createPayment } from '../controllers/paymentController.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/', listPayments);
router.post('/', createPayment);

export default router;

