const Merchant = require('../models/Merchant');
const Transaction = require('../models/Transaction');

// Get merchant profile
const getProfile = async (req, res) => {
  try {
    res.json({ merchant: req.user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get merchant balance
const getBalance = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.user._id);
    res.json({ balance: merchant.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get merchant transaction history
const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ merchant: req.user._id })
      .populate('student', 'name studentId')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get today's sales
const getTodaySales = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transactions = await Transaction.find({
      merchant: req.user._id,
      createdAt: { $gte: today },
      status: 'completed'
    });

    const totalSales = transactions.reduce((sum, txn) => sum + txn.amount, 0);
    const totalTransactions = transactions.length;

    res.json({
      totalSales,
      totalTransactions,
      transactions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  getBalance,
  getTransactionHistory,
  getTodaySales
};
