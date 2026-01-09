import { Response, NextFunction } from 'express';
import { walletService } from '../services/wallet.service';
import { AuthRequest } from '../types';

export class WalletController {
  async getWallet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const wallet = await walletService.getWallet(req.user!.userId);
      res.json({
        success: true,
        data: wallet,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async setPin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await walletService.setPin(req.user!.userId, req.body.pin);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async topUp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await walletService.topUp(
        req.user!.userId,
        req.body.amount,
        req.body.pin
      );
      res.json({
        success: true,
        message: result.message,
        data: { balance: result.balance },
      });
    } catch (error) {
      next(error);
    }
  }
  
  async lockWallet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await walletService.lockWallet(req.user!.userId);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async unlockWallet(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await walletService.unlockWallet(req.user!.userId, req.body.pin);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const walletController = new WalletController();