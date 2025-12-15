import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useWallet } from '../../hooks/useWallet';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/Config';

export default function ScanScreen() {
  const [qrInput, setQrInput] = useState('');
  const [processing, setProcessing] = useState(false);
  const { merchantBalance, processPayment } = useWallet();
  const { user } = useAuth();

  const handleProcessPayment = async () => {
    if (!qrInput.trim()) {
      Alert.alert('Error', 'Please paste QR data');
      return;
    }

    setProcessing(true);

    try {
      const result = await processPayment(qrInput);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        setQrInput('');
      } else {
        Alert.alert('Failed', result.message);
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Payment QR</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Merchant Balance</Text>
          <Text style={styles.balanceAmount}>₹ {merchantBalance.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.merchantName}>{user?.merchantName}</Text>
        <Text style={styles.merchantId}>ID: {user?.merchantId}</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Paste QR Data</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Paste encrypted QR data here..."
            placeholderTextColor="#999"
            value={qrInput}
            onChangeText={setQrInput}
            multiline
            numberOfLines={6}
            editable={!processing}
          />
        </View>

        <TouchableOpacity
          style={[styles.processButton, processing && styles.buttonDisabled]}
          onPress={handleProcessPayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.processButtonText}>Process Payment</Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 How to scan:</Text>
          <Text style={styles.infoText}>
            1. Ask student to show QR code{'\n'}
            2. Long-press QR and tap "Decrypt"{'\n'}
            3. Copy the encrypted data{'\n'}
            4. Paste it above and process
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.merchant, padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  balanceCard: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 16, borderRadius: 12, alignItems: 'center' },
  balanceLabel: { color: '#fff', fontSize: 14, marginBottom: 4 },
  balanceAmount: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  content: { padding: 20 },
  merchantName: { fontSize: 20, fontWeight: 'bold', color: COLORS.text, marginBottom: 4 },
  merchantId: { fontSize: 14, color: COLORS.textLight, marginBottom: 24 },
  inputContainer: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 8 },
  textArea: { backgroundColor: '#fff', borderRadius: 8, padding: 12, fontSize: 14, borderWidth: 1, borderColor: COLORS.border, color: COLORS.text, minHeight: 120, textAlignVertical: 'top' },
  processButton: { backgroundColor: COLORS.merchant, padding: 16, borderRadius: 8, alignItems: 'center' },
  processButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  buttonDisabled: { opacity: 0.5 },
  infoBox: { backgroundColor: '#FFF9E6', padding: 16, borderRadius: 8, marginTop: 24, borderLeftWidth: 4, borderLeftColor: COLORS.warning },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  infoText: { fontSize: 14, color: COLORS.textLight, lineHeight: 20 },
});
