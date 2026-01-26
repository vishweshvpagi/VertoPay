const Student = require('../models/Student');
const Merchant = require('../models/Merchant');
const Transaction = require('../models/Transaction');

// Get all students
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('-password -privateKey').sort({ createdAt: -1 });
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all merchants
const getAllMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.find().select('-password').sort({ createdAt: -1 });
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

    if (!studentId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid student ID or amount' });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.balance += parseFloat(amount);
    await student.save();

    res.json({
      message: 'Balance topped up successfully',
      studentId: student.studentId,
      newBalance: student.balance
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
      student
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
      merchant
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const totalMerchants = await Merchant.countDocuments();
    const totalTransactions = await Transaction.countDocuments();
    
    const transactions = await Transaction.find({ status: 'completed' });
    const totalRevenue = transactions.reduce((sum, txn) => sum + txn.amount, 0);

    res.json({
      totalStudents,
      totalMerchants,
      totalTransactions,
      totalRevenue
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
  getDashboardStats
};
