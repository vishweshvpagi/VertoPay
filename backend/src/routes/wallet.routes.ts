import { Router } from 'express';
import { walletController } from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/error.middleware';
import { walletValidators } from '../utils/validators';

const router = Router();

router.use(authenticate);

router.get('/', walletController.getWallet.bind(walletController));

router.post(
  '/pin',
  walletValidators.setPin,
  validateRequest,
  walletController.setPin.bind(walletController)
);

router.post(
  '/topup',
  walletValidators.topUp,
  validateRequest,
  walletController.topUp.bind(walletController)
);

router.post('/lock', walletController.lockWallet.bind(walletController));

router.post(
  '/unlock',
  walletValidators.setPin,
  validateRequest,
  walletController.unlockWallet.bind(walletController)
);

export default router;