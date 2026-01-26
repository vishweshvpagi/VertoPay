const express = require('express');
const router = express.Router();
const {
  getProfile,
  getBalance,
  getTransactionHistory
} = require('../controllers/studentController');
const { protect, studentOnly } = require('../middleware/authMiddleware');

router.use(protect);
router.use(studentOnly);

router.get('/profile', getProfile);
router.get('/balance', getBalance);
router.get('/transactions', getTransactionHistory);

module.exports = router;
