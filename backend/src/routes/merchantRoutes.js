const express = require('express');
const router = express.Router();
const {
  getProfile,
  getBalance,
  getTransactionHistory,
  getTodaySales
} = require('../controllers/merchantController');
const { protect, merchantOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(merchantOnly);

router.get('/profile', getProfile);
router.get('/balance', getBalance);
router.get('/transactions', getTransactionHistory);
router.get('/sales/today', getTodaySales);

module.exports = router;
