import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
export declare class AuthController {
    register(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    login(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map