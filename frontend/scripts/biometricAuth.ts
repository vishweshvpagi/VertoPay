import * as LocalAuthentication from 'expo-local-authentication';

export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch (error) {
    console.error('Biometric check error:', error);
    return false;
  }
};

export const authenticateWithBiometric = async (
  reason: string = 'Authenticate to proceed'
): Promise<boolean> => {
  try {
    const available = await isBiometricAvailable();

    if (!available) {
      console.warn('Biometric authentication not available');
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    return result.success;
  } catch (error) {
    console.error('Biometric auth error:', error);
    return false;
  }
};

export const getBiometricType = async (): Promise<number[]> => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    return types;
  } catch (error) {
    console.error('Get biometric type error:', error);
    return [];
  }
};
