import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/Config';

export default function MerchantHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [todayTransactions, setTodayTransactions] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const walletData = await AsyncStorage.getItem(`MERCHANT_WALLET_${user.email}`);
      
      if (walletData) {
        const wallet = JSON.parse(walletData);
        setBalance(wallet.balance || 0);
        
        // Calculate today's earnings
        const today = new Date().toDateString();
        const todayTxns = wallet.transactions.filter((t: any) => 
          new Date(t.date).toDateString() === today
        );
        
        const earnings = todayTxns.reduce((sum: number, t: any) => sum + t.amount, 0);
        setTodayEarnings(earnings);
        setTodayTransactions(todayTxns.length);
        
        // Get recent transactions (last 5)
        setRecentTransactions(wallet.transactions.slice(0, 5));
      }
    } catch (error) {
      console.error('Load data error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.merchantName}>{user?.merchantName || user?.name}</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="storefront" size={24} color={COLORS.merchant} />
        </View>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Ionicons name="wallet" size={24} color={COLORS.merchant} />
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
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(merchant)/scan')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.merchant + '20' }]}>
              <Ionicons name="scan" size={28} color={COLORS.merchant} />
            </View>
            <Text style={styles.actionText}>Scan QR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(merchant)/history')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
              <Ionicons name="time" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(merchant)/transactions')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '20' }]}>
              <Ionicons name="receipt" size={28} color={COLORS.success} />
            </View>
            <Text style={styles.actionText}>All Transactions</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(merchant)/profile')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.textLight + '20' }]}>
              <Ionicons name="settings" size={28} color={COLORS.textLight} />
            </View>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push('/(merchant)/history')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Scan a student QR to get started</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction: any) => (
              <View key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionIcon}>
                  <Ionicons name="arrow-down" size={20} color={COLORS.success} />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionStudent}>{transaction.student}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(transaction.date).toLocaleDateString()} • {new Date(transaction.date).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.transactionAmount}>+₹{transaction.amount.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  merchantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 4,
  },
  badge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.merchant + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    backgroundColor: COLORS.merchant,
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  section: {
    padding: 24,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    color: COLORS.merchant,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  emptyState: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionStudent: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
  },
});
