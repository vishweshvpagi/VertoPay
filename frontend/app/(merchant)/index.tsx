import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions, Platform, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { apiRequest } from '../../utils/api';

export default function MerchantHomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    try {
      // ✅ Fetch balance from backend
      const meData = await apiRequest<{ user: any }>('/api/auth/me');
      setBalance(meData.user?.balance ?? 0);

      // ✅ Fetch transactions from backend
      const txnData = await apiRequest<{ transactions: any[] }>('/api/transactions/history');
      const transactions = txnData.transactions || [];

      // Calculate today's stats
      const today = new Date().toDateString();
      const todayTxns = transactions.filter((t: any) => {
        const ts = t.createdAt || t.timestamp || t.qrTimestamp;
        return ts && new Date(ts).toDateString() === today;
      });

      const earnings = todayTxns.reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      setTodayEarnings(earnings);
      setTodayTransactions(todayTxns.length);

      // Last 5 transactions
      setRecentTransactions(transactions.slice(0, 5));
    } catch (error) {
      console.error('Load data error:', error);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Helper accessors
  const getTimestamp = (t: any) =>
    t.createdAt || t.timestamp || t.qrTimestamp || new Date().toISOString();

  const getStudentName = (t: any) =>
    t.student?.name || t.student_name || t.studentName || 'Unknown Student';

  const getAmount = (t: any) =>
    typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;

  const getTxnId = (t: any) =>
    t.transactionId || t.transaction_id || t._id || Math.random().toString();

  // Quick actions — only include ones with real routes
  const quickActions = [
    { icon: 'scan', label: 'Scan QR', route: '/(merchant)/scan', color: colors.merchant },
    { icon: 'time', label: 'History', route: '/(merchant)/history', color: colors.primary },
    { icon: 'receipt', label: 'Transactions', route: '/(merchant)/transactions', color: colors.success },
    { icon: 'settings', label: 'Settings', route: '/(merchant)/profile', color: colors.textLight },
    { icon: 'stats-chart', label: 'Analytics', route: '/(merchant)/transactions', color: colors.merchant },
    { icon: 'wallet', label: 'Wallet', route: '/(merchant)/history', color: colors.primary },
    { icon: 'help-circle', label: 'Help', route: '/(merchant)/profile', color: colors.success },
    { icon: 'person', label: 'Profile', route: '/(merchant)/profile', color: colors.warning },
  ] as const;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.merchantName}>{user?.merchantName || user?.name}</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="storefront" size={24} color={colors.merchant} />
        </View>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Ionicons name="wallet" size={24} color={colors.merchant} />
        </View>
        <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>₹{todayEarnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Today's Earnings</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{todayTransactions}</Text>
            <Text style={styles.statLabel}>Transactions Today</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.sectionTitleUnderline} />
        </View>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <View style={styles.sectionTitleUnderline} />
          </View>
          <TouchableOpacity onPress={() => router.push('/(merchant)/history')} activeOpacity={0.7}>
            <View style={styles.viewAllContainer}>
              <Text style={styles.viewAll}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.merchant} />
            </View>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={40} color={colors.merchant} />
            </View>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Scan a student QR to get started</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction: any) => {
              const ts = getTimestamp(transaction);
              return (
                <View key={getTxnId(transaction)} style={styles.transactionCard}>
                  <View style={styles.transactionIcon}>
                    <Ionicons name="arrow-down" size={20} color={colors.success} />
                  </View>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionStudent}>
                      {getStudentName(transaction)}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {new Date(ts).toLocaleDateString()} •{' '}
                      {new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.transactionAmount}>
                    +₹{getAmount(transaction).toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 60 },
  greeting: { fontSize: 14, color: colors.textLight },
  merchantName: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginTop: 4 },
  badge: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.merchant + '20', alignItems: 'center', justifyContent: 'center' },
  balanceCard: {
    backgroundColor: colors.merchant, marginHorizontal: 24,
    borderRadius: 20, padding: 24, marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 },
  stat: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  section: { padding: 24, paddingTop: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitleContainer: { flex: 1, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginBottom: 6 },
  sectionTitleUnderline: { width: 40, height: 3, backgroundColor: colors.merchant, borderRadius: 2, opacity: 0.6 },
  viewAllContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAll: { fontSize: 14, color: colors.merchant, fontWeight: '600' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  actionCard: {
    width: (Dimensions.get('window').width - 68) / 4,
    backgroundColor: colors.card, borderRadius: 16, padding: 14,
    alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: colors.borderLight || colors.border,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  actionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  actionText: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyState: { backgroundColor: colors.card, borderRadius: 20, padding: 40, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight || colors.border },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.merchant + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 4 },
  emptySubtext: { fontSize: 14, color: colors.textLight, marginTop: 8, textAlign: 'center' },
  transactionsList: { gap: 12 },
  transactionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.borderLight || colors.border,
  },
  transactionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.success + '20', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  transactionDetails: { flex: 1 },
  transactionStudent: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  transactionDate: { fontSize: 12, color: colors.textLight },
  transactionAmount: { fontSize: 18, fontWeight: 'bold', color: colors.success },
});
