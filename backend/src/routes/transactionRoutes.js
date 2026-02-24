const express = require('express');
const router = express.Router();
const {
  generateQR,
  processPayment,
  getTransactions,
} = require('../controllers/transactionController');
const { protect, studentOnly, merchantOnly } = require('../middleware/authMiddleware');

router.post('/generate-qr',      protect, studentOnly,  generateQR);
router.post('/process-payment',  protect, merchantOnly, processPayment);
router.get('/history',           protect,               getTransactions);

module.exports = router;
