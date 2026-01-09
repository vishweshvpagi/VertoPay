"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletService = exports.WalletService = void 0;
const library_1 = require("@prisma/client/runtime/library");
const db_1 = require("../config/db");
const error_middleware_1 = require("../middleware/error.middleware");
const encryption_1 = require("../utils/encryption");
class WalletService {
    async getWallet(userId) {
        const wallet = await db_1.prisma.wallet.findUnique({
            where: { userId },
            include: {
                user: {
                    select: { name: true, email: true },
                },
            },
        });
        if (!wallet) {
            throw new error_middleware_1.AppError('Wallet not found', 404);
        }
        return {
            id: wallet.id,
            balance: Number(wallet.balance),
            dailyLimit: Number(wallet.dailyLimit),
            monthlyLimit: Number(wallet.monthlyLimit),
            isLocked: wallet.isLocked,
            hasPin: !!wallet.pin,
        };
    }
    async setPin(userId, pin) {
        const wallet = await db_1.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            throw new error_middleware_1.AppError('Wallet not found', 404);
        }
        await db_1.prisma.wallet.update({
            where: { userId },
            data: { pin: (0, encryption_1.hashPin)(pin) },
        });
        return { message: 'PIN set successfully' };
    }
    async verifyWalletPin(userId, pin) {
        const wallet = await db_1.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet || !wallet.pin) {
            throw new error_middleware_1.AppError('Wallet PIN not set', 400);
        }
        if (wallet.isLocked) {
            throw new error_middleware_1.AppError('Wallet is locked', 403);
        }
        return (0, encryption_1.verifyPin)(pin, wallet.pin);
    }
    async topUp(userId, amount, pin) {
        const isValid = await this.verifyWalletPin(userId, pin);
        if (!isValid) {
            throw new error_middleware_1.AppError('Invalid PIN', 401);
        }
        const wallet = await db_1.prisma.wallet.update({
            where: { userId },
            data: {
                balance: { increment: amount },
            },
        });
        // Create transaction record
        await db_1.prisma.transaction.create({
            data: {
                amount: new library_1.Decimal(amount),
                type: 'CREDIT',
                status: 'COMPLETED',
                description: 'Wallet top-up',
                receiverId: userId,
            },
        });
        return {
            balance: Number(wallet.balance),
            message: 'Top-up successful',
        };
    }
    async lockWallet(userId) {
        await db_1.prisma.wallet.update({
            where: { userId },
            data: { isLocked: true },
        });
        return { message: 'Wallet locked successfully' };
    }
    async unlockWallet(userId, pin) {
        const wallet = await db_1.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet || !wallet.pin) {
            throw new error_middleware_1.AppError('Wallet not found', 404);
        }
        if (!(0, encryption_1.verifyPin)(pin, wallet.pin)) {
            throw new error_middleware_1.AppError('Invalid PIN', 401);
        }
        await db_1.prisma.wallet.update({
            where: { userId },
            data: { isLocked: false },
        });
        return { message: 'Wallet unlocked successfully' };
    }
}
exports.WalletService = WalletService;
exports.walletService = new WalletService();
//# sourceMappingURL=wallet.service.js.map