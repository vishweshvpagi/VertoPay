import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import Switch from '../../components/ui/Switch';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [earnings, setEarnings] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      if (user?.email) {
        const walletData = await AsyncStorage.getItem(`MERCHANT_WALLET_${user.email}`);
        if (walletData) {
          const wallet = JSON.parse(walletData);
          setEarnings(wallet.balance || 0);
          
          const transactions = wallet.transactions || [];
          setTransactionCount(transactions.length);
          
          const today = new Date().toDateString();
          const todayTxns = transactions.filter((t: any) => 
            new Date(t.timestamp).toDateString() === today
          );
          const todayTotal = todayTxns.reduce((sum: number, t: any) => sum + t.amount, 0);
          setTodayEarnings(todayTotal);
        }
      }
    } catch (error) {
      console.error('Load stats error:', error);
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

  const styles = getStyles(colors);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.merchant }]}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.merchant }]}>
          <Ionicons name="storefront" size={48} color="#fff" />
        </View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.merchantName}</Text>
        <Text style={[styles.email, { color: colors.textLight }]}>{user?.email}</Text>
        <View style={[styles.merchantIdBadge, { backgroundColor: colors.merchant + '20' }]}>
          <Ionicons name="card" size={16} color={colors.merchant} />
          <Text style={[styles.merchantIdText, { color: colors.merchant }]}>{user?.merchantId}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="cash" size={28} color={colors.success} />
          <Text style={[styles.statNumber, { color: colors.text }]}>₹{earnings.toFixed(0)}</Text>
          <Text style={[styles.statLabel, { color: colors.textLight }]}>Total Earnings</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="calendar" size={28} color={colors.primary} />
          <Text style={[styles.statNumber, { color: colors.text }]}>₹{todayEarnings.toFixed(0)}</Text>
          <Text style={[styles.statLabel, { color: colors.textLight }]}>Today</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="receipt" size={28} color={colors.warning} />
          <Text style={[styles.statNumber, { color: colors.text }]}>{transactionCount}</Text>
          <Text style={[styles.statLabel, { color: colors.textLight }]}>Transactions</Text>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/(merchant)/transactions')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
            <Ionicons name="time" size={24} color={colors.primary} />
          </View>
          <Text style={[styles.menuText, { color: colors.text }]}>Transaction History</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.menuItem, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/(merchant)/scan')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
            <Ionicons name="scan" size={24} color={colors.merchant} />
          </View>
          <Text style={[styles.menuText, { color: colors.text }]}>Scan QR Code</Text>
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
          onPress={() => Alert.alert('About', 'VertoPay Merchant v1.0.0\n\nCampus Digital Payment System')}
        >
          <View style={[styles.menuIcon, { backgroundColor: colors.background }]}>
            <Ionicons name="information-circle" size={24} color={colors.textLight} />
          </View>
          <Text style={[styles.menuText, { color: colors.text }]}>About</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.danger + '15', borderColor: colors.danger }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={24} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textLight }]}>VertoPay Merchant v1.0.0</Text>
        <Text style={[styles.footerText, { color: colors.textLight }]}>Secure Campus Payment System</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileCard: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 12,
  },
  merchantIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  merchantIdText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    marginTop: 4,
  },
});
