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
import { useTheme } from '../../hooks/useTheme';
import { MERCHANT_CATEGORIES } from '../../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function PayScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrData, setQrData] = useState('');


  useEffect(() => {
    loadBalance();
    // Debug: Log user object to see its structure
    console.log('👤 Current User Object:', JSON.stringify(user, null, 2));
  }, [user]);


  const loadBalance = async () => {
    try {
      if (user?.email) {
        const walletData = await AsyncStorage.getItem(`WALLET_${user.email}`);
        console.log('💰 Wallet Data:', walletData);
        if (walletData) {
          const wallet = JSON.parse(walletData);
          setBalance(wallet.balance || 0);
        } else {
          // Initialize wallet if not exists
          const initialWallet = { balance: 1000 }; // Default ₹1000 for testing
          await AsyncStorage.setItem(`WALLET_${user.email}`, JSON.stringify(initialWallet));
          setBalance(1000);
        }
      }
    } catch (error) {
      console.error('Load balance error:', error);
    }
  };


  const merchants = Object.entries(MERCHANT_CATEGORIES).map(([id, name]) => ({
    id,
    name,
    icon: id.includes('CAFE') ? 'restaurant' :
          id.includes('LIBRARY') ? 'book' :
          id.includes('STATIONARY') ? 'storefront' : 'cafe',
  }));


  const handleGenerateQR = () => {
    console.log('🔵 === Generate QR Button Pressed ===');
    console.log('👤 User:', user);
    console.log('💰 Amount entered:', amount);
    console.log('🏪 Selected Merchant ID:', selectedMerchant);
    console.log('💵 Current Balance:', balance);

    const payAmount = parseFloat(amount);
    console.log('💵 Parsed Amount:', payAmount, '| Type:', typeof payAmount);

    // Validation 1: Merchant selected
    if (!selectedMerchant) {
      console.log('❌ Validation Failed: No merchant selected');
      Alert.alert('Select Merchant', 'Please select a merchant to pay');
      return;
    }

    // Validation 2: Valid amount
    if (!amount || amount.trim() === '') {
      console.log('❌ Validation Failed: Amount is empty');
      Alert.alert('Invalid Amount', 'Please enter an amount');
      return;
    }

    if (isNaN(payAmount) || payAmount <= 0) {
      console.log('❌ Validation Failed: Amount is not a valid number or <= 0');
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    // Validation 3: Sufficient balance
    if (payAmount > balance) {
      console.log('❌ Validation Failed: Insufficient balance');
      Alert.alert('Insufficient Balance', `You only have ₹${balance.toFixed(2)} in your wallet`);
      return;
    }

    console.log('✅ All validations passed! Generating QR...');

    // Generate unique transaction ID
    const transactionId = `TXN${Date.now()}`;

    // Extract student info with multiple fallbacks
    const studentId = user?.id || user?.studentId || user?.userId || user?._id || 'UNKNOWN_ID';
    const studentName = user?.name || user?.fullName || user?.username || 'Student';
    const studentEmail = user?.email || 'unknown@email.com';

    console.log('📋 Extracted User Info:');
    console.log('  - Student ID:', studentId);
    console.log('  - Student Name:', studentName);
    console.log('  - Student Email:', studentEmail);

    // Create QR data with all payment info
    const paymentData = {
      type: 'payment',
      transactionId: transactionId,
      studentId: studentId,
      studentName: studentName,
      studentEmail: studentEmail,
      merchantId: selectedMerchant,
      merchantName: MERCHANT_CATEGORIES[selectedMerchant],
      amount: payAmount,
      timestamp: new Date().toISOString(),
    };

    console.log('📦 Payment Data Created:', JSON.stringify(paymentData, null, 2));

    const qrString = JSON.stringify(paymentData);
    console.log('🔗 QR String Length:', qrString.length);

    // Update state
    setQrData(qrString);
    setQrGenerated(true);
    
    console.log('✅ QR Generation Complete! State updated.');
    console.log('   - qrGenerated will be:', true);
    console.log('   - qrData length:', qrString.length);
  };


  const handleReset = () => {
    console.log('🔄 Resetting QR generation');
    setAmount('');
    setSelectedMerchant('');
    setQrGenerated(false);
    setQrData('');
    loadBalance();
  };


  const quickAmounts = [50, 100, 200, 500];


  // Debug state changes
  useEffect(() => {
    console.log('📊 State Update - qrGenerated:', qrGenerated, '| qrData length:', qrData.length);
  }, [qrGenerated, qrData]);


  // QR Generated View
  if (qrGenerated && qrData) {
    console.log('🖼️ Rendering QR Code View');
    
    let paymentInfo;
    try {
      paymentInfo = JSON.parse(qrData);
      console.log('✅ QR Data parsed successfully:', paymentInfo);
    } catch (error) {
      console.error('❌ QR Parse Error:', error);
      Alert.alert('Error', 'Failed to parse payment data. Please try again.');
      handleReset();
      return null;
    }
    
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
              color={colors.student}
            />
          </View>


          <View style={styles.paymentInfo}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>
            <Text style={styles.amountValue}>₹{paymentInfo.amount.toFixed(2)}</Text>
          </View>


          <View style={styles.merchantInfo}>
            <View style={styles.merchantIconSmall}>
              <Ionicons 
                name={merchants.find(m => m.id === paymentInfo.merchantId)?.icon as any || 'storefront'} 
                size={24} 
                color={colors.merchant} 
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
          <Ionicons name="information-circle" size={32} color={colors.primary} />
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
            <Text style={[styles.detailValue, styles.detailValueSmall]} numberOfLines={1}>
              {paymentInfo.transactionId}
            </Text>
          </View>


          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Balance</Text>
            <Text style={styles.detailValue}>₹{balance.toFixed(2)}</Text>
          </View>


          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Balance After Payment</Text>
            <Text style={[styles.detailValue, { color: colors.success }]}>
              ₹{(balance - paymentInfo.amount).toFixed(2)}
            </Text>
          </View>


          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Created At</Text>
            <Text style={styles.detailValue}>
              {new Date(paymentInfo.timestamp).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
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
        
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }


  // Payment Form View
  console.log('📝 Rendering Payment Form');
  
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
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
            onChangeText={(text) => {
              // Only allow numbers and decimal point
              const cleaned = text.replace(/[^0-9.]/g, '');
              // Prevent multiple decimal points
              const parts = cleaned.split('.');
              const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : cleaned;
              setAmount(formatted);
              console.log('💰 Amount changed to:', formatted);
            }}
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textLight}
            maxLength={10}
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
              onPress={() => {
                setAmount(amt.toString());
                console.log('💰 Quick amount selected:', amt);
              }}
              activeOpacity={0.7}
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
              onPress={() => {
                setSelectedMerchant(merchant.id);
                console.log('🏪 Merchant selected:', merchant.id, '-', merchant.name);
              }}
              activeOpacity={0.7}
            >
              <View style={[
                styles.merchantIcon,
                selectedMerchant === merchant.id && styles.merchantIconActive,
              ]}>
                <Ionicons
                  name={merchant.icon as any}
                  size={28}
                  color={selectedMerchant === merchant.id ? '#fff' : colors.primary}
                />
              </View>
              <Text style={[
                styles.merchantName,
                selectedMerchant === merchant.id && styles.merchantNameActive,
              ]}>
                {merchant.name}
              </Text>
              {selectedMerchant === merchant.id && (
                <Ionicons name="checkmark-circle" size={20} color={colors.student} />
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
            (!amount || !selectedMerchant || parseFloat(amount) <= 0) && styles.generateButtonDisabled,
          ]}
          onPress={handleGenerateQR}
          disabled={!amount || !selectedMerchant || parseFloat(amount) <= 0}
          activeOpacity={0.7}
        >
          <Ionicons name="qr-code" size={24} color="#fff" />
          <Text style={styles.generateButtonText}>
            Generate Payment QR
          </Text>
        </TouchableOpacity>
        
        {/* Debug Info (Remove in production) */}
        {__DEV__ && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Debug: Amount={amount} | Merchant={selectedMerchant} | Valid={amount && selectedMerchant && parseFloat(amount) > 0 ? 'Yes' : 'No'}
            </Text>
          </View>
        )}
      </View>


      {/* Info Card */}
      <View style={styles.infoCardBottom}>
        <Ionicons name="information-circle" size={24} color={colors.primary} />
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.student,
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
    color: colors.text,
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: colors.student,
  },
  rupeeSymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
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
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickBtnActive: {
    backgroundColor: colors.student,
    borderColor: colors.student,
  },
  quickBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
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
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },
  merchantCardActive: {
    borderColor: colors.student,
    backgroundColor: colors.student + '10',
  },
  merchantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  merchantIconActive: {
    backgroundColor: colors.student,
  },
  merchantName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  merchantNameActive: {
    color: colors.student,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.student,
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  generateButtonDisabled: {
    backgroundColor: colors.textLight,
    opacity: 0.5,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  debugInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  debugText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  infoCardBottom: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 20,
  },
  qrCard: {
    backgroundColor: colors.card,
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: colors.student,
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
    color: colors.textLight,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 42,
    fontWeight: 'bold',
    color: colors.student,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
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
    backgroundColor: colors.merchant + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantLabel: {
    fontSize: 11,
    color: colors.textLight,
  },
  merchantValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    width: '100%',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.student,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  studentId: {
    fontSize: 12,
    color: colors.textLight,
  },
  instructionsCard: {
    flexDirection: 'row',
    backgroundColor: colors.primary + '15',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 12,
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 13,
    color: colors.textLight,
    lineHeight: 20,
  },
  detailsCard: {
    backgroundColor: colors.card,
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textLight,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  detailValueSmall: {
    fontSize: 11,
    flex: 1,
  },
  actions: {
    padding: 20,
    paddingTop: 0,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.student,
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
