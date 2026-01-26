const qrService = require('../services/qrService');

// Generate QR code (Student only)
const generateQR = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const qrResult = await qrService.generateQRData(req.user.studentId, amount);

    res.json({
      message: 'QR code generated successfully',
      ...qrResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify and process payment (Merchant only)
const processPayment = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }

    const result = await qrService.verifyAndProcessPayment(qrData, req.user.merchantId);

    res.json({
      message: 'Payment processed successfully',
      ...result
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  generateQR,
  processPayment
};
