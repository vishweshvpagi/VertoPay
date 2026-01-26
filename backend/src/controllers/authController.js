const Student = require('../models/Student');
const Merchant = require('../models/Merchant');
const Admin = require('../models/Admin');
const cryptoService = require('../services/cryptoService');
const { generateToken, generateId } = require('../utils/helpers');

// Student Registration
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists with this email' });
    }

    // Generate RSA key pair
    const { publicKey, privateKey } = cryptoService.generateKeyPair();

    // Generate student ID
    const studentId = generateId('STU');

    const student = await Student.create({
      studentId,
      name,
      email,
      password,
      phone,
      publicKey,
      privateKey,
      balance: 500 // Initial balance for demo
    });

    const token = generateToken(student._id, 'student');

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      user: student
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Merchant Registration
const registerMerchant = async (req, res) => {
  try {
    const { shopName, ownerName, email, password, phone, category } = req.body;

    const existingMerchant = await Merchant.findOne({ email });
    if (existingMerchant) {
      return res.status(400).json({ message: 'Merchant already exists with this email' });
    }

    // Generate merchant ID
    const merchantId = generateId('MER');

    const merchant = await Merchant.create({
      merchantId,
      shopName,
      ownerName,
      email,
      password,
      phone,
      category
    });

    const token = generateToken(merchant._id, 'merchant');

    res.status(201).json({
      message: 'Merchant registered successfully',
      token,
      user: merchant
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Registration (for demo - in production, create via database)
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists with this email' });
    }

    const admin = await Admin.create({
      name,
      email,
      password
    });

    const token = generateToken(admin._id, 'admin');

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: admin
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login (works for all user types)
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    let user;
    if (role === 'student') {
      user = await Student.findOne({ email });
    } else if (role === 'merchant') {
      user = await Merchant.findOne({ email });
    } else if (role === 'admin') {
      user = await Admin.findOne({ email });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    const token = generateToken(user._id, role);

    res.json({
      message: 'Login successful',
      token,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerStudent,
  registerMerchant,
  registerAdmin,
  login,
  getMe
};
