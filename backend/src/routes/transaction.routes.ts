import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/error.middleware';
import { transactionValidators, paginationValidators } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.post(
  '/transfer',
  transactionValidators.transfer,
  validateRequest,
  transactionController.transfer.bind(transactionController)
);

router.post(
  '/pay',
  transactionValidators.pay,
  validateRequest,
  transactionController.payMerchant.bind(transactionController)
);

router.get(
  '/history',
  paginationValidators,
  validateRequest,
  transactionController.getHistory.bind(transactionController)
);

router.get('/:id', transactionController.getTransaction.bind(transactionController));

export default router;