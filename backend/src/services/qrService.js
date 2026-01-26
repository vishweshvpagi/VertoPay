const QRCode = require('qrcode');
const cryptoService = require('./cryptoService');
const Student = require('../models/Student');
const Transaction = require('../models/Transaction');

class QRService {
  // Generate QR code data for offline use
  async generateQRData(studentId, amount) {
    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new Error('Student not found');
    }

    const nonce = cryptoService.generateNonce();
    const timestamp = new Date().toISOString();

    const qrData = {
      studentId: student.studentId,
      amount: parseFloat(amount),
      nonce,
      timestamp
    };

    const signature = cryptoService.signQRData(qrData, student.privateKey);

    const qrPayload = {
      ...qrData,
      signature
    };

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrPayload));

    return {
      qrData: qrPayload,
      qrCodeImage
    };
  }

  // Verify and process QR payment
  async verifyAndProcessPayment(qrData, merchantId) {
    const { studentId, amount, nonce, timestamp, signature } = qrData;

    // 1. Check if nonce already used (prevent replay attack)
    const existingTransaction = await Transaction.findOne({ qrNonce: nonce });
    if (existingTransaction) {
      throw new Error('QR code already used - Replay attack prevented');
    }

    // 2. Verify timestamp (within 5 minutes)
    const qrTime = new Date(timestamp);
    const currentTime = new Date();
    const timeDiff = (currentTime - qrTime) / 1000 / 60; // in minutes
    
    if (timeDiff > 5 || timeDiff < -1) {
      throw new Error('QR code expired or invalid timestamp');
    }

    // 3. Get student and verify signature
    const student = await Student.findOne({ studentId });
    if (!student) {
      throw new Error('Student not found');
    }

    if (!student.isActive) {
      throw new Error('Student account is inactive');
    }

    const dataToVerify = { studentId, amount, nonce, timestamp };
    const isValid = cryptoService.verifyQRSignature(dataToVerify, signature, student.publicKey);
    
    if (!isValid) {
      throw new Error('Invalid QR signature - Possible forgery detected');
    }

    // 4. Check sufficient balance
    if (student.balance < amount) {
      throw new Error(`Insufficient balance. Available: ₹${student.balance}`);
    }

    // 5. Get merchant
    const Merchant = require('../models/Merchant');
    const merchant = await Merchant.findOne({ merchantId });
    if (!merchant) {
      throw new Error('Merchant not found');
    }

    if (!merchant.isActive) {
      throw new Error('Merchant account is inactive');
    }

    // 6. Process atomic transaction
    const transactionId = cryptoService.generateTransactionId();

    // Deduct from student
    student.balance -= amount;
    await student.save();

    // Credit to merchant
    merchant.balance += amount;
    await merchant.save();

    // Create transaction record
    const transaction = await Transaction.create({
      transactionId,
      student: student._id,
      merchant: merchant._id,
      amount,
      qrNonce: nonce,
      qrTimestamp: qrTime,
      status: 'completed',
      description: `Payment to ${merchant.shopName}`
    });

    return {
      success: true,
      transactionId,
      amount,
      studentBalance: student.balance,
      merchantBalance: merchant.balance,
      timestamp: new Date()
    };
  }
}

module.exports = new QRService();
