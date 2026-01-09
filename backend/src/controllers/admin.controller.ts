import { Response, NextFunction } from "express";
import { prisma } from "../config/db";
import { AuthRequest } from "../types";
import { fraudService } from "../services/fraud.service";
import { calculatePagination } from "../utils/helpers";

export class AdminController {
  async getDashboard(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [userCount, merchantCount, totalTransactions, flaggedCount] =
        await Promise.all([
          prisma.user.count({ where: { role: "STUDENT" } }),
          prisma.user.count({ where: { role: "MERCHANT" } }),
          prisma.transaction.aggregate({
            where: { status: "COMPLETED" },
            _sum: { amount: true },
            _count: true,
          }),
          prisma.transaction.count({ where: { isFlagged: true } }),
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
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const role = req.query.role as string;

      const where = role ? { role: role as any } : {};

      const [users, total] = await Promise.all([
        prisma.user.findMany({
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
        prisma.user.count({ where }),
      ]);

      res.json({
        success: true,
        data: users.map((u: any) => ({
          ...u,
          wallet: u.wallet ? { balance: Number(u.wallet.balance) } : null,
        })),
        pagination: calculatePagination(page, limit, total),
      });
    } catch (error) {
      next(error);
    }
  }

  async toggleUserStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive: req.body.isActive },
      });

      res.json({
        success: true,
        message: `User ${user.isActive ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllTransactions(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          include: {
            sender: { select: { name: true, email: true } },
            receiver: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.transaction.count(),
      ]);

      res.json({
        success: true,
        data: transactions.map((t: any) => ({
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
        pagination: calculatePagination(page, limit, total),
      });
    } catch (error) {
      next(error);
    }
  }

  async getFlaggedTransactions(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await fraudService.getFlaggedTransactions(
        Number(req.query.page) || 1,
        Number(req.query.limit) || 20
      );
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async reviewFlaggedTransaction(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      await fraudService.reviewTransaction(req.params.id, req.body.approved);
      res.json({
        success: true,
        message: "Transaction reviewed",
      });
    } catch (error) {
      next(error);
    }
  }

  async getAuditLogs(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          include: { user: { select: { name: true, email: true } } },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.auditLog.count(),
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: calculatePagination(page, limit, total),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
