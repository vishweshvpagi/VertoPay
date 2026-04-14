const QRCode = require("qrcode");
const cryptoService = require("./cryptoService");
const Student = require("../models/Student");
const Merchant = require("../models/Merchant");
const Transaction = require("../models/Transaction");

class QRService {
  // Generate QR code data for offline use
  async generateQRData(studentId, amount, merchantId) {
    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new Error("Student not found");
    }
    if (!student.isActive) {
      throw new Error("Student account is inactive");
    }

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      throw new Error("Merchant not found");
    }
    if (!merchant.isActive) {
      throw new Error("Merchant account is inactive");
    }

    const nonce = cryptoService.generateNonce();
    const timestamp = new Date().toISOString();

    const qrPayload = {
      type: "payment",
      transactionId: cryptoService.generateTransactionId(),
      studentId: student.studentId,
      studentName: student.name,
      studentEmail: student.email,
      merchantId: merchant.merchantId,
      merchantName: merchant.shopName,
      amount: parseFloat(amount),
      nonce,
      timestamp,
    };

    const signature = cryptoService.signQRData(qrPayload, student.privateKey);
    const signedPayload = { ...qrPayload, signature };
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(signedPayload));

    return {
      qrPayload: signedPayload,
      qrCodeImage,
    };
  }

  // Verify and process QR payment
  async verifyAndProcessPayment(qrData, merchantId) {
    if (!qrData || typeof qrData !== "object") {
      throw new Error("Invalid QR payment data");
    }

    const {
      type,
      transactionId,
      studentId,
      studentName,
      studentEmail,
      merchantId: qrMerchantId,
      merchantName,
      amount,
      nonce,
      timestamp,
      signature,
    } = qrData;

    if (
      type !== "payment" ||
      !transactionId ||
      !studentId ||
      !qrMerchantId ||
      !merchantName ||
      !studentName ||
      !studentEmail ||
      !amount ||
      !nonce ||
      !timestamp ||
      !signature
    ) {
      throw new Error("Invalid or incomplete QR payment data");
    }

    if (qrMerchantId !== merchantId) {
      throw new Error("QR merchant mismatch");
    }

    const qrTime = new Date(timestamp);
    const currentTime = new Date();
    const timeDiff = (currentTime - qrTime) / 1000 / 60; // in minutes

    if (timeDiff > 5 || timeDiff < -2) {
      throw new Error("QR code expired or invalid timestamp");
    }

    const existingTransaction = await Transaction.findOne({ transactionId });
    if (existingTransaction) {
      throw new Error("Transaction already processed");
    }

    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new Error("Student not found");
    }
    if (!student.isActive) {
      throw new Error("Student account is inactive");
    }

    const paymentAmount = parseFloat(amount);
    if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error("Invalid payment amount");
    }

    const dataToVerify = {
      type,
      transactionId,
      studentId,
      studentName,
      studentEmail,
      merchantId: qrMerchantId,
      merchantName,
      amount: paymentAmount,
      nonce,
      timestamp,
    };

    const isValid = cryptoService.verifyQRSignature(
      dataToVerify,
      signature,
      student.publicKey,
    );
    if (!isValid) {
      throw new Error("Invalid QR signature - Possible forgery detected");
    }

    if (student.balance < paymentAmount) {
      throw new Error(`Insufficient balance. Available: ₹${student.balance}`);
    }

    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      throw new Error("Merchant not found");
    }
    if (!merchant.isActive) {
      throw new Error("Merchant account is inactive");
    }

    student.balance -= paymentAmount;
    await student.save();

    merchant.balance += paymentAmount;
    await merchant.save();

    const transaction = await Transaction.create({
      transactionId,
      student: student._id,
      merchant: merchant._id,
      amount: paymentAmount,
      qrNonce: nonce,
      qrTimestamp: qrTime,
      status: "completed",
      description: `Payment to ${merchant.shopName}`,
    });

    return {
      success: true,
      transactionId: transaction.transactionId,
      amount: transaction.amount,
      studentBalance: student.balance,
      merchantBalance: merchant.balance,
      timestamp: transaction.createdAt || new Date(),
    };
  }
}

module.exports = new QRService();
