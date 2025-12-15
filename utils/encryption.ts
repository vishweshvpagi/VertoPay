export const encryptPaymentData = async (data: string): Promise<string> => {
  try {
    const encrypted = btoa(unescape(encodeURIComponent(data)));
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt');
  }
};

export const decryptPaymentData = async (encryptedData: string): Promise<string> => {
  try {
    const decrypted = decodeURIComponent(escape(atob(encryptedData)));
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt');
  }
};

export const generateNonce = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};
