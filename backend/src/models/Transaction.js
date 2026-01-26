const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  qrNonce: {
    type: String,
    required: true,
    unique: true
  },
  qrTimestamp: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed'
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ student: 1, createdAt: -1 });
transactionSchema.index({ merchant: 1, createdAt: -1 });
transactionSchema.index({ qrNonce: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
