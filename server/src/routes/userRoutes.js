import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import upload from '../utils/upload.js';
import {
  listUsers,
  getUser,
  updateUser,
  uploadAvatar,
  getUserAppointments
} from '../controllers/userController.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireAdmin, listUsers);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.post('/:id/avatar', upload.single('avatar'), uploadAvatar);
router.get('/:id/appointments', getUserAppointments);

export default router;

