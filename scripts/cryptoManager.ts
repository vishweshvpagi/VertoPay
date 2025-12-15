import * as ed from "@noble/ed25519";
import * as SecureStore from "expo-secure-store";

const PRIVATE_KEY_STORAGE = "ed25519_private_key";
const PUBLIC_KEY_STORAGE = "ed25519_public_key";

export const generateKeyPair = async (): Promise<string> => {
  try {
    const privateKey = ed.utils.randomSecretKey();
    const publicKey = await ed.getPublicKeyAsync(privateKey);

    await SecureStore.setItemAsync(
      PRIVATE_KEY_STORAGE,
      Buffer.from(privateKey).toString("base64")
    );
    await SecureStore.setItemAsync(
      PUBLIC_KEY_STORAGE,
      Buffer.from(publicKey).toString("base64")
    );

    return Buffer.from(publicKey).toString("base64");
  } catch (error) {
    console.error("Key generation failed:", error);
    throw new Error("Failed to generate cryptographic keys");
  }
};

export const signMessage = async (message: string): Promise<string> => {
  try {
    const privateKeyBase64 = await SecureStore.getItemAsync(
      PRIVATE_KEY_STORAGE
    );
    if (!privateKeyBase64) {
      throw new Error("Private key not found. Please register first.");
    }

    const privateKey = Buffer.from(privateKeyBase64, "base64");
    const messageBytes = new TextEncoder().encode(message);
    const signature = await ed.signAsync(messageBytes, privateKey);

    return Buffer.from(signature).toString("base64");
  } catch (error) {
    console.error("Signing failed:", error);
    throw error;
  }
};

export const getPublicKey = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(PUBLIC_KEY_STORAGE);
};

export const hasKeyPair = async (): Promise<boolean> => {
  const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE);
  return !!privateKey;
};

export const deleteKeyPair = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(PRIVATE_KEY_STORAGE);
  await SecureStore.deleteItemAsync(PUBLIC_KEY_STORAGE);
};
