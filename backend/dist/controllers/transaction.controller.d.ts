import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare class TransactionController {
    transfer(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    payMerchant(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const transactionController: TransactionController;
//# sourceMappingURL=transaction.controller.d.ts.map