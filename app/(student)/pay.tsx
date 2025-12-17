 import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, MERCHANT_CATEGORIES } from '../../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PayScreen() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      if (user?.email) {
        const walletData = await AsyncStorage.getItem(`WALLET_${user.email}`);
        if (walletData) {
          const wallet = JSON.parse(walletData);
          setBalance(wallet.balance || 0);
        }
      }
    } catch (error) {
      console.error('Load balance error:', error);
    }
  };

  const merchants = Object.entries(MERCHANT_CATEGORIES).map(([id, name]) => ({
    id,
    name,
    icon: id === 'CANTEEN_01' ? 'restaurant' :
          id === 'LIBRARY_01' ? 'book' :
          id === 'STORE_01' ? 'storefront' : 'cafe',
  }));

  const handleGenerateQR = () => {
    const payAmount = parseFloat(amount);

    if (!selectedMerchant) {
      Alert.alert('Select Merchant', 'Please select a merchant to pay');
      return;
    }

    if (!payAmount || payAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (payAmount > balance) {
      Alert.alert('Insufficient Balance', `You only have ₹${balance.toFixed(2)} in your wallet`);
      return;
    }

    // Generate unique transaction ID
    const transactionId = `TXN${Date.now()}`;

    // Create QR data with all payment info
    const paymentData = {
      type: 'payment',
      transactionId: transactionId,
      studentId: user?.studentId,
      studentName: user?.name,
      studentEmail: user?.email,
      merchantId: selectedMerchant,
      merchantName: MERCHANT_CATEGORIES[selectedMerchant],
      amount: payAmount,
      timestamp: new Date().toISOString(),
    };

    setQrData(JSON.stringify(paymentData));
    setQrGenerated(true);
  };

  const handleReset = () => {
    setAmount('');
    setSelectedMerchant('');
    setQrGenerated(false);
    setQrData('');
    loadBalance();
  };

  const quickAmounts = [50, 100, 200, 500];

  if (qrGenerated) {
    const paymentInfo = JSON.parse(qrData);
    
    return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Payment QR Code</Text>
          <TouchableOpacity onPress={handleReset} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* QR Code Display */}
        <View style={styles.qrCard}>
          <View style={styles.qrContainer}>
            <QRCode
              value={qrData}
              size={260}
              backgroundColor="white"
              color={COLORS.student}
            />
          </View>

          <View style={styles.paymentInfo}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>
            <Text style={styles.amountValue}>₹{paymentInfo.amount}</Text>
          </View>

          <View style={styles.merchantInfo}>
            <View style={styles.merchantIconSmall}>
              <Ionicons 
                name={merchants.find(m => m.id === paymentInfo.merchantId)?.icon as any || 'storefront'} 
                size={24} 
                color={COLORS.merchant} 
              />
            </View>
            <View>
              <Text style={styles.merchantLabel}>Paying to</Text>
              <Text style={styles.merchantValue}>{paymentInfo.merchantName}</Text>
            </View>
          </View>

          <View style={styles.studentInfo}>
            <View style={styles.studentAvatar}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.studentName}>{paymentInfo.studentName}</Text>
              <Text style={styles.studentId}>ID: {paymentInfo.studentId}</Text>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Ionicons name="information-circle" size={32} color={COLORS.primary} />
          <View style={styles.instructionsContent}>
            <Text style={styles.instructionsTitle}>Show this QR to Merchant</Text>
            <Text style={styles.instructionsText}>
              The merchant will scan this QR code to complete the payment. 
              Money will be deducted from your wallet automatically.
            </Text>
          </View>
        </View>

        {/* Transaction Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Transaction Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{paymentInfo.transactionId}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Balance</Text>
            <Text style={styles.detailValue}>₹{balance.toFixed(2)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Balance After Payment</Text>
            <Text style={[styles.detailValue, { color: COLORS.success }]}>
              ₹{(balance - paymentInfo.amount).toFixed(2)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created At</Text>
            <Text style={styles.detailValue}>
              {new Date(paymentInfo.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.resetButtonText}>Generate New QR</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Generate Payment QR</Text>
          <Text style={styles.subtitle}>Balance: ₹{balance.toFixed(2)}</Text>
        </View>
      </View>

      {/* Amount Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enter Amount</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.rupeeSymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholderTextColor={COLORS.textLight}
          />
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmounts}>
          {quickAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[
                styles.quickBtn,
                amount === amt.toString() && styles.quickBtnActive,
              ]}
              onPress={() => setAmount(amt.toString())}
            >
              <Text
                style={[
                  styles.quickBtnText,
                  amount === amt.toString() && styles.quickBtnTextActive,
                ]}
              >
                ₹{amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Select Merchant */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Merchant</Text>
        <View style={styles.merchantsGrid}>
          {merchants.map((merchant) => (
            <TouchableOpacity
              key={merchant.id}
              style={[
                styles.merchantCard,
                selectedMerchant === merchant.id && styles.merchantCardActive,
              ]}
              onPress={() => setSelectedMerchant(merchant.id)}
            >
              <View style={[
                styles.merchantIcon,
                selectedMerchant === merchant.id && styles.merchantIconActive,
              ]}>
                <Ionicons
                  name={merchant.icon as any}
                  size={28}
                  color={selectedMerchant === merchant.id ? '#fff' : COLORS.primary}
                />
              </View>
              <Text style={[
                styles.merchantName,
                selectedMerchant === merchant.id && styles.merchantNameActive,
              ]}>
                {merchant.name}
              </Text>
              {selectedMerchant === merchant.id && (
                <Ionicons name="checkmark-circle" size={20} color={COLORS.student} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Generate QR Button */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.generateButton,
            (!amount || !selectedMerchant) && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerateQR}
          disabled={!amount || !selectedMerchant}
        >
          <Ionicons name="qr-code" size={24} color="#fff" />
          <Text style={styles.generateButtonText}>
            Generate Payment QR
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCardBottom}>
        <Ionicons name="information-circle" size={24} color={COLORS.primary} />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoText}>
            1. Enter the amount you want to pay{'\n'}
            2. Select the merchant{'\n'}
            3. Generate QR code{'\n'}
            4. Show QR to merchant to scan{'\n'}
            5. Payment completes automatically
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.student,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: COLORS.student,
  },
  rupeeSymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
    padding: 20,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  quickBtn: {
    width: '23%',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickBtnActive: {
    backgroundColor: COLORS.student,
    borderColor: COLORS.student,
  },
  quickBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  quickBtnTextActive: {
    color: '#fff',
  },
  merchantsGrid: {
    gap: 12,
  },
  merchantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  merchantCardActive: {
    borderColor: COLORS.student,
    backgroundColor: COLORS.student + '10',
  },
  merchantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  merchantIconActive: {
    backgroundColor: COLORS.student,
  },
  merchantName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  merchantNameActive: {
    color: COLORS.student,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.student,
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  generateButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoCardBottom: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  qrCard: {
    backgroundColor: COLORS.card,
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: COLORS.student,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  paymentInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.student,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    width: '100%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  merchantIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.merchant + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantLabel: {
    fontSize: 11,
    color: COLORS.textLight,
  },
  merchantValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    width: '100%',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.student,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  studentId: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary + '15',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 12,
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: COLORS.card,
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  actions: {
    padding: 20,
    paddingTop: 0,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.student,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
});
