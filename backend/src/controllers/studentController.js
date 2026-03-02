const crypto = require("crypto");
const Student = require("../models/Student");
const Transaction = require("../models/Transaction");
const RechargeRequest = require("../models/RechargeRequest");

const getProfile = async (req, res) => {
  try {
    res.json({ student: req.user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBalance = async (req, res) => {
  try {
    const student = await Student.findById(req.user._id).select("balance");
    res.json({ balance: student.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({ student: req.user._id })
      .populate("merchant", "shopName merchantId category")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const rechargeWallet = async (req, res) => {
  try {
    const parsedAmount = parseFloat(req.body.amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (parsedAmount < 10) {
      return res.status(400).json({ message: "Minimum recharge is ₹10" });
    }
    if (parsedAmount > 10000) {
      return res.status(400).json({ message: "Maximum recharge is ₹10,000" });
    }

    const existingPending = await RechargeRequest.findOne({
      student: req.user._id,
      status: "pending",
    });
    if (existingPending) {
      return res.status(400).json({
        message:
          "You already have a pending recharge request. Wait for admin approval.",
      });
    }

    const request = await RechargeRequest.create({
      requestId: `RCH_${crypto.randomBytes(8).toString("hex").toUpperCase()}`,
      student: req.user._id,
      amount: parsedAmount,
    });

    res.status(201).json({
      message: "Recharge request submitted. Awaiting admin approval.",
      request,
    });
  } catch (error) {
    console.error("Recharge request error:", error);
    res.status(500).json({ message: error.message });
  }
};

const getRechargeRequests = async (req, res) => {
  try {
    const requests = await RechargeRequest.find({ student: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  getBalance,
  getTransactionHistory,
  rechargeWallet,
  getRechargeRequests,
};
