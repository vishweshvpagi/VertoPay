const crypto = require("crypto");
const Student = require("../models/Student");
const Merchant = require("../models/Merchant");
const Transaction = require("../models/Transaction");
const qrService = require("../services/qrService");

const getQrSecret = () => {
  const secret = process.env.QR_SECRET;
  if (!secret || typeof secret !== "string") {
    throw new Error(
      "Missing QR_SECRET environment variable. Set QR_SECRET in backend/.env or your production environment.",
    );
  }
  return secret;
};

// ── POST /api/transactions/generate-qr ───────────────────────────────────────
const generateQR = async (req, res) => {
  try {
    const { amount, merchantId } = req.body;
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (!merchantId?.trim()) {
      return res.status(400).json({ message: "Merchant ID is required" });
    }

    const studentId = req.user.studentId;
    if (!studentId) {
      return res.status(400).json({ message: "Student identity is missing" });
    }

    const merchant = await Merchant.findOne({ merchantId: merchantId.trim() });
    if (!merchant) {
      return res
        .status(404)
        .json({ message: `Merchant '${merchantId}' not found` });
    }
    if (!merchant.isActive) {
      return res
        .status(403)
        .json({ message: "Merchant account is deactivated" });
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    if (student.balance < parsedAmount) {
      return res.status(400).json({
        message: `Insufficient balance. You have ₹${student.balance.toFixed(2)}`,
      });
    }

    const { qrPayload, qrCodeImage } = await qrService.generateQRData(
      studentId,
      parsedAmount,
      merchantId.trim(),
    );

    res.json({ qrPayload, qrCodeImage });
  } catch (error) {
    console.error("Generate QR error:", error);
    res.status(500).json({ message: error.message });
  }
};

const verifyQR = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData || typeof qrData !== "object") {
      return res.status(400).json({ message: "Missing qrData payload" });
    }

    const merchantId = req.user.merchantId;
    const result = await qrService.verifyAndProcessPayment(qrData, merchantId);

    res.status(201).json(result);
  } catch (error) {
    console.error("Verify QR error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── POST /api/transactions/process-payment ────────────────────────────────────
const processPayment = async (req, res) => {
  try {
    const {
      transactionId,
      studentEmail,
      merchantId,
      amount,
      timestamp,
      signature,
    } = req.body;
    const parsedAmount = parseFloat(amount);

    // ── Validate inputs ───────────────────────────────────────────────────────
    if (
      !transactionId ||
      !studentEmail ||
      !merchantId ||
      !parsedAmount ||
      !timestamp ||
      !signature
    ) {
      return res
        .status(400)
        .json({ message: "Missing required payment fields" });
    }

    // ── HMAC-SHA256 signature verification ────────────────────────────────────
    // Reconstruct the payload in the EXACT key order used during signing
    const canonicalPayload = {
      type: req.body.type,
      transactionId: req.body.transactionId,
      studentId: req.body.studentId,
      studentName: req.body.studentName,
      studentEmail: req.body.studentEmail,
      merchantId: req.body.merchantId,
      merchantName: req.body.merchantName,
      amount: parsedAmount,
      timestamp: req.body.timestamp,
    };
    const computedSignature = crypto
      .createHmac("sha256", getQrSecret())
      .update(JSON.stringify(canonicalPayload))
      .digest("hex");

    // Constant-time comparison to prevent timing attacks
    const sigBuffer = Buffer.from(signature, "hex");
    const computedBuffer = Buffer.from(computedSignature, "hex");
    if (
      sigBuffer.length !== computedBuffer.length ||
      !crypto.timingSafeEqual(sigBuffer, computedBuffer)
    ) {
      return res.status(400).json({ message: "Invalid or tampered QR code" });
    }

    // ── Replay attack prevention ──────────────────────────────────────────────
    const existing = await Transaction.findOne({ transactionId });
    if (existing) {
      return res.status(409).json({ message: "Transaction already processed" });
    }

    // ── QR expiry (5 minutes) ─────────────────────────────────────────────────
    const qrAge = Date.now() - new Date(timestamp).getTime();
    if (qrAge > 5 * 60 * 1000) {
      return res
        .status(400)
        .json({ message: "QR code expired. Please generate a new one." });
    }

    // ── Find student ──────────────────────────────────────────────────────────
    const student = await Student.findOne({
      email: studentEmail.toLowerCase(),
    });
    if (!student) return res.status(404).json({ message: "Student not found" });
    if (!student.isActive)
      return res
        .status(403)
        .json({ message: "Student account is deactivated" });

    // ── Verify logged-in merchant matches scanned merchantId ──────────────────
    if (req.user.merchantId !== merchantId) {
      return res.status(403).json({ message: "Merchant ID mismatch" });
    }
    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant)
      return res.status(404).json({ message: "Merchant not found" });
    if (!merchant.isActive)
      return res
        .status(403)
        .json({ message: "Merchant account is deactivated" });

    // ── Balance check ─────────────────────────────────────────────────────────
    if (student.balance < parsedAmount) {
      return res.status(400).json({
        message: `Insufficient balance. Student has ₹${student.balance.toFixed(2)}`,
      });
    }

    // ── Atomic debit + credit ─────────────────────────────────────────────────
    const [updatedStudent, updatedMerchant] = await Promise.all([
      Student.findByIdAndUpdate(
        student._id,
        { $inc: { balance: -parsedAmount } },
        { new: true },
      ),
      Merchant.findByIdAndUpdate(
        merchant._id,
        { $inc: { balance: parsedAmount } },
        { new: true },
      ),
    ]);

    // ── Record transaction ────────────────────────────────────────────────────
    const transaction = await Transaction.create({
      transactionId,
      student: student._id,
      merchant: merchant._id,
      amount: parsedAmount,
      type: "payment",
      qrNonce: transactionId,
      qrTimestamp: new Date(timestamp),
      status: "completed",
      description: `Payment to ${merchant.shopName}`,
    });

    console.log(
      `✅ Payment: ₹${parsedAmount} | ${student.name} → ${merchant.shopName}`,
    );

    res.status(201).json({
      message: "Payment successful",
      transaction,
      studentBalance: updatedStudent.balance,
      merchantBalance: updatedMerchant.balance,
    });
  } catch (error) {
    console.error("Process payment error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/transactions/history ─────────────────────────────────────────────
const getTransactions = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "student") query = { student: req.user._id };
    if (req.user.role === "merchant") query = { merchant: req.user._id };
    // admin → no filter, gets all

    const transactions = await Transaction.find(query)
      .populate("student", "name studentId email")
      .populate("merchant", "shopName merchantId")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ transactions });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateQR, verifyQR, processPayment, getTransactions };
