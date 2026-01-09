import { Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { AuthRequest } from "../types";
import { transactionService } from "../services/transaction.service";

export class MerchantController {
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const merchantId = req.user!.userId;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayStats, monthlyStats, recentTransactions] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            receiverId: merchantId,
            status: "COMPLETED",
            createdAt: { gte: today },
          },
          _sum: { amount: true },
          _count: true,
        }),
        prisma.transaction.aggregate({
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
        prisma.transaction.findMany({
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
          recentTransactions: recentTransactions.map((t: any) => ({
            id: t.id,
            amount: Number(t.amount),
            sender: t.sender?.name,
            createdAt: t.createdAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.getTransactionHistory(
        req.user!.userId,
        {
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 20,
        }
      );
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const merchantController = new MerchantController();
