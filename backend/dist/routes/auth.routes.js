"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const error_middleware_1 = require("../middleware/error.middleware");
const validators_1 = require("../utils/validators");
const router = (0, express_1.Router)();
router.post('/register', validators_1.authValidators.register, error_middleware_1.validateRequest, auth_controller_1.authController.register.bind(auth_controller_1.authController));
router.post('/login', validators_1.authValidators.login, error_middleware_1.validateRequest, auth_controller_1.authController.login.bind(auth_controller_1.authController));
router.get('/profile', auth_middleware_1.authenticate, auth_controller_1.authController.getProfile.bind(auth_controller_1.authController));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map