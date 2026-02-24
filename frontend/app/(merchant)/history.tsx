import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { apiRequest } from '../../utils/api';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = useCallback(async () => {
    try {
      // ✅ Fetch from backend
      const data = await apiRequest<{ transactions: any[] }>('/api/transactions/history');
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Load transactions error:', error);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const getTimestamp = (item: any) =>
    item.createdAt || item.timestamp || item.qrTimestamp || new Date().toISOString();

  const getStudentName = (item: any) =>
    item.student?.name || item.student_name || item.studentName || 'Unknown Student';

  const getDescription = (item: any) =>
    item.description || `Payment from ${getStudentName(item)}`;

  const getAmount = (item: any) =>
    typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0;

  const renderTransaction = ({ item }: { item: any }) => {
    const timestamp = getTimestamp(item);
    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionIcon}>
          <Ionicons name="arrow-down" size={20} color={colors.success} />
        </View>
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionStudent}>{getStudentName(item)}</Text>
          <Text style={styles.transactionDescription}>{getDescription(item)}</Text>
          <Text style={styles.transactionDate}>
            {new Date(timestamp).toLocaleDateString()} •{' '}
            {new Date(timestamp).toLocaleTimeString()}
          </Text>
        </View>
        <Text style={styles.transactionAmount}>+₹{getAmount(item).toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaction History</Text>
      </View>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={64} color={colors.textLight} />
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>Your payment history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={(item, index) =>
            item.transactionId || item.transaction_id || item._id || String(index)
          }
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.merchant]}
            />
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 24, paddingTop: 60, backgroundColor: colors.card },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: colors.text },
  list: { padding: 24, gap: 12 },
  transactionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 16, padding: 16,
  },
  transactionIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.success + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  transactionDetails: { flex: 1 },
  transactionStudent: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  transactionDescription: { fontSize: 13, color: colors.textLight, marginBottom: 4 },
  transactionDate: { fontSize: 12, color: colors.textLight },
  transactionAmount: { fontSize: 18, fontWeight: 'bold', color: colors.success },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: colors.textLight, marginTop: 8, textAlign: 'center' },
});
