const Student = require('../models/Student');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

// Get student profile
const getProfile = async (req, res) => {
  try {
    res.json({ student: req.user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student balance
const getBalance = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id);
    res.json({ balance: student.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get student transaction history
const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ student: req.user._id })
      .populate('merchant', 'shopName category')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ NEW: Recharge wallet
const rechargeWallet = async (req, res) => {
  try {
    const { amount } = req.body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount. Must be a positive number.' });
    }

    if (amount > 10000) {
      return res.status(400).json({ message: 'Maximum recharge amount is ₹10,000.' });
    }

    // Find student and add balance atomically
    const student = await Student.findByIdAndUpdate(
      req.user._id,
      { $inc: { balance: amount } },
      { new: true }               // return updated doc
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // Record the transaction
    const transaction = await Transaction.create({
      transactionId: `RCH_${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
      student:       req.user._id,
      merchant:      null,          // no merchant for recharges
      amount,
      type:          'recharge',
      qrNonce:       `RECHARGE_${Date.now()}_${req.user._id}`,
      qrTimestamp:   new Date(),
      status:        'completed',
      description:   `Wallet recharge of ₹${amount}`,
    });

    res.status(201).json({
      message:     'Wallet recharged successfully',
      balance:     student.balance,
      transaction,
    });
  } catch (error) {
    console.error('Recharge error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  getBalance,
  getTransactionHistory,
  rechargeWallet,           // ✅ exported
};
