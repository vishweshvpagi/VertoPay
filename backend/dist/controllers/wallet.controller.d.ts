import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare class WalletController {
    getWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    setPin(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    topUp(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    lockWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    unlockWallet(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const walletController: WalletController;
//# sourceMappingURL=wallet.controller.d.ts.map