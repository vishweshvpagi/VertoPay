const crypto = require('crypto');

class CryptoService {
  // Generate RSA key pair for student
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });
    return { publicKey, privateKey };
  }

  // Sign QR data with private key
  signQRData(data, privateKey) {
    const sign = crypto.createSign('SHA256');
    sign.update(JSON.stringify(data));
    sign.end();
    return sign.sign(privateKey, 'base64');
  }

  // Verify QR signature with public key
  verifyQRSignature(data, signature, publicKey) {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(JSON.stringify(data));
      verify.end();
      return verify.verify(publicKey, signature, 'base64');
    } catch (error) {
      return false;
    }
  }

  // Generate random nonce
  generateNonce() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Generate transaction ID
  generateTransactionId() {
    return `TXN${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }
}

module.exports = new CryptoService();
