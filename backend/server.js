const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration - Allow all origins for development
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  console.log(`📨 ${req.method} ${req.path} - ${timestamp} - IP: ${req.ip}`);
  next();
});

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/students', require('./src/routes/studentRoutes'));
app.use('/api/merchants', require('./src/routes/merchantRoutes'));
app.use('/api/transactions', require('./src/routes/transactionRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'VertoPay API',
    version: '1.0.0',
    status: 'running',
    serverIP: '192.168.0.101',
    timestamp: new Date().toISOString()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'VertoPay Backend Running',
    serverIP: '192.168.0.101',
    clientIP: req.ip,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Start server only when run directly (not when required by tests)
if (require.main === module) {
  connectDB()
    .then(() => {
      app.listen(PORT, HOST, () => {
        console.log('\n🚀 ============================================');
        console.log('🚀 VertoPay Backend Server Started!');
        console.log('🚀 ============================================');
        console.log(`📍 Local:     http://localhost:${PORT}`);
        console.log(`📍 Network:   http://192.168.0.101:${PORT}`);
        console.log(`📍 Health:    http://192.168.0.101:${PORT}/api/health`);
        console.log('🚀 ============================================');
        console.log('✅ Server is ready to accept connections');
        console.log(`⏰ Started at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        console.log('🚀 ============================================\n');
      });
    })
    .catch((error) => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Shutting down server gracefully...');
  process.exit(0);
});

module.exports = app;
