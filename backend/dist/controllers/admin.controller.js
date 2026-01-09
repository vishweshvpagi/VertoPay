"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const db_1 = require("../config/db");
const fraud_service_1 = require("../services/fraud.service");
const helpers_1 = require("../utils/helpers");
class AdminController {
    async getDashboard(req, res, next) {
        try {
            const [userCount, merchantCount, totalTransactions, flaggedCount] = await Promise.all([
                db_1.prisma.user.count({ where: { role: "STUDENT" } }),
                db_1.prisma.user.count({ where: { role: "MERCHANT" } }),
                db_1.prisma.transaction.aggregate({
                    where: { status: "COMPLETED" },
                    _sum: { amount: true },
                    _count: true,
                }),
                db_1.prisma.transaction.count({ where: { isFlagged: true } }),
            ]);
            res.json({
                success: true,
                data: {
                    users: {
                        students: userCount,
                        merchants: merchantCount,
                    },
                    transactions: {
                        count: totalTransactions._count,
                        volume: Number(totalTransactions._sum.amount || 0),
                    },
                    flaggedTransactions: flaggedCount,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getUsers(req, res, next) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const role = req.query.role;
            const where = role ? { role: role } : {};
            const [users, total] = await Promise.all([
                db_1.prisma.user.findMany({
                    where,
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        role: true,
                        isActive: true,
                        createdAt: true,
                        wallet: { select: { balance: true } },
                    },
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                }),
                db_1.prisma.user.count({ where }),
            ]);
            res.json({
                success: true,
                data: users.map((u) => ({
                    ...u,
                    wallet: u.wallet ? { balance: Number(u.wallet.balance) } : null,
                })),
                pagination: (0, helpers_1.calculatePagination)(page, limit, total),
            });
        }
        catch (error) {
            next(error);
        }
    }
    async toggleUserStatus(req, res, next) {
        try {
            const user = await db_1.prisma.user.update({
                where: { id: req.params.id },
                data: { isActive: req.body.isActive },
            });
            res.json({
                success: true,
                message: `User ${user.isActive ? "activated" : "deactivated"}`,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAllTransactions(req, res, next) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 20;
            const [transactions, total] = await Promise.all([
                db_1.prisma.transaction.findMany({
                    include: {
                        sender: { select: { name: true, email: true } },
                        receiver: { select: { name: true, email: true } },
                    },
                    orderBy: { createdAt: "desc" },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                db_1.prisma.transaction.count(),
            ]);
            res.json({
                success: true,
                data: transactions.map((t) => ({
                    id: t.id,
                    reference: t.reference,
                    amount: Number(t.amount),
                    type: t.type,
                    status: t.status,
                    sender: t.sender,
                    receiver: t.receiver,
                    isFlagged: t.isFlagged,
                    fraudScore: t.fraudScore,
                    createdAt: t.createdAt,
                })),
                pagination: (0, helpers_1.calculatePagination)(page, limit, total),
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getFlaggedTransactions(req, res, next) {
        try {
            const result = await fraud_service_1.fraudService.getFlaggedTransactions(Number(req.query.page) || 1, Number(req.query.limit) || 20);
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async reviewFlaggedTransaction(req, res, next) {
        try {
            await fraud_service_1.fraudService.reviewTransaction(req.params.id, req.body.approved);
            res.json({
                success: true,
                message: "Transaction reviewed",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getAuditLogs(req, res, next) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 50;
            const [logs, total] = await Promise.all([
                db_1.prisma.auditLog.findMany({
                    include: { user: { select: { name: true, email: true } } },
                    orderBy: { createdAt: "desc" },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                db_1.prisma.auditLog.count(),
            ]);
            res.json({
                success: true,
                data: logs,
                pagination: (0, helpers_1.calculatePagination)(page, limit, total),
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
//# sourceMappingURL=admin.controller.js.map