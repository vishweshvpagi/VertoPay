import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/Config';

interface BalanceCardProps {
  balance: number;
  onRecharge?: () => void;
  showRechargeButton?: boolean;
}

export default function BalanceCard({
  balance,
  onRecharge,
  showRechargeButton = true,
}: BalanceCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Available Balance</Text>
      <Text style={styles.amount}>₹ {balance.toLocaleString('en-IN')}</Text>
      
      {showRechargeButton && onRecharge && (
        <TouchableOpacity style={styles.rechargeButton} onPress={onRecharge}>
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.rechargeText}>Recharge Wallet</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    padding: 24,
    borderRadius: 20,
    marginVertical: 16,
  },
  label: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
    fontWeight: '500',
  },
  amount: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  rechargeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  rechargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
