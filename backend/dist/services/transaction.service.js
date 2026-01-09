"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionService = exports.TransactionService = void 0;
const library_1 = require("@prisma/client/runtime/library");
const client_1 = require("@prisma/client");
const db_1 = require("../config/db");
const error_middleware_1 = require("../middleware/error.middleware");
const wallet_service_1 = require("./wallet.service");
const helpers_1 = require("../utils/helpers");
const fraud_service_1 = require("./fraud.service");
class TransactionService {
    async transfer(data) {
        // Verify PIN
        const isPinValid = await wallet_service_1.walletService.verifyWalletPin(data.senderId, data.pin);
        if (!isPinValid) {
            throw new error_middleware_1.AppError("Invalid PIN", 401);
        }
        // Check sender wallet
        const senderWallet = await db_1.prisma.wallet.findUnique({
            where: { userId: data.senderId },
        });
        if (!senderWallet || Number(senderWallet.balance) < data.amount) {
            throw new error_middleware_1.AppError("Insufficient balance", 400);
        }
        // Check receiver exists
        const receiverWallet = await db_1.prisma.wallet.findUnique({
            where: { userId: data.receiverId },
        });
        if (!receiverWallet) {
            throw new error_middleware_1.AppError("Receiver not found", 404);
        }
        // Check fraud
        const fraudScore = await fraud_service_1.fraudService.calculateFraudScore({
            userId: data.senderId,
            amount: data.amount,
            type: "TRANSFER",
        });
        if (fraudScore > 0.8) {
            throw new error_middleware_1.AppError("Transaction flagged for review", 403);
        }
        // Execute transaction
        const transaction = await db_1.prisma.$transaction(async (tx) => {
            // Deduct from sender
            await tx.wallet.update({
                where: { userId: data.senderId },
                data: { balance: { decrement: data.amount } },
            });
            // Add to receiver
            await tx.wallet.update({
                where: { userId: data.receiverId },
                data: { balance: { increment: data.amount } },
            });
            // Create transaction record
            return tx.transaction.create({
                data: {
                    amount: new library_1.Decimal(data.amount),
                    type: client_1.TransactionType.TRANSFER,
                    status: client_1.TransactionStatus.COMPLETED,
                    description: data.description || "Transfer",
                    reference: (0, helpers_1.generateReference)(),
                    senderId: data.senderId,
                    receiverId: data.receiverId,
                    fraudScore,
                    isFlagged: fraudScore > 0.5,
                },
                include: {
                    sender: { select: { name: true, email: true } },
                    receiver: { select: { name: true, email: true } },
                },
            });
        });
        return {
            id: transaction.id,
            reference: transaction.reference,
            amount: Number(transaction.amount),
            status: transaction.status,
            receiver: transaction.receiver?.name,
            createdAt: transaction.createdAt,
        };
    }
    async payMerchant(data) {
        // Find merchant by code
        const merchant = await db_1.prisma.user.findUnique({
            where: { merchantCode: data.merchantCode },
            include: { wallet: true },
        });
        if (!merchant || merchant.role !== "MERCHANT") {
            throw new error_middleware_1.AppError("Merchant not found", 404);
        }
        return this.transfer({
            senderId: data.senderId,
            receiverId: merchant.id,
            amount: data.amount,
            pin: data.pin,
            description: `Payment to ${merchant.merchantName}`,
        });
    }
    async getTransaction(transactionId, userId) {
        const transaction = await db_1.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: {
                sender: { select: { name: true, email: true } },
                receiver: { select: { name: true, email: true } },
            },
        });
        if (!transaction) {
            throw new error_middleware_1.AppError("Transaction not found", 404);
        }
        if (transaction.senderId !== userId && transaction.receiverId !== userId) {
            throw new error_middleware_1.AppError("Access denied", 403);
        }
        return {
            id: transaction.id,
            reference: transaction.reference,
            amount: Number(transaction.amount),
            type: transaction.type,
            status: transaction.status,
            description: transaction.description,
            sender: transaction.sender,
            receiver: transaction.receiver,
            createdAt: transaction.createdAt,
        };
    }
    async getTransactionHistory(userId, options) {
        const { page = 1, limit = 20, type } = options;
        const skip = (page - 1) * limit;
        const where = {
            OR: [{ senderId: userId }, { receiverId: userId }],
            ...(type && { type }),
        };
        const [transactions, total] = await Promise.all([
            db_1.prisma.transaction.findMany({
                where,
                include: {
                    sender: { select: { name: true } },
                    receiver: { select: { name: true, merchantName: true } },
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            db_1.prisma.transaction.count({ where }),
        ]);
        return {
            data: transactions.map((t) => ({
                id: t.id,
                reference: t.reference,
                amount: Number(t.amount),
                type: t.type,
                status: t.status,
                description: t.description,
                isCredit: t.receiverId === userId,
                counterparty: t.senderId === userId
                    ? t.receiver?.merchantName || t.receiver?.name
                    : t.sender?.name,
                createdAt: t.createdAt,
            })),
            pagination: (0, helpers_1.calculatePagination)(page, limit, total),
        };
    }
}
exports.TransactionService = TransactionService;
exports.transactionService = new TransactionService();
//# sourceMappingURL=transaction.service.js.map