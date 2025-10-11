import { Router } from 'express';
import upload from '../utils/upload.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeServices,
  updateEmployeeSchedule,
  getEmployeeAvailability
} from '../controllers/employeeController.js';

const router = Router();

router.get('/', listEmployees);
router.get('/:id/availability', getEmployeeAvailability);

router.post('/', requireAuth, requireAdmin, upload.single('avatar'), createEmployee);
router.put('/:id', requireAuth, requireAdmin, upload.single('avatar'), updateEmployee);
router.delete('/:id', requireAuth, requireAdmin, deleteEmployee);
router.put('/:id/services', requireAuth, requireAdmin, updateEmployeeServices);
router.put('/:id/schedule', requireAuth, requireAdmin, updateEmployeeSchedule);

export default router;

