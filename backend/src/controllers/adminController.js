const Student = require('../models/Student');
const Merchant = require('../models/Merchant');
const Transaction = require('../models/Transaction');
const crypto = require('crypto');

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .select('-password -privateKey')
      .sort({ createdAt: -1 });
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all merchants
const getAllMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json({ merchants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('student', 'name studentId')
      .populate('merchant', 'shopName merchantId')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Top-up student balance
const topUpStudent = async (req, res) => {
  try {
    const { studentId, amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!studentId || !parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid student ID or amount' });
    }

    // ✅ Use findOneAndUpdate for atomicity
    const student = await Student.findOneAndUpdate(
      { studentId },
      { $inc: { balance: parsedAmount } },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // ✅ Record admin top-up as a recharge transaction
    await Transaction.create({
      transactionId: `ADMIN_${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
      student:       student._id,
      merchant:      null,
      amount:        parsedAmount,
      type:          'recharge',
      qrNonce:       `ADMIN_TOPUP_${Date.now()}_${student._id}`,
      qrTimestamp:   new Date(),
      status:        'completed',
      description:   `Admin top-up of ₹${parsedAmount}`,
    });

    res.json({
      message:    'Balance topped up successfully',
      studentId:  student.studentId,
      newBalance: student.balance,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle student status
const toggleStudentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findOne({ studentId });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.isActive = !student.isActive;
    await student.save();

    res.json({
      message: `Student ${student.isActive ? 'activated' : 'deactivated'} successfully`,
      student,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle merchant status
const toggleMerchantStatus = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const merchant = await Merchant.findOne({ merchantId });

    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    merchant.isActive = !merchant.isActive;
    await merchant.save();

    res.json({
      message: `Merchant ${merchant.isActive ? 'activated' : 'deactivated'} successfully`,
      merchant,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const [totalStudents, totalMerchants, totalTransactions] = await Promise.all([
      Student.countDocuments(),
      Merchant.countDocuments(),
      Transaction.countDocuments(),
    ]);

    // ✅ Only sum payment transactions for revenue (not recharges)
    const revenueAgg = await Transaction.aggregate([
      { $match: { status: 'completed', type: 'payment' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total ?? 0;

    // ✅ Today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayAgg = await Transaction.aggregate([
      { $match: { status: 'completed', type: 'payment', createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const todayRevenue      = todayAgg[0]?.total ?? 0;
    const todayTransactions = todayAgg[0]?.count ?? 0;

    res.json({
      totalStudents,
      totalMerchants,
      totalTransactions,
      totalRevenue,
      todayRevenue,
      todayTransactions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllStudents,
  getAllMerchants,
  getAllTransactions,
  topUpStudent,
  toggleStudentStatus,
  toggleMerchantStatus,
  getDashboardStats,
};
