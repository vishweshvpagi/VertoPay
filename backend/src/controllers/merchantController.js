const Transaction = require("../models/Transaction");
const Merchant = require("../models/Merchant");

const getProfile = async (req, res) => {
  try {
    res.json({ merchant: req.user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBalance = async (req, res) => {
  try {
    const merchant = await Merchant.findById(req.user._id).select("balance");
    res.json({ balance: merchant.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTransactionHistory = async (req, res) => {
  try {
    const transactions = await Transaction.find({
      merchant: req.user._id,
      type: "payment",
    })
      .populate("student", "name studentId")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTodaySales = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const agg = await Transaction.aggregate([
      {
        $match: {
          merchant: req.user._id,
          type: "payment",
          status: "completed",
          createdAt: { $gte: todayStart },
        },
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalSales: agg[0]?.totalSales ?? 0,
      totalTransactions: agg[0]?.totalTransactions ?? 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProfile,
  getBalance,
  getTransactionHistory,
  getTodaySales,
};
