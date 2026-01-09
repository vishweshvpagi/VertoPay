import { body, param, query } from 'express-validator';

export const authValidators = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain uppercase, lowercase, and number'),
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('phone').optional().isMobilePhone('en-IN').withMessage('Valid phone number required'),
    body('role').optional().isIn(['STUDENT', 'MERCHANT']).withMessage('Invalid role'),
  ],
  
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
};

export const walletValidators = {
  topUp: [
    body('amount')
      .isFloat({ min: 1, max: 10000 })
      .withMessage('Amount must be between 1 and 10000'),
    body('pin').isLength({ min: 4, max: 6 }).withMessage('Valid PIN required'),
  ],
  
  setPin: [
    body('pin')
      .isLength({ min: 4, max: 6 })
      .isNumeric()
      .withMessage('PIN must be 4-6 digits'),
  ],
};

export const transactionValidators = {
  transfer: [
    body('receiverId').isUUID().withMessage('Valid receiver ID required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
    body('pin').isLength({ min: 4, max: 6 }).withMessage('Valid PIN required'),
    body('description').optional().trim().isLength({ max: 200 }),
  ],
  
  pay: [
    body('merchantCode').notEmpty().withMessage('Merchant code required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
    body('pin').isLength({ min: 4, max: 6 }).withMessage('Valid PIN required'),
  ],
};

export const paginationValidators = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];