"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("../controllers/wallet.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', wallet_controller_1.walletController.getWallet.bind(wallet_controller_1.walletController));
router.post('/pin', validators_1.walletValidators.setPin, error_middleware_1.validateRequest, wallet_controller_1.walletController.setPin.bind(wallet_controller_1.walletController));
router.post('/topup', validators_1.walletValidators.topUp, error_middleware_1.validateRequest, wallet_controller_1.walletController.topUp.bind(wallet_controller_1.walletController));
router.post('/lock', wallet_controller_1.walletController.lockWallet.bind(wallet_controller_1.walletController));
router.post('/unlock', validators_1.walletValidators.setPin, error_middleware_1.validateRequest, wallet_controller_1.walletController.unlockWallet.bind(wallet_controller_1.walletController));
exports.default = router;
//# sourceMappingURL=wallet.routes.js.map