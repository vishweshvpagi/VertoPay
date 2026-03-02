const Student = require("../models/Student");
const Merchant = require("../models/Merchant");
const Admin = require("../models/Admin");
const cryptoService = require("../services/cryptoService");
const { generateToken, generateId } = require("../utils/helpers");

// ── POST /api/auth/register/student ──────────────────────────────────────────
const registerStudent = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name?.trim() || !email?.trim() || !password || !phone?.trim()) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await Student.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const { publicKey, privateKey } = cryptoService.generateKeyPair();
    const studentId = generateId("STU");

    const student = await Student.create({
      studentId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      publicKey,
      privateKey,
      balance: 500, // welcome bonus
    });

    const token = generateToken(student._id, "student");

    res.status(201).json({
      message: "Student registered successfully",
      token,
      user: student, // toJSON() strips password + privateKey
    });
  } catch (error) {
    console.error("Register student error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/auth/register/merchant ─────────────────────────────────────────
const registerMerchant = async (req, res) => {
  try {
    const {
      shopName,
      ownerName,
      email,
      password,
      phone,
      category,
      merchantId: reqMerchantId,
    } = req.body;

    if (
      !shopName?.trim() ||
      !ownerName?.trim() ||
      !email?.trim() ||
      !password ||
      !phone?.trim()
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existing = await Merchant.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const merchantId =
      reqMerchantId?.trim() || category?.trim() || generateId("MER");

    const existingId = await Merchant.findOne({ merchantId });
    if (existingId) {
      return res
        .status(400)
        .json({ message: `Merchant ID '${merchantId}' is already taken` });
    }

    const merchant = await Merchant.create({
      merchantId,
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      category: category?.trim() || "other",
    });

    const token = generateToken(merchant._id, "merchant");

    res.status(201).json({
      message: "Merchant registered successfully",
      token,
      user: merchant,
    });
  } catch (error) {
    console.error("Register merchant error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/auth/register/admin ─────────────────────────────────────────────
const registerAdmin = async (req, res) => {
  try {
    // ✅ Only allow if no admin exists yet (first-time setup guard)
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res
        .status(403)
        .json({ message: "Admin registration is disabled. Use seed script." });
    }

    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await Admin.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = generateToken(admin._id, "admin");

    res.status(201).json({
      message: "Admin registered successfully",
      token,
      user: admin,
    });
  } catch (error) {
    console.error("Register admin error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email?.trim() || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const emailLower = email.toLowerCase().trim();
    let user = null;
    let userRole = role;

    if (userRole === "student") {
      user = await Student.findOne({ email: emailLower });
    } else if (userRole === "merchant") {
      user = await Merchant.findOne({ email: emailLower });
    } else if (userRole === "admin") {
      user = await Admin.findOne({ email: emailLower });
    } else {
      // Auto-detect — check all collections
      user = await Student.findOne({ email: emailLower });
      if (user) {
        userRole = "student";
      }

      if (!user) {
        user = await Merchant.findOne({ email: emailLower });
        if (user) userRole = "merchant";
      }
      if (!user) {
        user = await Admin.findOne({ email: emailLower });
        if (user) userRole = "admin";
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.isActive === false) {
      return res
        .status(403)
        .json({ message: "Account is deactivated. Contact admin." });
    }

    const token = generateToken(user._id, userRole);

    console.log(`✅ Login: [${userRole}] ${user.email}`);

    res.json({ message: "Login successful", token, user });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    let freshUser;
    if (req.user.role === "student") {
      freshUser = await Student.findById(req.user._id).select(
        "-password -privateKey",
      );
    } else if (req.user.role === "merchant") {
      freshUser = await Merchant.findById(req.user._id).select("-password");
    } else if (req.user.role === "admin") {
      freshUser = await Admin.findById(req.user._id).select("-password");
    }

    if (!freshUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user: freshUser });
  } catch (error) {
    console.error("GetMe error:", error);
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
