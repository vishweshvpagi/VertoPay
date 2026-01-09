import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { paginationValidators } from '../utils/validators';
import { validateRequest } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate, isAdmin);

router.get('/dashboard', adminController.getDashboard.bind(adminController));

router.get(
  '/users',
  paginationValidators,
  validateRequest,
  adminController.getUsers.bind(adminController)
);

router.patch('/users/:id/status', adminController.toggleUserStatus.bind(adminController));

router.get(
  '/transactions',
  paginationValidators,
  validateRequest,
  adminController.getAllTransactions.bind(adminController)
);

router.get(
  '/fraud',
  paginationValidators,
  validateRequest,
  adminController.getFlaggedTransactions.bind(adminController)
);

router.patch('/fraud/:id/review', adminController.reviewFlaggedTransaction.bind(adminController));

router.get(
  '/audit',
  paginationValidators,
  validateRequest,
  adminController.getAuditLogs.bind(adminController)
);

export default router;