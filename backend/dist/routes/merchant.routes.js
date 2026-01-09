"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const merchant_controller_1 = require("../controllers/merchant.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const validators_1 = require("../utils/validators");
const error_middleware_1 = require("../middleware/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, role_middleware_1.isMerchant);
router.get('/stats', merchant_controller_1.merchantController.getStats.bind(merchant_controller_1.merchantController));
router.get('/transactions', validators_1.paginationValidators, error_middleware_1.validateRequest, merchant_controller_1.merchantController.getTransactions.bind(merchant_controller_1.merchantController));
exports.default = router;
//# sourceMappingURL=merchant.routes.js.map