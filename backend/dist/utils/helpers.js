"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReference = generateReference;
exports.generateMerchantCode = generateMerchantCode;
exports.formatCurrency = formatCurrency;
exports.calculatePagination = calculatePagination;
const uuid_1 = require("uuid");
function generateReference() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = (0, uuid_1.v4)().split('-')[0].toUpperCase();
    return `TXN-${timestamp}-${random}`;
}
function generateMerchantCode() {
    const random = (0, uuid_1.v4)().split('-')[0].toUpperCase();
    return `MER-${random}`;
}
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
    }).format(amount);
}
function calculatePagination(page, limit, total) {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
}
//# sourceMappingURL=helpers.js.map