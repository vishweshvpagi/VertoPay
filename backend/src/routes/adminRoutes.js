const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getAllMerchants,
  getAllTransactions,
  topUpStudent,
  toggleStudentStatus,
  toggleMerchantStatus,
  getDashboardStats
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(adminOnly);

router.get('/students', getAllStudents);
router.get('/merchants', getAllMerchants);
router.get('/transactions', getAllTransactions);
router.post('/topup', topUpStudent);
router.patch('/students/:studentId/toggle', toggleStudentStatus);
router.patch('/merchants/:merchantId/toggle', toggleMerchantStatus);
router.get('/stats', getDashboardStats);

module.exports = router;
