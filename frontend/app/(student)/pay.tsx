import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { MERCHANT_CATEGORIES } from '../../constants/Config';
import { apiRequest } from '../../utils/api';

export default function PayScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [balance, setBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrData, setQrData] = useState('');

  useEffect(() => {
    if (user) loadBalance();
  }, [user]);

  const loadBalance = async () => {
    setBalanceLoading(true);
    try {
      const data = await apiRequest<{ user: any }>('/api/auth/me');
      setBalance(data.user?.balance ?? 0);
    } catch (error) {
      console.error('Load balance error:', error);
      setBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const merchants = Object.entries(MERCHANT_CATEGORIES).map(([id, name]) => ({
    id,
    name,
    icon: id.includes('CAFE') ? 'restaurant'
        : id.includes('LIBRARY') ? 'book'
        : id.includes('STATIONARY') ? 'storefront'
        : 'cafe',
  }));

  const handleGenerateQR = () => {
    const payAmount = parseFloat(amount);

    if (!selectedMerchant) {
      Alert.alert('Select Merchant', 'Please select a merchant to pay');
      return;
    }
    if (!amount || isNaN(payAmount) || payAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }
    if (payAmount > balance) {
      Alert.alert('Insufficient Balance', `You only have ₹${balance.toFixed(2)} in your wallet`);
      return;
    }

    const paymentData = {
      type:         'payment',
      transactionId: `TXN${Date.now()}`,
      studentId:    user?.studentId || user?._id || user?.id || 'UNKNOWN',
      studentName:  user?.name || 'Student',
      studentEmail: user?.email || '',
      merchantId:   selectedMerchant,
      merchantName: MERCHANT_CATEGORIES[selectedMerchant],
      amount:       payAmount,
      timestamp:    new Date().toISOString(),
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

  // ── QR View ──────────────────────────────────────────────────────────
  if (qrGenerated && qrData) {
    let paymentInfo: any;
    try {
      paymentInfo = JSON.parse(qrData);
    } catch {
      Alert.alert('Error', 'Failed to parse payment data.');
      handleReset();
      return null;
    }

    const merchantIcon =
      merchants.find((m) => m.id === paymentInfo.merchantId)?.icon || 'storefront';

    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment QR Code</Text>
          <Text style={styles.subtitle}>Show this QR to the merchant</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleReset}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.qrCard}>
          <View style={styles.paymentInfo}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>
            <Text style={styles.amountValue}>₹{paymentInfo.amount.toFixed(2)}</Text>
          </View>

          <View style={styles.merchantInfo}>
            <View style={styles.merchantIconSmall}>
              <Ionicons name={merchantIcon as any} size={24} color={colors.merchant || colors.primary} />
            </View>
            <View>
              <Text style={styles.merchantLabel}>Paying to</Text>
              <Text style={styles.merchantValue}>{paymentInfo.merchantName}</Text>
              <Text style={styles.merchantIdText}>ID: {paymentInfo.merchantId}</Text>
            </View>
          </View>

          <View style={styles.studentInfo}>
            <View style={styles.studentAvatar}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.studentName}>{paymentInfo.studentName}</Text>
              <Text style={styles.studentId}>ID: {paymentInfo.studentId}</Text>
            </View>
          </View>

          <View style={styles.qrContainer}>
            <QRCode value={qrData} size={220} backgroundColor="#fff" color="#000" />
          </View>

          <Text style={styles.instructionsTitle}>Show this QR to Merchant</Text>
          <Text style={styles.instructionsText}>
            The merchant will scan this QR code to complete the payment.{'\n'}
            Money will be deducted from your wallet automatically.
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Transaction Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={[styles.detailValue, styles.detailValueSmall]}>
              {paymentInfo.transactionId}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Balance</Text>
            <Text style={styles.detailValue}>₹{balance.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Balance After Payment</Text>
            <Text style={[styles.detailValue, { color: colors.student || colors.primary }]}>
              ₹{(balance - paymentInfo.amount).toFixed(2)}
            </Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Created At</Text>
            <Text style={styles.detailValue}>
              {new Date(paymentInfo.timestamp).toLocaleTimeString('en-IN', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.resetButtonText}>Generate New QR</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ── Form View ─────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Generate Payment QR</Text>
        {balanceLoading ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 4 }} />
        ) : (
          <Text style={styles.subtitle}>Balance: ₹{balance.toFixed(2)}</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enter Amount</Text>
        <View style={styles.amountInputContainer}>
          <Text style={styles.rupeeSymbol}>₹</Text>
          <TextInput
            style={styles.amountInput}
            value={amount}
            placeholder="0.00"
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9.]/g, '');
              const parts = cleaned.split('.');
              setAmount(parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned);
            }}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textLight}
            maxLength={10}
          />
        </View>

        <View style={styles.quickAmounts}>
          {quickAmounts.map((amt) => (
            <TouchableOpacity
              key={amt}
              style={[styles.quickBtn, amount === amt.toString() && styles.quickBtnActive]}
              onPress={() => setAmount(amt.toString())}
              activeOpacity={0.7}
            >
              <Text style={[styles.quickBtnText, amount === amt.toString() && styles.quickBtnTextActive]}>
                ₹{amt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Merchant</Text>
        <View style={styles.merchantsGrid}>
          {merchants.map((merchant) => (
            <TouchableOpacity
              key={merchant.id}
              style={[styles.merchantCard, selectedMerchant === merchant.id && styles.merchantCardActive]}
              onPress={() => setSelectedMerchant(merchant.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.merchantIcon, selectedMerchant === merchant.id && styles.merchantIconActive]}>
                <Ionicons
                  name={merchant.icon as any}
                  size={24}
                  color={selectedMerchant === merchant.id ? '#fff' : colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.merchantName, selectedMerchant === merchant.id && styles.merchantNameActive]}>
                  {merchant.name as string}
                </Text>
                <Text style={styles.merchantIdBadge}>{merchant.id}</Text>
              </View>
              {selectedMerchant === merchant.id && (
                <Ionicons name="checkmark-circle" size={24} color={colors.student || colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.generateButton, (!amount || !selectedMerchant) && styles.generateButtonDisabled]}
          onPress={handleGenerateQR}
          activeOpacity={0.8}
          disabled={!amount || !selectedMerchant}
        >
          <Ionicons name="qr-code" size={24} color="#fff" />
          <Text style={styles.generateButtonText}>Generate Payment QR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoCardBottom}>
        <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
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
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingTop: 60, backgroundColor: colors.student || colors.primary },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  closeButton: {
    position: 'absolute', right: 20, top: 60,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  amountInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 16,
    paddingHorizontal: 20, borderWidth: 2,
    borderColor: colors.student || colors.primary,
  },
  rupeeSymbol: { fontSize: 32, fontWeight: 'bold', color: colors.text, marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, fontWeight: 'bold', color: colors.text, padding: 20 },
  quickAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  quickBtn: {
    width: '23%', backgroundColor: colors.card,
    padding: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  quickBtnActive: { backgroundColor: colors.student || colors.primary, borderColor: colors.student || colors.primary },
  quickBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
  quickBtnTextActive: { color: '#fff' },
  merchantsGrid: { gap: 12 },
  merchantCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, padding: 16,
    borderRadius: 12, borderWidth: 2, borderColor: colors.border,
  },
  merchantCardActive: { borderColor: colors.student || colors.primary, backgroundColor: (colors.student || colors.primary) + '10' },
  merchantIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: (colors.primary || '#000') + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  merchantIconActive: { backgroundColor: colors.student || colors.primary },
  merchantName: { fontSize: 16, fontWeight: '600', color: colors.text },
  merchantNameActive: { color: colors.student || colors.primary },
  merchantIdBadge: { fontSize: 11, color: colors.textLight, marginTop: 2, fontFamily: 'monospace' },
  generateButton: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: colors.student || colors.primary,
    padding: 18, borderRadius: 12, gap: 10,
  },
  generateButtonDisabled: { backgroundColor: colors.textLight, opacity: 0.5 },
  generateButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  infoCardBottom: {
    flexDirection: 'row', backgroundColor: colors.card,
    margin: 20, marginTop: 0, padding: 16,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  infoContent: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  infoText: { fontSize: 12, color: colors.textLight, lineHeight: 20 },
  qrCard: {
    backgroundColor: colors.card, margin: 20,
    padding: 24, borderRadius: 20, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  qrContainer: {
    backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  paymentInfo: { alignItems: 'center', marginBottom: 20 },
  amountLabel: { fontSize: 14, color: colors.textLight, marginBottom: 4 },
  amountValue: { fontSize: 42, fontWeight: 'bold', color: colors.student || colors.primary },
  merchantInfo: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, width: '100%',
    padding: 12, borderRadius: 12, marginBottom: 12, gap: 12,
  },
  merchantIconSmall: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: (colors.merchant || colors.primary) + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  merchantLabel: { fontSize: 11, color: colors.textLight },
  merchantValue: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  merchantIdText: { fontSize: 11, color: colors.textLight, fontFamily: 'monospace' },
  studentInfo: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, width: '100%',
    padding: 12, borderRadius: 12, gap: 12, marginBottom: 20,
  },
  studentAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.student || colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  studentName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  studentId: { fontSize: 12, color: colors.textLight },
  instructionsTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 4, textAlign: 'center' },
  instructionsText: { fontSize: 12, color: colors.textLight, lineHeight: 20, textAlign: 'center' },
  detailsCard: {
    backgroundColor: colors.card, margin: 20, marginTop: 0,
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
  },
  detailsTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 16 },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: 13, color: colors.textLight, flex: 1 },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.text, textAlign: 'right' },
  detailValueSmall: { fontSize: 11, flex: 1 },
  actions: { padding: 20, paddingTop: 0 },
  resetButton: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: colors.student || colors.primary,
    padding: 16, borderRadius: 12, gap: 8,
  },
  resetButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});
