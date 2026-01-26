const Student = require('../models/Student');
const Transaction = require('../models/Transaction');

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

module.exports = {
  getProfile,
  getBalance,
  getTransactionHistory
};
