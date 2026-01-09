"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.validateRequest = validateRequest;
exports.notFound = notFound;
exports.errorHandler = errorHandler;
const express_validator_1 = require("express-validator");
const env_1 = require("../config/env");
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function validateRequest(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array(),
        });
        return;
    }
    next();
}
function notFound(req, res) {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
}
function errorHandler(err, req, res, _next) {
    console.error('Error:', err);
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        ...(env_1.env.nodeEnv === 'development' && { error: err.message }),
    });
}
//# sourceMappingURL=error.middleware.js.map