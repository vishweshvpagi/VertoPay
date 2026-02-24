import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Switch from '../../components/ui/Switch';
import { apiRequest } from '../../utils/api';
import { SPACING, MIN_TOUCH_TARGET } from '../../constants/DesignTokens';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      // ✅ Fetch balance from backend
      const meData = await apiRequest<{ user: any }>('/api/auth/me');
      setBalance(meData.user?.balance ?? 0);

      // ✅ Fetch transactions from backend
      const txnData = await apiRequest<{ transactions: any[] }>('/api/transactions/history');
      const transactions = txnData.transactions || [];
      setTransactionCount(transactions.length);

      const spent = transactions
        .filter((t: any) => t.type === 'payment' || t.status === 'completed')
        .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
      setTotalSpent(spent);
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const styles = getStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.student }]}>
          <Text style={styles.title}>Profile</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.avatar, { backgroundColor: colors.student }]}>
              <Ionicons name="person" size={48} color="#fff" />
            </View>
            <Text style={[styles.name, { color: colors.text }]}>{user?.name}</Text>
            <Text style={[styles.email, { color: colors.textLight }]}>{user?.email}</Text>
            {user?.studentId && (
              <View style={[styles.studentIdBadge, { backgroundColor: colors.student + '20' }]}>
                <Ionicons name="card" size={16} color={colors.student} />
                <Text style={[styles.studentIdText, { color: colors.student }]}>{user.studentId}</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          {statsLoading ? (
            <View style={styles.statsLoading}>
              <ActivityIndicator color={colors.student} />
            </View>
          ) : (
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="wallet" size={28} color={colors.success} />
                <Text style={[styles.statNumber, { color: colors.text }]}>₹{balance.toFixed(0)}</Text>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>Balance</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="trending-down" size={28} color={colors.danger} />
                <Text style={[styles.statNumber, { color: colors.text }]}>₹{totalSpent.toFixed(0)}</Text>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>Total Spent</Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="receipt" size={28} color={colors.primary} />
                <Text style={[styles.statNumber, { color: colors.text }]}>{transactionCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textLight }]}>Transactions</Text>
              </View>
            </View>
          )}

          {/* Menu Options */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(student)/history')}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="time" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Transaction History</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(student)/wallet')}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="wallet" size={24} color={colors.success} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Wallet</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>

            <View style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
                <Ionicons name={theme === 'dark' ? 'moon' : 'sunny'} size={24} color={colors.warning} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Dark Mode</Text>
              <Switch value={theme === 'dark'} onValueChange={() => toggleTheme()} />
            </View>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => Alert.alert('Help & Support', 'Contact support at support@vertopay.com')}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="help-circle" size={24} color={colors.admin} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => Alert.alert('About', 'VertoPay v1.0.0\n\nCampus Digital Payment System')}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="information-circle" size={24} color={colors.textLight} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>About</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out" size={24} color={colors.danger} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textLight }]}>VertoPay v1.0.0</Text>
            <Text style={[styles.footerText, { color: colors.textLight }]}>Secure Campus Payment System</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xxxl },
  header: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  profileCard: {
    margin: SPACING.lg, padding: SPACING.xl,
    borderRadius: 20, alignItems: 'center', borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: SPACING.xxs },
  email: { fontSize: 14, marginBottom: SPACING.sm },
  studentIdBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: 20, gap: SPACING.xs },
  studentIdText: { fontSize: 14, fontWeight: '600' },
  statsLoading: { height: 100, justifyContent: 'center', alignItems: 'center' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  statCard: { flex: 1, padding: SPACING.md, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  statNumber: { fontSize: 18, fontWeight: 'bold', marginTop: SPACING.xs },
  statLabel: { fontSize: 11, marginTop: SPACING.xxs },
  section: { padding: SPACING.lg },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', padding: SPACING.md,
    borderRadius: 12, marginBottom: SPACING.sm, borderWidth: 1, minHeight: MIN_TOUCH_TARGET,
  },
  menuIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: SPACING.md, borderRadius: 12, gap: SPACING.sm, borderWidth: 1, minHeight: MIN_TOUCH_TARGET,
  },
  logoutText: { fontSize: 18, fontWeight: 'bold' },
  footer: { alignItems: 'center', padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  footerText: { fontSize: 12, marginTop: SPACING.xxs },
});
