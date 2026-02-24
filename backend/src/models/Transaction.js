const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: false,   // null for recharges if no merchant involved
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    required: false,   // ✅ null for wallet recharges
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  // ✅ ADDED: distinguishes payment vs recharge
  type: {
    type: String,
    enum: ['payment', 'recharge'],
    default: 'payment',
  },
  qrNonce: {
    type: String,
    required: true,
    unique: true,
  },
  qrTimestamp: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'completed',
  },
  description: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

transactionSchema.index({ student: 1, createdAt: -1 });
transactionSchema.index({ merchant: 1, createdAt: -1 });
transactionSchema.index({ qrNonce: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
