import { Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service';
import { AuthRequest } from '../types';

export class TransactionController {
  async transfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.transfer({
        senderId: req.user!.userId,
        receiverId: req.body.receiverId,
        amount: req.body.amount,
        pin: req.body.pin,
        description: req.body.description,
      });
      res.json({
        success: true,
        message: 'Transfer successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async payMerchant(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.payMerchant({
        senderId: req.user!.userId,
        merchantCode: req.body.merchantCode,
        amount: req.body.amount,
        pin: req.body.pin,
        description: req.body.description,
      });
      res.json({
        success: true,
        message: 'Payment successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getTransaction(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const transaction = await transactionService.getTransaction(
        req.params.id,
        req.user!.userId
      );
      res.json({
        success: true,
        data: transaction,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async getHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await transactionService.getTransactionHistory(
        req.user!.userId,
        {
          page: Number(req.query.page) || 1,
          limit: Number(req.query.limit) || 20,
          type: req.query.type as any,
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

export const transactionController = new TransactionController();