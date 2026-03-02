const crypto = require("crypto");
const Student = require("../models/Student");
const Merchant = require("../models/Merchant");
const Transaction = require("../models/Transaction");
const RechargeRequest = require("../models/RechargeRequest");
const WithdrawalRequest = require("../models/WithdrawalRequest");

// ── GET /api/admin/dashboard ──────────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalStudents,
      totalMerchants,
      totalTransactions,
      pendingRecharges,
      pendingWithdrawals,
      revenueAgg,
      todayAgg,
    ] = await Promise.all([
      Student.countDocuments(),
      Merchant.countDocuments(),
      Transaction.countDocuments(),
      RechargeRequest.countDocuments({ status: "pending" }),
      WithdrawalRequest.countDocuments({ status: "pending" }),
      Transaction.aggregate([
        { $match: { status: "completed", type: "payment" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            status: "completed",
            type: "payment",
            createdAt: { $gte: todayStart },
          },
        },
        {
          $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } },
        },
      ]),
    ]);

    res.json({
      totalStudents,
      totalMerchants,
      totalTransactions,
      pendingRecharges,
      pendingWithdrawals,
      totalRevenue: revenueAgg[0]?.total ?? 0,
      todayRevenue: todayAgg[0]?.total ?? 0,
      todayTransactions: todayAgg[0]?.count ?? 0,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/admin/students ───────────────────────────────────────────────────
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .select("-password -privateKey")
      .sort({ createdAt: -1 });
    res.json({ students });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/admin/merchants ──────────────────────────────────────────────────
const getAllMerchants = async (req, res) => {
  try {
    const merchants = await Merchant.find()
      .select("-password")
      .sort({ createdAt: -1 });
    res.json({ merchants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/admin/transactions ───────────────────────────────────────────────
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("student", "name studentId email")
      .populate("merchant", "shopName merchantId")
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/admin/recharge-requests ─────────────────────────────────────────
const getRechargeRequests = async (req, res) => {
  try {
    const status = req.query.status || "pending";
    const requests = await RechargeRequest.find({ status })
      .populate("student", "name studentId email balance")
      .sort({ createdAt: -1 });
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/admin/recharge-requests/:requestId/approve ─────────────────────
const approveRecharge = async (req, res) => {
  try {
    const request = await RechargeRequest.findOne({
      requestId: req.params.requestId,
    });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Request is already ${request.status}` });
    }

    const student = await Student.findByIdAndUpdate(
      request.student,
      { $inc: { balance: request.amount } },
      { new: true },
    );
    if (!student) return res.status(404).json({ message: "Student not found" });

    await Transaction.create({
      transactionId: `RCH_${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      student: request.student,
      merchant: null,
      amount: request.amount,
      type: "recharge",
      qrNonce: `APPROVED_${request.requestId}_${Date.now()}`,
      qrTimestamp: new Date(),
      status: "completed",
      description: "Wallet recharge approved by admin",
    });

    request.status = "approved";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    console.log(
      `✅ Recharge approved: ₹${request.amount} → ${student.name} | Balance: ₹${student.balance}`,
    );

    res.json({
      message: "Recharge approved and balance credited",
      newBalance: student.balance,
      request,
    });
  } catch (error) {
    console.error("Approve recharge error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/admin/recharge-requests/:requestId/reject ──────────────────────
const rejectRecharge = async (req, res) => {
  try {
    const request = await RechargeRequest.findOne({
      requestId: req.params.requestId,
    });
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.status !== "pending") {
      return res
        .status(400)
        .json({ message: `Request is already ${request.status}` });
    }

    request.status = "rejected";
    request.note = req.body.note?.trim() || "Rejected by admin";
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ message: "Recharge request rejected", request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/admin/top-up ────────────────────────────────────────────────────
const topUpStudent = async (req, res) => {
  try {
    const { studentId, amount } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!studentId?.trim() || !parsedAmount || parsedAmount <= 0) {
      return res
        .status(400)
        .json({ message: "Valid Student ID and amount required" });
    }

    const student = await Student.findOneAndUpdate(
      { studentId: studentId.trim() },
      { $inc: { balance: parsedAmount } },
      { new: true },
    );
    if (!student)
      return res
        .status(404)
        .json({ message: `Student '${studentId}' not found` });

    await Transaction.create({
      transactionId: `TOPUP_${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      student: student._id,
      merchant: null,
      amount: parsedAmount,
      type: "recharge",
      qrNonce: `TOPUP_${studentId}_${Date.now()}`,
      qrTimestamp: new Date(),
      status: "completed",
      description: `Admin manual top-up of ₹${parsedAmount}`,
    });

    console.log(
      `✅ Top-up: ₹${parsedAmount} → ${student.name} | Balance: ₹${student.balance}`,
    );

    res.json({
      message: "Top-up successful",
      studentId: student.studentId,
      newBalance: student.balance,
    });
  } catch (error) {
    console.error("Top-up error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── PATCH /api/admin/students/:studentId/toggle ───────────────────────────────
const toggleStudentStatus = async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.studentId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    student.isActive = !student.isActive;
    await student.save();

    console.log(
      `✅ Student ${student.isActive ? "activated" : "deactivated"}: ${student.email}`,
    );
    res.json({
      message: `Student ${student.isActive ? "activated" : "deactivated"}`,
      student,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PATCH /api/admin/merchants/:merchantId/toggle ─────────────────────────────
const toggleMerchantStatus = async (req, res) => {
  try {
    const merchant = await Merchant.findOne({
      merchantId: req.params.merchantId,
    });
    if (!merchant)
      return res.status(404).json({ message: "Merchant not found" });

    merchant.isActive = !merchant.isActive;
    await merchant.save();

    console.log(
      `✅ Merchant ${merchant.isActive ? "activated" : "deactivated"}: ${merchant.email}`,
    );
    res.json({
      message: `Merchant ${merchant.isActive ? "activated" : "deactivated"}`,
      merchant,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllStudents,
  getAllMerchants,
  getAllTransactions,
  getRechargeRequests,
  approveRecharge,
  rejectRecharge,
  topUpStudent,
  toggleStudentStatus,
  toggleMerchantStatus,
};
