const express = require('express');
const router = express.Router();
const {
  generateQR,
  processPayment
} = require('../controllers/transactionController');
const { protect, studentOnly, merchantOnly } = require('../middleware/authMiddleware');

router.post('/generate-qr', protect, studentOnly, generateQR);
router.post('/process-payment', protect, merchantOnly, processPayment);

module.exports = router;
