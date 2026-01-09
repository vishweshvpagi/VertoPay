"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.merchantController = exports.MerchantController = void 0;
const db_1 = require("../config/db");
const transaction_service_1 = require("../services/transaction.service");
class MerchantController {
    async getStats(req, res, next) {
        try {
            const merchantId = req.user.userId;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const [todayStats, monthlyStats, recentTransactions] = await Promise.all([
                db_1.prisma.transaction.aggregate({
                    where: {
                        receiverId: merchantId,
                        status: "COMPLETED",
                        createdAt: { gte: today },
                    },
                    _sum: { amount: true },
                    _count: true,
                }),
                db_1.prisma.transaction.aggregate({
                    where: {
                        receiverId: merchantId,
                        status: "COMPLETED",
                        createdAt: {
                            gte: new Date(today.getFullYear(), today.getMonth(), 1),
                        },
                    },
                    _sum: { amount: true },
                    _count: true,
                }),
                db_1.prisma.transaction.findMany({
                    where: { receiverId: merchantId },
                    include: { sender: { select: { name: true } } },
                    orderBy: { createdAt: "desc" },
                    take: 10,
                }),
            ]);
            res.json({
                success: true,
                data: {
                    today: {
                        amount: Number(todayStats._sum.amount || 0),
                        count: todayStats._count,
                    },
                    month: {
                        amount: Number(monthlyStats._sum.amount || 0),
                        count: monthlyStats._count,
                    },
                    recentTransactions: recentTransactions.map((t) => ({
                        id: t.id,
                        amount: Number(t.amount),
                        sender: t.sender?.name,
                        createdAt: t.createdAt,
                    })),
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getTransactions(req, res, next) {
        try {
            const result = await transaction_service_1.transactionService.getTransactionHistory(req.user.userId, {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
            });
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MerchantController = MerchantController;
exports.merchantController = new MerchantController();
//# sourceMappingURL=merchant.controller.js.map