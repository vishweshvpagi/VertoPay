const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/students', require('./src/routes/studentRoutes'));
app.use('/api/merchants', require('./src/routes/merchantRoutes'));
app.use('/api/transactions', require('./src/routes/transactionRoutes'));
app.use('/api/admin', require('./src/routes/adminRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'VertoPay Backend Running' });
});

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server only when run directly (not when required by tests)
if (require.main === module) {
  connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 VertoPay Backend running on port ${PORT}`);
  });
}

module.exports = app;
