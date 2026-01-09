"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fraudService = exports.FraudService = void 0;
const db_1 = require("../config/db");
class FraudService {
    async calculateFraudScore(data) {
        let score = 0;
        // Check daily transaction count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dailyTransactions = await db_1.prisma.transaction.count({
            where: {
                senderId: data.userId,
                createdAt: { gte: today },
            },
        });
        if (dailyTransactions > 20)
            score += 0.3;
        // Check large transaction
        if (data.amount > 5000)
            score += 0.2;
        // Check rapid transactions (last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentTransactions = await db_1.prisma.transaction.count({
            where: {
                senderId: data.userId,
                createdAt: { gte: fiveMinutesAgo },
            },
        });
        if (recentTransactions > 5)
            score += 0.4;
        // Check if user has flagged transactions
        const flaggedCount = await db_1.prisma.transaction.count({
            where: {
                senderId: data.userId,
                isFlagged: true,
            },
        });
        if (flaggedCount > 3)
            score += 0.3;
        return Math.min(score, 1);
    }
    async getFlaggedTransactions(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [transactions, total] = await Promise.all([
            db_1.prisma.transaction.findMany({
                where: { isFlagged: true },
                include: {
                    sender: { select: { name: true, email: true } },
                    receiver: { select: { name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            db_1.prisma.transaction.count({ where: { isFlagged: true } }),
        ]);
        return {
            data: transactions,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async reviewTransaction(transactionId, approved) {
        const transaction = await db_1.prisma.transaction.update({
            where: { id: transactionId },
            data: {
                isFlagged: !approved,
                status: approved ? 'COMPLETED' : 'CANCELLED',
            },
        });
        return transaction;
    }
}
exports.FraudService = FraudService;
exports.fraudService = new FraudService();
//# sourceMappingURL=fraud.service.js.map