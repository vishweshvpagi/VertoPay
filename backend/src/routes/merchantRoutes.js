const express = require("express");
const router = express.Router();

const {
  getProfile,
  getBalance,
  getTransactionHistory,
  getTodaySales,
} = require("../controllers/merchantController");

const {
  requestWithdrawal,
  getMyRequests,
} = require("../controllers/withdrawalController");

const { protect, merchantOnly } = require("../middleware/authMiddleware");

router.use(protect);
router.use(merchantOnly);

router.get("/profile", getProfile);
router.get("/balance", getBalance);
router.get("/transactions", getTransactionHistory);
router.get("/sales/today", getTodaySales);

// Withdrawals
router.post("/withdraw", requestWithdrawal);
router.get("/withdraw/history", getMyRequests);

module.exports = router;
