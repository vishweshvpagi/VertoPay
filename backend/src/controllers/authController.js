const Student = require('../models/Student');
const Merchant = require('../models/Merchant');
const Admin = require('../models/Admin');
const cryptoService = require('../services/cryptoService');
const { generateToken, generateId } = require('../utils/helpers');

// ─────────────────────────────────────────────
// POST /api/auth/register/student
// ─────────────────────────────────────────────
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingStudent = await Student.findOne({ email: email.toLowerCase() });
    if (existingStudent) {
      return res.status(400).json({ message: 'Student already exists with this email' });
    }

    const { publicKey, privateKey } = cryptoService.generateKeyPair();
    const studentId = generateId('STU');

    const student = await Student.create({
      studentId,
      name,
      email:      email.toLowerCase(),
      password,
      phone,
      publicKey,
      privateKey,
      balance:    500,   // ✅ welcome bonus
    });

    const token = generateToken(student._id, 'student');

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      user:    student,   // toJSON() strips password + privateKey automatically
    });
  } catch (error) {
    console.error('Register student error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/register/merchant
// ─────────────────────────────────────────────
const registerMerchant = async (req, res) => {
  try {
    const {
      shopName,
      ownerName,
      email,
      password,
      phone,
      category,
      merchantId: frontendMerchantId,
    } = req.body;

    if (!shopName || !ownerName || !email || !password || !phone) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingMerchant = await Merchant.findOne({ email: email.toLowerCase() });
    if (existingMerchant) {
      return res.status(400).json({ message: 'Merchant already exists with this email' });
    }

    // ✅ Use merchantId from frontend (e.g. "CAFE_02") or auto-generate
    const merchantId = frontendMerchantId || category || generateId('MER');

    // Guard against duplicate merchantId
    const existingId = await Merchant.findOne({ merchantId });
    if (existingId) {
      return res.status(400).json({ message: `Merchant ID '${merchantId}' is already taken` });
    }

    const merchant = await Merchant.create({
      merchantId,
      shopName,
      ownerName,
      email:    email.toLowerCase(),
      password,
      phone,
      category,
    });

    const token = generateToken(merchant._id, 'merchant');

    res.status(201).json({
      message: 'Merchant registered successfully',
      token,
      user:    merchant,
    });
  } catch (error) {
    console.error('Register merchant error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/register/admin
// ─────────────────────────────────────────────
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin already exists with this email' });
    }

    const admin = await Admin.create({
      name,
      email:    email.toLowerCase(),
      password,
    });

    const token = generateToken(admin._id, 'admin');

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user:    admin,
    });
  } catch (error) {
    console.error('Register admin error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user = null;
    let userRole = role;

    if (userRole === 'student') {
      user = await Student.findOne({ email: email.toLowerCase() });
    } else if (userRole === 'merchant') {
      user = await Merchant.findOne({ email: email.toLowerCase() });
    } else if (userRole === 'admin') {
      user = await Admin.findOne({ email: email.toLowerCase() });
    } else {
      // Auto-detect role if not provided
      user = await Student.findOne({ email: email.toLowerCase() });
      userRole = 'student';

      if (!user) {
        user = await Merchant.findOne({ email: email.toLowerCase() });
        userRole = 'merchant';
      }
      if (!user) {
        user = await Admin.findOne({ email: email.toLowerCase() });
        userRole = 'admin';
      }
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated. Contact admin.' });
    }

    const token = generateToken(user._id, userRole);

    console.log(`✅ Login: ${userRole} ${user.email}`);

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/auth/me
// Returns full user doc including balance
// ─────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    // ✅ Re-fetch to always return the LATEST balance (not stale JWT cache)
    let freshUser;
    if (req.user.role === 'student') {
      freshUser = await Student.findById(req.user._id).select('-password -privateKey');
    } else if (req.user.role === 'merchant') {
      freshUser = await Merchant.findById(req.user._id).select('-password');
    } else if (req.user.role === 'admin') {
      freshUser = await Admin.findById(req.user._id).select('-password');
    }

    if (!freshUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: freshUser });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerStudent,
  registerMerchant,
  registerAdmin,
  login,
  getMe,
};
