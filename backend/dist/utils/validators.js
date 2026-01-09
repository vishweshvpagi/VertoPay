"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationValidators = exports.transactionValidators = exports.walletValidators = exports.authValidators = void 0;
const express_validator_1 = require("express-validator");
exports.authValidators = {
    register: [
        (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        (0, express_validator_1.body)('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .withMessage('Password must contain uppercase, lowercase, and number'),
        (0, express_validator_1.body)('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
        (0, express_validator_1.body)('phone').optional().isMobilePhone('en-IN').withMessage('Valid phone number required'),
        (0, express_validator_1.body)('role').optional().isIn(['STUDENT', 'MERCHANT']).withMessage('Invalid role'),
    ],
    login: [
        (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email required'),
        (0, express_validator_1.body)('password').notEmpty().withMessage('Password required'),
    ],
};
exports.walletValidators = {
    topUp: [
        (0, express_validator_1.body)('amount')
            .isFloat({ min: 1, max: 10000 })
            .withMessage('Amount must be between 1 and 10000'),
        (0, express_validator_1.body)('pin').isLength({ min: 4, max: 6 }).withMessage('Valid PIN required'),
    ],
    setPin: [
        (0, express_validator_1.body)('pin')
            .isLength({ min: 4, max: 6 })
            .isNumeric()
            .withMessage('PIN must be 4-6 digits'),
    ],
};
exports.transactionValidators = {
    transfer: [
        (0, express_validator_1.body)('receiverId').isUUID().withMessage('Valid receiver ID required'),
        (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
        (0, express_validator_1.body)('pin').isLength({ min: 4, max: 6 }).withMessage('Valid PIN required'),
        (0, express_validator_1.body)('description').optional().trim().isLength({ max: 200 }),
    ],
    pay: [
        (0, express_validator_1.body)('merchantCode').notEmpty().withMessage('Merchant code required'),
        (0, express_validator_1.body)('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
        (0, express_validator_1.body)('pin').isLength({ min: 4, max: 6 }).withMessage('Valid PIN required'),
    ],
};
exports.paginationValidators = [
    (0, express_validator_1.query)('page').optional().isInt({ min: 1 }).toInt(),
    (0, express_validator_1.query)('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
//# sourceMappingURL=validators.js.map