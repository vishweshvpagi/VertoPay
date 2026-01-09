import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/db';

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    
    // Start server
    const server = app.listen(env.port, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║     🚀 Campus Pay Backend Started         ║
╠═══════════════════════════════════════════╣
║  Environment: ${env.nodeEnv.padEnd(26)}║
║  Port: ${env.port.toString().padEnd(33)}║
║  URL: http://localhost:${env.port.toString().padEnd(18)}║
╚═══════════════════════════════════════════╝
      `);
    });
    
    // Graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down gracefully...');
      server.close(async () => {
        await disconnectDatabase();
        console.log('👋 Server closed');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();