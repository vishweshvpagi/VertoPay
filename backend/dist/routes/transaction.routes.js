"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/transfer', validators_1.transactionValidators.transfer, error_middleware_1.validateRequest, transaction_controller_1.transactionController.transfer.bind(transaction_controller_1.transactionController));
router.post('/pay', validators_1.transactionValidators.pay, error_middleware_1.validateRequest, transaction_controller_1.transactionController.payMerchant.bind(transaction_controller_1.transactionController));
router.get('/history', validators_1.paginationValidators, error_middleware_1.validateRequest, transaction_controller_1.transactionController.getHistory.bind(transaction_controller_1.transactionController));
router.get('/:id', transaction_controller_1.transactionController.getTransaction.bind(transaction_controller_1.transactionController));
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map