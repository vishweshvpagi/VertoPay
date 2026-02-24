const crypto = require('crypto');
const Student = require('../models/Student');
const Merchant = require('../models/Merchant');
const Transaction = require('../models/Transaction');

// ─────────────────────────────────────────────
// POST /api/transactions/generate-qr
// Called by student before showing QR
// Reserves the nonce so it can't be reused
// ─────────────────────────────────────────────
const generateQR = async (req, res) => {
  try {
    const { amount, merchantId } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    if (!merchantId) {
      return res.status(400).json({ message: 'Merchant ID required' });
    }

    // Verify merchant exists
    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    // Verify student has enough balance
    const student = await Student.findById(req.user._id);
    if (student.balance < parsedAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Build QR payload — matches exactly what scan.tsx reads
    const qrPayload = {
      type:          'payment',
      transactionId: `TXN${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      studentId:     student.studentId,
      studentName:   student.name,
      studentEmail:  student.email,
      merchantId:    merchant.merchantId,
      merchantName:  merchant.shopName,
      amount:        parsedAmount,
      timestamp:     new Date().toISOString(),
    };

    res.json({ qrPayload });
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/transactions/process-payment
// Called by merchant after scanning QR
// ─────────────────────────────────────────────
const processPayment = async (req, res) => {
  const {
    transactionId,
    studentEmail,
    studentId,
    merchantId,
    amount,
    timestamp,
  } = req.body;

  const parsedAmount = parseFloat(amount);

  // ── 1. Basic validation ───────────────────
  if (!transactionId || !studentEmail || !merchantId || !parsedAmount) {
    return res.status(400).json({ message: 'Missing required payment fields' });
  }

  // ── 2. Replay attack prevention ──────────
  const existing = await Transaction.findOne({ transactionId });
  if (existing) {
    return res.status(409).json({ message: 'Transaction already processed' });
  }

  // ── 3. QR expiry check (5 minutes) ───────
  const qrAge = Date.now() - new Date(timestamp).getTime();
  if (qrAge > 5 * 60 * 1000) {
    return res.status(400).json({ message: 'QR code has expired. Please generate a new one.' });
  }

  // ── 4. Find student ───────────────────────
  const student = await Student.findOne({ email: studentEmail });
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  if (!student.isActive) {
    return res.status(403).json({ message: 'Student account is deactivated' });
  }

  // ── 5. Verify merchant matches logged-in merchant ──
  if (req.user.merchantId !== merchantId) {
    return res.status(403).json({ message: 'Merchant ID mismatch' });
  }
  const merchant = await Merchant.findOne({ merchantId });
  if (!merchant) {
    return res.status(404).json({ message: 'Merchant not found' });
  }
  if (!merchant.isActive) {
    return res.status(403).json({ message: 'Merchant account is deactivated' });
  }

  // ── 6. Balance check ──────────────────────
  if (student.balance < parsedAmount) {
    return res.status(400).json({
      message: `Insufficient balance. Student has ₹${student.balance.toFixed(2)}`,
    });
  }

  // ── 7. Atomic debit + credit ─────────────
  const [updatedStudent, updatedMerchant] = await Promise.all([
    Student.findByIdAndUpdate(
      student._id,
      { $inc: { balance: -parsedAmount } },
      { new: true }
    ),
    Merchant.findByIdAndUpdate(
      merchant._id,
      { $inc: { balance: parsedAmount } },
      { new: true }
    ),
  ]);

  // ── 8. Record transaction ─────────────────
  const transaction = await Transaction.create({
    transactionId,
    student:     student._id,
    merchant:    merchant._id,
    amount:      parsedAmount,
    type:        'payment',
    qrNonce:     transactionId,   // transactionId doubles as nonce
    qrTimestamp: new Date(timestamp),
    status:      'completed',
    description: `Payment to ${merchant.shopName}`,
  });

  console.log(
    `✅ Payment processed: ₹${parsedAmount} from ${student.name} → ${merchant.shopName}`
  );

  res.status(201).json({
    message:         'Payment successful',
    transaction,
    studentBalance:  updatedStudent.balance,
    merchantBalance: updatedMerchant.balance,
  });
};

// ─────────────────────────────────────────────
// GET /api/transactions/history
// Works for student, merchant, and admin
// ─────────────────────────────────────────────
const getTransactions = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query = { student: req.user._id };
    } else if (req.user.role === 'merchant') {
      query = { merchant: req.user._id };
    }
    // admin gets all — query stays {}

    const transactions = await Transaction.find(query)
      .populate('student',  'name studentId email')
      .populate('merchant', 'shopName merchantId')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateQR, processPayment, getTransactions };
