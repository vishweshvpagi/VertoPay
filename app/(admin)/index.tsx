import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { COLORS } from '../../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen() {
  const { user, logout } = useAuth();
  const { getAllUsers, getAllTransactions, getSuspiciousTransactions } = useAdmin();
  const router = useRouter();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalMerchants: 0,
    activeUsers: 0,
    blockedUsers: 0,
    suspendedUsers: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    reversedTransactions: 0,
    totalVolume: 0,
    todayVolume: 0,
    suspiciousTransactions: 0,
    fraudTransactions: 0,
    avgTransactionAmount: 0,
    totalStudentBalance: 0,
    totalMerchantEarnings: 0,
  });
  const [loading, setLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      const transactions = await getAllTransactions();
      const suspicious = await getSuspiciousTransactions();

      const students = users.filter(u => u.role === 'student');
      const merchants = users.filter(u => u.role === 'merchant');
      const blocked = users.filter(u => u.status === 'blocked');
      const suspended = users.filter(u => u.status === 'suspended');
      const active = users.filter(u => u.status === 'active');
      
      const completedTxns = transactions.filter(t => t.status === 'completed');
      const reversedTxns = transactions.filter(t => t.status === 'reversed');
      const fraudTxns = transactions.filter(t => t.reviewStatus === 'fraud');
      
      const totalVolume = completedTxns
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayVolume = completedTxns
        .filter(t => t.type === 'payment' && new Date(t.timestamp) >= today)
        .reduce((sum, t) => sum + t.amount, 0);

      const avgAmount = completedTxns.length > 0 
        ? totalVolume / completedTxns.length 
        : 0;

      let totalStudentBalance = 0;
      for (const student of students) {
        const walletData = await AsyncStorage.getItem(`WALLET_${student.email}`);
        if (walletData) {
          const { balance } = JSON.parse(walletData);
          totalStudentBalance += balance || 0;
        }
      }

      let totalMerchantEarnings = 0;
      for (const merchant of merchants) {
        const walletData = await AsyncStorage.getItem(`MERCHANT_WALLET_${merchant.email}`);
        if (walletData) {
          const { balance } = JSON.parse(walletData);
          totalMerchantEarnings += balance || 0;
        }
      }

      setStats({
        totalUsers: users.length,
        totalStudents: students.length,
        totalMerchants: merchants.length,
        activeUsers: active.length,
        blockedUsers: blocked.length,
        suspendedUsers: suspended.length,
        totalTransactions: transactions.length,
        completedTransactions: completedTxns.length,
        reversedTransactions: reversedTxns.length,
        totalVolume,
        todayVolume,
        suspiciousTransactions: suspicious.length,
        fraudTransactions: fraudTxns.length,
        avgTransactionAmount: avgAmount,
        totalStudentBalance,
        totalMerchantEarnings,
      });

      const recent = transactions.slice(0, 5);
      setRecentActivity(recent);
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
    }
  };

const handleLogout = async () => {
  try {
    await AsyncStorage.removeItem('AUTH_TOKEN');
    await AsyncStorage.removeItem('CURRENT_USER');
    await logout();
    router.replace('/(auth)/login');
  } catch (error) {
    console.error('Logout error:', error);
  }
};




  const clearAllData = () => {
    Alert.alert(
      '⚠️ Danger Zone',
      'This will delete ALL data including users, transactions, and wallets. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('Success', 'All data cleared!', [
              {
                text: 'OK',
                onPress: () => {
                  logout();
                  router.replace('/(auth)/login');
                },
              },
            ]);
          },
        },
      ]
    );
  };

  const exportData = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const allData = await AsyncStorage.multiGet(allKeys);
      const dataObject = Object.fromEntries(allData);
      console.log('📊 EXPORTED DATA:', JSON.stringify(dataObject, null, 2));
      Alert.alert('Success', 'Data exported to console. Check your terminal/logs.');
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadStats} />}
    >
      {/* Header - FIXED */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Admin Dashboard</Text>
          <Text style={styles.email}>{user?.name || user?.email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.admin} />
        </TouchableOpacity>
      </View>

      {/* Quick Stats Cards */}
      <View style={styles.quickStatsContainer}>
        <View style={[styles.quickStatCard, { backgroundColor: COLORS.primary }]}>
          <Ionicons name="people" size={32} color="#fff" />
          <Text style={styles.quickStatNumber}>{stats.totalUsers}</Text>
          <Text style={styles.quickStatLabel}>Total Users</Text>
        </View>

        <View style={[styles.quickStatCard, { backgroundColor: COLORS.success }]}>
          <Ionicons name="cash" size={32} color="#fff" />
          <Text style={styles.quickStatNumber}>₹{stats.totalVolume}</Text>
          <Text style={styles.quickStatLabel}>Total Volume</Text>
        </View>

        <View style={[styles.quickStatCard, { backgroundColor: COLORS.warning }]}>
          <Ionicons name="alert-circle" size={32} color="#fff" />
          <Text style={styles.quickStatNumber}>{stats.suspiciousTransactions}</Text>
          <Text style={styles.quickStatLabel}>Suspicious</Text>
        </View>
      </View>

      {/* Alert Banner */}
      {stats.suspiciousTransactions > 0 && (
        <TouchableOpacity
          style={styles.alertCard}
          onPress={() => router.push('/(admin)/fraud')}
        >
          <Ionicons name="warning" size={32} color={COLORS.danger} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>⚠️ Action Required</Text>
            <Text style={styles.alertText}>
              {stats.suspiciousTransactions} transactions need review
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      )}

      {/* User Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: COLORS.student + '15' }]}>
            <Ionicons name="school" size={28} color={COLORS.student} />
            <Text style={styles.statNumber}>{stats.totalStudents}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: COLORS.merchant + '15' }]}>
            <Ionicons name="storefront" size={28} color={COLORS.merchant} />
            <Text style={styles.statNumber}>{stats.totalMerchants}</Text>
            <Text style={styles.statLabel}>Merchants</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />
            <Text style={styles.statNumber}>{stats.activeUsers}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: COLORS.danger + '15' }]}>
            <Ionicons name="ban" size={28} color={COLORS.danger} />
            <Text style={styles.statNumber}>{stats.blockedUsers}</Text>
            <Text style={styles.statLabel}>Blocked</Text>
          </View>
        </View>
      </View>

      {/* Transaction Analytics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction Analytics</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
            <Ionicons name="receipt" size={28} color={COLORS.primary} />
            <Text style={styles.statNumber}>{stats.totalTransactions}</Text>
            <Text style={styles.statLabel}>Total Txns</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
            <Ionicons name="checkmark-done" size={28} color={COLORS.success} />
            <Text style={styles.statNumber}>{stats.completedTransactions}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: COLORS.warning + '15' }]}>
            <Ionicons name="refresh" size={28} color={COLORS.warning} />
            <Text style={styles.statNumber}>{stats.reversedTransactions}</Text>
            <Text style={styles.statLabel}>Reversed</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: COLORS.danger + '15' }]}>
            <Ionicons name="close-circle" size={28} color={COLORS.danger} />
            <Text style={styles.statNumber}>{stats.fraudTransactions}</Text>
            <Text style={styles.statLabel}>Fraud</Text>
          </View>
        </View>
      </View>

      {/* Financial Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Overview</Text>
        <View style={styles.financialCards}>
          <View style={styles.financialCard}>
            <View style={styles.financialHeader}>
              <Ionicons name="trending-up" size={24} color={COLORS.success} />
              <Text style={styles.financialTitle}>Total Volume</Text>
            </View>
            <Text style={styles.financialAmount}>₹{stats.totalVolume.toFixed(2)}</Text>
            <Text style={styles.financialSubtext}>All-time transactions</Text>
          </View>

          <View style={styles.financialCard}>
            <View style={styles.financialHeader}>
              <Ionicons name="today" size={24} color={COLORS.primary} />
              <Text style={styles.financialTitle}>Today's Volume</Text>
            </View>
            <Text style={styles.financialAmount}>₹{stats.todayVolume.toFixed(2)}</Text>
            <Text style={styles.financialSubtext}>Last 24 hours</Text>
          </View>

          <View style={styles.financialCard}>
            <View style={styles.financialHeader}>
              <Ionicons name="calculator" size={24} color={COLORS.warning} />
              <Text style={styles.financialTitle}>Avg Transaction</Text>
            </View>
            <Text style={styles.financialAmount}>₹{stats.avgTransactionAmount.toFixed(2)}</Text>
            <Text style={styles.financialSubtext}>Per transaction</Text>
          </View>

          <View style={styles.financialCard}>
            <View style={styles.financialHeader}>
              <Ionicons name="wallet" size={24} color={COLORS.student} />
              <Text style={styles.financialTitle}>Student Balance</Text>
            </View>
            <Text style={styles.financialAmount}>₹{stats.totalStudentBalance.toFixed(2)}</Text>
            <Text style={styles.financialSubtext}>Total in wallets</Text>
          </View>

          <View style={styles.financialCard}>
            <View style={styles.financialHeader}>
              <Ionicons name="briefcase" size={24} color={COLORS.merchant} />
              <Text style={styles.financialTitle}>Merchant Earnings</Text>
            </View>
            <Text style={styles.financialAmount}>₹{stats.totalMerchantEarnings.toFixed(2)}</Text>
            <Text style={styles.financialSubtext}>Total earned</Text>
          </View>

          <View style={styles.financialCard}>
            <View style={styles.financialHeader}>
              <Ionicons name="trending-down" size={24} color={COLORS.admin} />
              <Text style={styles.financialTitle}>Platform Fee</Text>
            </View>
            <Text style={styles.financialAmount}>₹{(stats.totalVolume * 0.02).toFixed(2)}</Text>
            <Text style={styles.financialSubtext}>2% commission</Text>
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/transactions')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {recentActivity.length > 0 ? (
          recentActivity.map((activity, index) => (
            <View key={index} style={styles.activityCard}>
              <View style={[
                styles.activityIcon,
                { backgroundColor: activity.type === 'payment' ? COLORS.primary + '20' : COLORS.success + '20' }
              ]}>
                <Ionicons
                  name={activity.type === 'payment' ? 'arrow-forward' : 'add'}
                  size={20}
                  color={activity.type === 'payment' ? COLORS.primary : COLORS.success}
                />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>
                  {activity.type === 'payment' ? 'Payment' : 'Recharge'}
                </Text>
                <Text style={styles.activitySubtitle}>
                  {activity.student_id} • {new Date(activity.timestamp).toLocaleString()}
                </Text>
              </View>
              <Text style={styles.activityAmount}>₹{activity.amount}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noActivity}>No recent activity</Text>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin)/users')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.primary + '20' }]}>
            <Ionicons name="people" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.actionText}>Manage Users</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin)/transactions')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.success + '20' }]}>
            <Ionicons name="receipt" size={24} color={COLORS.success} />
          </View>
          <Text style={styles.actionText}>View Transactions</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin)/fraud')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.danger + '20' }]}>
            <Ionicons name="shield" size={24} color={COLORS.danger} />
          </View>
          <Text style={styles.actionText}>Fraud Detection</Text>
          {stats.suspiciousTransactions > 0 && (
            <View style={styles.actionBadge}>
              <Text style={styles.actionBadgeText}>{stats.suspiciousTransactions}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(admin)/audit')}
        >
          <View style={[styles.actionIcon, { backgroundColor: COLORS.warning + '20' }]}>
            <Ionicons name="document-text" size={24} color={COLORS.warning} />
          </View>
          <Text style={styles.actionText}>Audit Log</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      {/* System Tools */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Tools</Text>
        
        <TouchableOpacity
          style={styles.toolButton}
          onPress={exportData}
        >
          <Ionicons name="download" size={20} color={COLORS.primary} />
          <Text style={styles.toolText}>Export All Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolButton}
          onPress={loadStats}
        >
          <Ionicons name="refresh" size={20} color={COLORS.success} />
          <Text style={styles.toolText}>Refresh Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolButton, styles.dangerButton]}
          onPress={clearAllData}
        >
          <Ionicons name="trash" size={20} color={COLORS.danger} />
          <Text style={[styles.toolText, { color: COLORS.danger }]}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>VertoPay Admin Panel v1.0.0</Text>
        <Text style={styles.footerText}>Last updated: {new Date().toLocaleString()}</Text>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.admin,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  email: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  logoutButton: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  quickStatsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  quickStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  quickStatLabel: {
    fontSize: 11,
    color: '#fff',
    marginTop: 4,
    opacity: 0.9,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.danger + '10',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  alertText: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  section: {
    padding: 16,
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
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  financialCards: {
    gap: 12,
  },
  financialCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  financialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  financialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  financialAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  financialSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  activitySubtitle: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  noActivity: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  actionBadge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  toolText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  dangerButton: {
    borderWidth: 1,
    borderColor: COLORS.danger,
    backgroundColor: COLORS.danger + '10',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
});
