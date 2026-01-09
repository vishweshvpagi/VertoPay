"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletController = exports.WalletController = void 0;
const wallet_service_1 = require("../services/wallet.service");
class WalletController {
    async getWallet(req, res, next) {
        try {
            const wallet = await wallet_service_1.walletService.getWallet(req.user.userId);
            res.json({
                success: true,
                data: wallet,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async setPin(req, res, next) {
        try {
            const result = await wallet_service_1.walletService.setPin(req.user.userId, req.body.pin);
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async topUp(req, res, next) {
        try {
            const result = await wallet_service_1.walletService.topUp(req.user.userId, req.body.amount, req.body.pin);
            res.json({
                success: true,
                message: result.message,
                data: { balance: result.balance },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async lockWallet(req, res, next) {
        try {
            const result = await wallet_service_1.walletService.lockWallet(req.user.userId);
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async unlockWallet(req, res, next) {
        try {
            const result = await wallet_service_1.walletService.unlockWallet(req.user.userId, req.body.pin);
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.WalletController = WalletController;
exports.walletController = new WalletController();
//# sourceMappingURL=wallet.controller.js.map