const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/adminController");

const {
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  exportWithdrawalsCSV,
} = require("../controllers/withdrawalController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// ✅ Skip auth for OPTIONS preflight — browser sends this without a token
router.options("*", (req, res) => {
  res.sendStatus(200);
});

// ✅ Apply auth AFTER preflight is handled
router.use(protect);
router.use(adminOnly);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Students
router.get("/students", getAllStudents);
router.patch("/students/:studentId/toggle", toggleStudentStatus);

// Merchants
router.get("/merchants", getAllMerchants);
router.patch("/merchants/:merchantId/toggle", toggleMerchantStatus);

// Transactions
router.get("/transactions", getAllTransactions);

// Recharge requests
router.get("/recharge-requests", getRechargeRequests);
router.post("/recharge-requests/:requestId/approve", approveRecharge);
router.post("/recharge-requests/:requestId/reject", rejectRecharge);

// Manual top-up
router.post("/top-up", topUpStudent);

// ✅ export BEFORE /:requestId so Express doesn't match 'export' as a param
router.get("/withdrawals/export", exportWithdrawalsCSV);
router.get("/withdrawals", getAllWithdrawals);
router.post("/withdrawals/:requestId/approve", approveWithdrawal);
router.post("/withdrawals/:requestId/reject", rejectWithdrawal);

module.exports = router;
