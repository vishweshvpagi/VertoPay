const express = require("express");
const router = express.Router();
const {
  getProfile,
  getBalance,
  getTransactionHistory,
  rechargeWallet,
  getRechargeRequests,
} = require("../controllers/studentController");
const { protect, studentOnly } = require("../middleware/authMiddleware");

router.use(protect);
router.use(studentOnly);

router.get("/profile", getProfile);
router.get("/balance", getBalance);
router.get("/transactions", getTransactionHistory);
router.post("/recharge", rechargeWallet);
router.get("/recharge-requests", getRechargeRequests);

module.exports = router;
