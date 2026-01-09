"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const role_middleware_1 = require("../middleware/role.middleware");
const validators_1 = require("../utils/validators");
const error_middleware_1 = require("../middleware/error.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate, role_middleware_1.isAdmin);
router.get('/dashboard', admin_controller_1.adminController.getDashboard.bind(admin_controller_1.adminController));
router.get('/users', validators_1.paginationValidators, error_middleware_1.validateRequest, admin_controller_1.adminController.getUsers.bind(admin_controller_1.adminController));
router.patch('/users/:id/status', admin_controller_1.adminController.toggleUserStatus.bind(admin_controller_1.adminController));
router.get('/transactions', validators_1.paginationValidators, error_middleware_1.validateRequest, admin_controller_1.adminController.getAllTransactions.bind(admin_controller_1.adminController));
router.get('/fraud', validators_1.paginationValidators, error_middleware_1.validateRequest, admin_controller_1.adminController.getFlaggedTransactions.bind(admin_controller_1.adminController));
router.patch('/fraud/:id/review', admin_controller_1.adminController.reviewFlaggedTransaction.bind(admin_controller_1.adminController));
router.get('/audit', validators_1.paginationValidators, error_middleware_1.validateRequest, admin_controller_1.adminController.getAuditLogs.bind(admin_controller_1.adminController));
exports.default = router;
//# sourceMappingURL=admin.routes.js.map