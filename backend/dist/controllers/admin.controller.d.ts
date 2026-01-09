import { Response, NextFunction } from "express";
import { AuthRequest } from "../types";
export declare class AdminController {
    getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    toggleUserStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getAllTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getFlaggedTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    reviewFlaggedTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getAuditLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const adminController: AdminController;
//# sourceMappingURL=admin.controller.d.ts.map