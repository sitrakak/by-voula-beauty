import { Router } from 'express';
import upload from '../utils/upload.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService
} from '../controllers/serviceController.js';

const router = Router();

router.get('/', listServices);
router.get('/:id', getService);

router.post('/', requireAuth, requireAdmin, upload.single('image'), createService);
router.put('/:id', requireAuth, requireAdmin, upload.single('image'), updateService);
router.delete('/:id', requireAuth, requireAdmin, deleteService);

export default router;

