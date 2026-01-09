"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const db_1 = require("../config/db");
const env_1 = require("../config/env");
const error_middleware_1 = require("../middleware/error.middleware");
const helpers_1 = require("../utils/helpers");
class AuthService {
    async register(data) {
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new error_middleware_1.AppError("Email already registered", 400);
        }
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
        const user = await db_1.prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                phone: data.phone,
                role: data.role || client_1.Role.STUDENT,
                merchantName: data.role === client_1.Role.MERCHANT ? data.merchantName : null,
                merchantCode: data.role === client_1.Role.MERCHANT ? (0, helpers_1.generateMerchantCode)() : null,
                wallet: {
                    create: {
                        balance: 0,
                    },
                },
            },
            include: {
                wallet: true,
            },
        });
        const token = this.generateToken(user.id, user.email, user.role);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                merchantCode: user.merchantCode,
            },
            token,
        };
    }
    async login(data) {
        const user = await db_1.prisma.user.findUnique({
            where: { email: data.email },
            include: { wallet: true },
        });
        if (!user || !user.isActive) {
            throw new error_middleware_1.AppError("Invalid credentials", 401);
        }
        const isPasswordValid = await bcryptjs_1.default.compare(data.password, user.password);
        if (!isPasswordValid) {
            throw new error_middleware_1.AppError("Invalid credentials", 401);
        }
        const token = this.generateToken(user.id, user.email, user.role);
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                merchantCode: user.merchantCode,
                wallet: user.wallet
                    ? {
                        balance: Number(user.wallet.balance),
                        isLocked: user.wallet.isLocked,
                    }
                    : null,
            },
            token,
        };
    }
    async getProfile(userId) {
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            include: { wallet: true },
        });
        if (!user) {
            throw new error_middleware_1.AppError("User not found", 404);
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            merchantName: user.merchantName,
            merchantCode: user.merchantCode,
            wallet: user.wallet
                ? {
                    balance: Number(user.wallet.balance),
                    dailyLimit: Number(user.wallet.dailyLimit),
                    isLocked: user.wallet.isLocked,
                    hasPin: !!user.wallet.pin,
                }
                : null,
        };
    }
    generateToken(userId, email, role) {
        const options = {
            expiresIn: env_1.env.jwt.expiresIn,
        };
        return jsonwebtoken_1.default.sign({ userId, email, role }, env_1.env.jwt.secret, options);
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=auth.service.js.map