import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  listAppointments,
  listMyAppointments,
  createAppointment,
  updateAppointmentStatus
} from '../controllers/appointmentController.js';

const router = Router();

router.use(requireAuth);

router.get('/', requireAdmin, listAppointments);
router.get('/my', listMyAppointments);
router.post('/', createAppointment);
router.put('/:id/status', updateAppointmentStatus);

export default router;

