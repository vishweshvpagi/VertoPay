import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useWallet } from '../../hooks/useWallet';
import { useAuth } from '../../hooks/useAuth';
import { encryptPaymentData } from '../../utils/encryption';

const COLORS = {
  primary: '#6C63FF',
  danger: '#FF5252',
  warning: '#FFC107',
  background: '#F5F5F5',
  text: '#212121',
  textLight: '#757575',
  border: '#E0E0E0',
};

const MERCHANT_CATEGORIES: Record<string, string> = {
  CAFE_01: 'Main Campus Cafeteria',
  CAFE_02: 'Block A Canteen',
  LIBRARY_01: 'Central Library',
  STATIONARY_01: 'Campus Store',
};

const QR_EXPIRY_TIME = 60;

const MemoizedQRCode = memo(({ value }: { value: string }) => (
  <QRCode value={value} size={250} />
));

export default function PayScreen() {
  const [amount, setAmount] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [qrData, setQrData] = useState('');
  const [encryptedData, setEncryptedData] = useState('');
  const [timeLeft, setTimeLeft] = useState(QR_EXPIRY_TIME);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { balance } = useWallet();
  const { user } = useAuth();
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (qrData && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleCancel();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [qrData]);

  const handleCancel = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setQrData('');
    setEncryptedData('');
    setTimeLeft(QR_EXPIRY_TIME);
    setAmount('');
    setSelectedMerchant('');
  }, []);

  const generateQR = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    if (!selectedMerchant) {
      Alert.alert('Error', 'Please select a merchant');
      return;
    }

    const amountNum = parseFloat(amount);
    if (amountNum > balance) {
      Alert.alert('Insufficient Balance', `Your balance is ₹${balance}`);
      return;
    }

    setIsGenerating(true);

    try {
      const timestamp = Date.now();
      const paymentData = {
        studentId: user?.studentId || user?.uid,
        amount: amountNum,
        merchantId: selectedMerchant,
        timestamp,
        nonce: Math.random().toString(36).substring(7),
      };

      const encrypted = await encryptPaymentData(JSON.stringify(paymentData));
      
      setEncryptedData(encrypted);
      setQrData(encrypted);
      setTimeLeft(QR_EXPIRY_TIME);
    } catch (error) {
      console.error('QR Generation Error:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setIsGenerating(false);
    }
  }, [amount, selectedMerchant, balance, user]);

  const handleDecrypt = useCallback(() => {
    Alert.alert('Encrypted Data', encryptedData, [{ text: 'OK' }]);
  }, [encryptedData]);

  if (qrData) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.qrContainer}>
          <Text style={styles.amountText}>₹ {amount}</Text>
          <Text style={styles.merchantText}>
            {MERCHANT_CATEGORIES[selectedMerchant] || selectedMerchant}
          </Text>

          <View style={styles.qrWrapper}>
            <MemoizedQRCode value={qrData} />
          </View>

          <View style={styles.timerBadge}>
            <Text style={styles.timerText}>⏱ {timeLeft}s</Text>
          </View>

          <TouchableOpacity style={styles.merchantButton}>
            <Text style={styles.merchantButtonText}>📱 Show to merchant</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.decryptButton} onPress={handleDecrypt}>
            <Text style={styles.decryptButtonText}>🔓 Decrypt</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>✕ Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Generate Payment QR</Text>
        
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>₹ {balance.toFixed(2)}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            placeholderTextColor="#999"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            editable={!isGenerating}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Select Merchant</Text>
          {Object.entries(MERCHANT_CATEGORIES).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[styles.merchantOption, selectedMerchant === key && styles.merchantOptionSelected]}
              onPress={() => setSelectedMerchant(key)}
              disabled={isGenerating}
            >
              <Text style={[styles.merchantOptionText, selectedMerchant === key && styles.merchantOptionTextSelected]}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.generateButton, isGenerating && styles.buttonDisabled]}
          onPress={generateQR}
          disabled={isGenerating}
        >
          {isGenerating ? <ActivityIndicator color="#fff" /> : <Text style={styles.generateButtonText}>Generate QR Code</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1 },
  formContainer: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 20 },
  balanceCard: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 12, marginBottom: 24, alignItems: 'center' },
  balanceLabel: { color: '#fff', fontSize: 14, marginBottom: 8 },
  balanceAmount: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 16, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text },
  merchantOption: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 8, borderWidth: 2, borderColor: COLORS.border },
  merchantOptionSelected: { borderColor: COLORS.primary, backgroundColor: '#F0EFFF' },
  merchantOptionText: { fontSize: 16, color: COLORS.text },
  merchantOptionTextSelected: { color: COLORS.primary, fontWeight: '600' },
  generateButton: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  generateButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.5 },
  qrContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  amountText: { fontSize: 48, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  merchantText: { fontSize: 18, color: COLORS.textLight, marginBottom: 24 },
  qrWrapper: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  timerBadge: { backgroundColor: COLORS.danger, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginBottom: 16 },
  timerText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  merchantButton: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 12, width: '80%', alignItems: 'center' },
  merchantButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  decryptButton: { backgroundColor: COLORS.warning, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginBottom: 12, width: '80%', alignItems: 'center' },
  decryptButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: { backgroundColor: COLORS.danger, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, width: '80%', alignItems: 'center' },
  cancelButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
