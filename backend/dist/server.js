"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const db_1 = require("./config/db");
async function startServer() {
    try {
        // Connect to database
        await (0, db_1.connectDatabase)();
        // Start server
        const server = app_1.default.listen(env_1.env.port, () => {
            console.log(`
╔═══════════════════════════════════════════╗
║     🚀 Campus Pay Backend Started         ║
╠═══════════════════════════════════════════╣
║  Environment: ${env_1.env.nodeEnv.padEnd(26)}║
║  Port: ${env_1.env.port.toString().padEnd(33)}║
║  URL: http://localhost:${env_1.env.port.toString().padEnd(18)}║
╚═══════════════════════════════════════════╝
      `);
        });
        // Graceful shutdown
        const shutdown = async () => {
            console.log('\n🛑 Shutting down gracefully...');
            server.close(async () => {
                await (0, db_1.disconnectDatabase)();
                console.log('👋 Server closed');
                process.exit(0);
            });
        };
        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=server.js.map