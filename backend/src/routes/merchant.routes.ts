import { Router } from 'express';
import { merchantController } from '../controllers/merchant.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isMerchant } from '../middleware/role.middleware';
import { paginationValidators } from '../utils/validators';
import { validateRequest } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate, isMerchant);

router.get('/stats', merchantController.getStats.bind(merchantController));

router.get(
  '/transactions',
  paginationValidators,
  validateRequest,
  merchantController.getTransactions.bind(merchantController)
);

export default router;