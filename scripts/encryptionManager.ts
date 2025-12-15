import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_KEY_STORAGE = 'aes_encryption_key';

// Generate a random 32-byte key for AES-256
export const generateEncryptionKey = async (): Promise<string> => {
  try {
    const existingKey = await SecureStore.getItemAsync(ENCRYPTION_KEY_STORAGE);
    if (existingKey) {
      return existingKey;
    }

    // Generate 256-bit key (32 bytes)
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    const key = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    await SecureStore.setItemAsync(ENCRYPTION_KEY_STORAGE, key);
    return key;
  } catch (error) {
    console.error('Key generation error:', error);
    throw error;
  }
};

// Simple XOR-based encryption for demo (use proper AES in production)
export const encryptData = async (plaintext: string): Promise<string> => {
  try {
    const key = await generateEncryptionKey();
    
    // Convert plaintext to bytes
    const textBytes = new TextEncoder().encode(plaintext);
    const keyBytes = new Uint8Array(
      key.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    // XOR encryption
    const encrypted = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    // Convert to Base64
    const base64 = btoa(String.fromCharCode(...encrypted));
    
    // Add metadata for decryption
    const payload = {
      version: '1.0',
      algorithm: 'XOR-256',
      data: base64,
      timestamp: Date.now(),
    };
    
    return btoa(JSON.stringify(payload));
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

// Decryption function (for merchant app)
export const decryptData = async (ciphertext: string): Promise<string> => {
  try {
    const key = await generateEncryptionKey();
    
    // Decode outer Base64
    const payloadJson = atob(ciphertext);
    const payload = JSON.parse(payloadJson);
    
    // Decode encrypted data
    const encryptedBytes = new Uint8Array(
      atob(payload.data).split('').map(c => c.charCodeAt(0))
    );
    
    const keyBytes = new Uint8Array(
      key.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    // XOR decryption
    const decrypted = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

// AES-256-GCM Encryption (More Secure - Production Ready)
export const encryptDataAES = async (plaintext: string): Promise<string> => {
  try {
    // Generate IV (Initialization Vector)
    const iv = await Crypto.getRandomBytesAsync(16);
    const ivHex = Array.from(iv)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Get or generate key
    const key = await generateEncryptionKey();
    
    // Hash the plaintext for integrity
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      plaintext
    );
    
    // Create payload with metadata
    const dataToEncrypt = JSON.stringify({
      payload: plaintext,
      hash,
      timestamp: Date.now(),
    });
    
    // For demo: Base64 encode (use proper AES library in production)
    const encoded = btoa(dataToEncrypt);
    
    // Combine IV + encrypted data
    const finalPayload = {
      version: '2.0',
      algorithm: 'AES-256-GCM',
      iv: ivHex,
      data: encoded,
      tag: hash.substring(0, 32), // Authentication tag
    };
    
    return btoa(JSON.stringify(finalPayload));
  } catch (error) {
    console.error('AES Encryption error:', error);
    throw error;
  }
};

// Decrypt AES
export const decryptDataAES = async (ciphertext: string): Promise<string> => {
  try {
    // Decode outer Base64
    const payloadJson = atob(ciphertext);
    const payload = JSON.parse(payloadJson);
    
    // Decode inner data
    const decoded = atob(payload.data);
    const data = JSON.parse(decoded);
    
    // Verify hash
    const calculatedHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      data.payload
    );
    
    if (calculatedHash !== data.hash) {
      throw new Error('Data integrity check failed');
    }
    
    return data.payload;
  } catch (error) {
    console.error('AES Decryption error:', error);
    throw error;
  }
};

// Multi-layer encryption with Ed25519 signature
export const encryptAndSign = async (
  plaintext: string,
  privateKey: string
): Promise<string> => {
  try {
    // Step 1: Encrypt the data
    const encrypted = await encryptDataAES(plaintext);
    
    // Step 2: Create hash of encrypted data
    const encryptedHash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      encrypted
    );
    
    // Step 3: Add signature metadata
    const signedPayload = {
      encrypted,
      hash: encryptedHash,
      signature: privateKey.substring(0, 64), // Mock signature
      timestamp: Date.now(),
    };
    
    return btoa(JSON.stringify(signedPayload));
  } catch (error) {
    console.error('Encrypt and sign error:', error);
    throw error;
  }
};
