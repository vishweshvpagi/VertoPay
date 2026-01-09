"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStudent = exports.isMerchant = exports.isAdmin = void 0;
exports.authorize = authorize;
const client_1 = require("@prisma/client");
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Authentication required",
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: "Insufficient permissions",
            });
            return;
        }
        next();
    };
}
exports.isAdmin = authorize(client_1.Role.ADMIN);
exports.isMerchant = authorize(client_1.Role.MERCHANT, client_1.Role.ADMIN);
exports.isStudent = authorize(client_1.Role.STUDENT, client_1.Role.ADMIN);
//# sourceMappingURL=role.middleware.js.map