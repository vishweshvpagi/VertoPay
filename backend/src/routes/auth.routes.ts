import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/error.middleware';
import { authValidators } from '../utils/validators';

const router = Router();

router.post(
  '/register',
  authValidators.register,
  validateRequest,
  authController.register.bind(authController)
);

router.post(
  '/login',
  authValidators.login,
  validateRequest,
  authController.login.bind(authController)
);

router.get(
  '/profile',
  authenticate,
  authController.getProfile.bind(authController)
);

export default router;