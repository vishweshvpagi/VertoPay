import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
export declare class MerchantController {
    getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const merchantController: MerchantController;
//# sourceMappingURL=merchant.controller.d.ts.map