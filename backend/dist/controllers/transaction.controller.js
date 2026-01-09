"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionController = exports.TransactionController = void 0;
const transaction_service_1 = require("../services/transaction.service");
class TransactionController {
    async transfer(req, res, next) {
        try {
            const result = await transaction_service_1.transactionService.transfer({
                senderId: req.user.userId,
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
        }
        catch (error) {
            next(error);
        }
    }
    async payMerchant(req, res, next) {
        try {
            const result = await transaction_service_1.transactionService.payMerchant({
                senderId: req.user.userId,
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
        }
        catch (error) {
            next(error);
        }
    }
    async getTransaction(req, res, next) {
        try {
            const transaction = await transaction_service_1.transactionService.getTransaction(req.params.id, req.user.userId);
            res.json({
                success: true,
                data: transaction,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getHistory(req, res, next) {
        try {
            const result = await transaction_service_1.transactionService.getTransactionHistory(req.user.userId, {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 20,
                type: req.query.type,
            });
            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TransactionController = TransactionController;
exports.transactionController = new TransactionController();
//# sourceMappingURL=transaction.controller.js.map