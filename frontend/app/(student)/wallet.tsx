import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WalletScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [balance, setBalance] = useState(0);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount);

    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    if (amount < 10) {
      Alert.alert('Minimum Amount', 'Minimum recharge amount is ₹10');
      return;
    }

    if (amount > 10000) {
      Alert.alert('Maximum Amount', 'Maximum recharge amount is ₹10,000');
      return;
    }

    setLoading(true);

    try {
      if (!user?.email) throw new Error('User not found');

      // Get current wallet
      const walletData = await AsyncStorage.getItem(`WALLET_${user.email}`);
      const wallet = walletData ? JSON.parse(walletData) : { balance: 0, transactions: [] };

      // Create recharge transaction
      const transaction = {
        transaction_id: `TXN${Date.now()}`,
        type: 'recharge',
        amount,
        timestamp: new Date().toISOString(),
        status: 'completed',
        student_id: user.studentId,
        student_name: user.name,
        merchant_id: 'WALLET_RECHARGE',
      };

      // Update balance
      wallet.balance = (wallet.balance || 0) + amount;
      wallet.transactions = [transaction, ...(wallet.transactions || [])];

      // Save wallet
      await AsyncStorage.setItem(`WALLET_${user.email}`, JSON.stringify(wallet));

      // Save to all transactions
      const allTxnsData = await AsyncStorage.getItem('ALL_TRANSACTIONS');
      const allTxns = allTxnsData ? JSON.parse(allTxnsData) : [];
      allTxns.unshift(transaction);
      await AsyncStorage.setItem('ALL_TRANSACTIONS', JSON.stringify(allTxns));

      setBalance(wallet.balance);
      setRechargeAmount('');

      Alert.alert(
        '✅ Success!',
        `₹${amount} has been added to your wallet.\n\nNew Balance: ₹${wallet.balance.toFixed(2)}`
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to recharge wallet');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        <View style={styles.balanceInfo}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.balanceInfoText}>Secure Wallet</Text>
        </View>
      </View>

      {/* Recharge Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recharge Amount</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.rupeeSymbol}>₹</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            value={rechargeAmount}
            onChangeText={setRechargeAmount}
            keyboardType="numeric"
            placeholderTextColor={colors.textLight}
          />
        </View>

        {/* Quick Amount Buttons */}
        <View style={styles.quickAmounts}>
          {quickAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.quickBtn,
                rechargeAmount === amount.toString() && styles.quickBtnActive,
              ]}
              onPress={() => setRechargeAmount(amount.toString())}
            >
              <Text
                style={[
                  styles.quickBtnText,
                  rechargeAmount === amount.toString() && styles.quickBtnTextActive,
                ]}
              >
                ₹{amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recharge Button */}
        <TouchableOpacity
          style={styles.rechargeButton}
          onPress={handleRecharge}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle" size={24} color="#fff" />
              <Text style={styles.rechargeButtonText}>Recharge Wallet</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Info Cards */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Instant Recharge</Text>
            <Text style={styles.infoText}>Money is added to your wallet instantly</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={colors.success} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>100% Secure</Text>
            <Text style={styles.infoText}>All transactions are encrypted and secure</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="time" size={24} color={colors.warning} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>No Expiry</Text>
            <Text style={styles.infoText}>Wallet balance never expires</Text>
          </View>
        </View>
      </View>
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
  balanceCard: {
    backgroundColor: colors.card,
    margin: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  balanceInfoText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: colors.student,
  },
  rupeeSymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    padding: 16,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  quickBtn: {
    width: '31%',
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
  rechargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.student,
    padding: 18,
    borderRadius: 12,
    marginTop: 24,
    gap: 10,
    shadowColor: colors.student,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rechargeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: colors.textLight,
  },
});
