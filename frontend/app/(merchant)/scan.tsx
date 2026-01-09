import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, MERCHANT_CATEGORIES } from '../../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ScanScreen() {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    getCameraPermission();
  }, []);

  const getCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

const handleBarCodeScanned = ({ data }: { data: string }) => {
  setScanned(true);
  
  try {
    const qrData = JSON.parse(data);
    
    if (qrData.type === 'payment' && qrData.transactionId) {
      // Check if this payment is for the current merchant using email (most reliable)
      const isCorrectMerchant = qrData.merchantEmail === user?.email;

      if (!isCorrectMerchant) {
        Alert.alert(
          '❌ Wrong Merchant',
          `This payment is for a different merchant.\n\nExpected: ${qrData.merchantName}\nYou are: ${user?.merchantName}\n\nStudent may have selected the wrong merchant.`,
          [
            { 
              text: 'OK', 
              onPress: () => {
                setScanned(false);
                setPaymentData(null);
              }
            }
          ]
        );
        return;
      }

      // Correct merchant - proceed with payment
      setPaymentData(qrData);
      setConfirmModalVisible(true);
    } else {
      Alert.alert('Invalid QR Code', 'This is not a valid payment QR code', [
        { text: 'OK', onPress: () => setScanned(false) }
      ]);
    }
  } catch (error) {
    Alert.alert('Invalid QR Code', 'Could not read QR code data', [
      { text: 'OK', onPress: () => setScanned(false) }
    ]);
  }
};


  const handleConfirmPayment = async () => {
    setProcessing(true);

    try {
      // Double check merchant again before processing
      if (paymentData.merchantId !== user?.merchantId || 
          paymentData.merchantEmail !== user?.email) {
        Alert.alert('Error', 'Merchant verification failed');
        setConfirmModalVisible(false);
        setScanned(false);
        setPaymentData(null);
        setProcessing(false);
        return;
      }

      // Check if already processed
      const allTxnsData = await AsyncStorage.getItem('ALL_TRANSACTIONS');
      const allTxns = allTxnsData ? JSON.parse(allTxnsData) : [];
      const exists = allTxns.find((t: any) => t.transaction_id === paymentData.transactionId);

      if (exists) {
        Alert.alert('Already Processed', 'This payment has already been completed');
        setConfirmModalVisible(false);
        setScanned(false);
        setPaymentData(null);
        setProcessing(false);
        return;
      }

      // Get student wallet
      const studentWalletData = await AsyncStorage.getItem(`WALLET_${paymentData.studentEmail}`);
      const studentWallet = studentWalletData 
        ? JSON.parse(studentWalletData) 
        : { balance: 0, transactions: [] };

      // Check student balance
      if (studentWallet.balance < paymentData.amount) {
        Alert.alert(
          'Insufficient Balance',
          `Student only has ₹${studentWallet.balance.toFixed(2)} in wallet`
        );
        setConfirmModalVisible(false);
        setScanned(false);
        setPaymentData(null);
        setProcessing(false);
        return;
      }

      // Create transaction
      const transaction = {
        transaction_id: paymentData.transactionId,
        type: 'payment',
        amount: paymentData.amount,
        timestamp: paymentData.timestamp,
        status: 'completed',
        student_id: paymentData.studentId,
        student_name: paymentData.studentName,
        student_email: paymentData.studentEmail,
        merchant_id: paymentData.merchantId,
        merchant_name: paymentData.merchantName,
        merchant_email: paymentData.merchantEmail,
        riskScore: 0,
        riskFlags: [],
        reviewStatus: 'clean',
      };

      // Deduct from student
      studentWallet.balance -= paymentData.amount;
      studentWallet.transactions = [
        {
          ...transaction,
          description: `Payment to ${paymentData.merchantName}`,
        },
        ...(studentWallet.transactions || [])
      ];
      await AsyncStorage.setItem(`WALLET_${paymentData.studentEmail}`, JSON.stringify(studentWallet));

      // Add to merchant
      const merchantWalletData = await AsyncStorage.getItem(`MERCHANT_WALLET_${user?.email}`);
      const merchantWallet = merchantWalletData 
        ? JSON.parse(merchantWalletData) 
        : { balance: 0, transactions: [] };

      merchantWallet.balance = (merchantWallet.balance || 0) + paymentData.amount;
      merchantWallet.transactions = [
        {
          ...transaction,
          description: `Payment from ${paymentData.studentName}`,
        },
        ...(merchantWallet.transactions || [])
      ];
      await AsyncStorage.setItem(`MERCHANT_WALLET_${user?.email}`, JSON.stringify(merchantWallet));

      // Save to all transactions
      allTxns.unshift(transaction);
      await AsyncStorage.setItem('ALL_TRANSACTIONS', JSON.stringify(allTxns));

      setConfirmModalVisible(false);
      setScanned(false);
      setPaymentData(null);

      Alert.alert(
        '✅ Payment Successful!',
        `Received ₹${paymentData.amount.toFixed(2)} from ${paymentData.studentName}\n\nTransaction ID: ${paymentData.transactionId}`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Payment Failed', error.message || 'Failed to process payment');
      setScanned(false);
    } finally {
      setProcessing(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.merchant} />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Ionicons name="ban" size={64} color={COLORS.danger} />
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={getCameraPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Scan Student QR</Text>
        <Text style={styles.merchantInfo}>Logged in as: {user?.merchantName}</Text>
      </View>

      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        
        {/* Scan Frame Overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Ionicons name="qr-code" size={32} color="#fff" />
          <Text style={styles.instructionText}>
            Scan the student's payment QR code
          </Text>
          <Text style={styles.instructionSubtext}>
            Make sure it's for {user?.merchantName}
          </Text>
        </View>
      </View>

      {/* Reset Button */}
      {scanned && !confirmModalVisible && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={() => {
            setScanned(false);
            setPaymentData(null);
          }}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.resetButtonText}>Scan Again</Text>
        </TouchableOpacity>
      )}

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setConfirmModalVisible(false);
          setScanned(false);
          setPaymentData(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <TouchableOpacity
                onPress={() => {
                  setConfirmModalVisible(false);
                  setScanned(false);
                  setPaymentData(null);
                }}
                disabled={processing}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {paymentData && (
              <>
                {/* Verification Badge */}
                <View style={styles.verificationBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                  <Text style={styles.verificationText}>
                    ✓ Payment verified for {user?.merchantName}
                  </Text>
                </View>

                {/* Amount */}
                <View style={styles.amountSection}>
                  <Text style={styles.amountLabel}>Amount to Receive</Text>
                  <Text style={styles.amountValue}>₹{paymentData.amount.toFixed(2)}</Text>
                </View>

                {/* Student Info */}
                <View style={styles.infoCard}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="person" size={24} color={COLORS.student} />
                  </View>
                  <View style={styles.infoDetails}>
                    <Text style={styles.infoLabel}>Student</Text>
                    <Text style={styles.infoValue}>{paymentData.studentName}</Text>
                    <Text style={styles.infoSubvalue}>ID: {paymentData.studentId}</Text>
                  </View>
                </View>

                {/* Transaction Details */}
                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={styles.detailValue}>{paymentData.transactionId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Merchant</Text>
                    <Text style={styles.detailValue}>{paymentData.merchantName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Merchant ID</Text>
                    <Text style={styles.detailValue}>{paymentData.merchantId}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>
                      {new Date(paymentData.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleConfirmPayment}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                      <Text style={styles.confirmButtonText}>Confirm Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    width: '100%',
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.merchant,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  merchantInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.merchant,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructions: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  instructionSubtext: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.merchant,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
    width: '90%',
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  permissionText: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: 20,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.merchant,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '15',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success,
  },
  amountSection: {
    alignItems: 'center',
    backgroundColor: COLORS.merchant + '15',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.merchant,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.student + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDetails: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 2,
  },
  infoSubvalue: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  detailsSection: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
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
    maxWidth: '60%',
    textAlign: 'right',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.merchant,
    padding: 18,
    borderRadius: 12,
    gap: 10,
  },
  confirmButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
});
