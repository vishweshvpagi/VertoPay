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
import { COLORS } from '../../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
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

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="storefront" size={48} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.merchantName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.merchantIdBadge}>
          <Ionicons name="card" size={16} color={COLORS.merchant} />
          <Text style={styles.merchantIdText}>{user?.merchantId}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="cash" size={28} color={COLORS.success} />
          <Text style={styles.statNumber}>₹{earnings.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="calendar" size={28} color={COLORS.primary} />
          <Text style={styles.statNumber}>₹{todayEarnings.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="receipt" size={28} color={COLORS.warning} />
          <Text style={styles.statNumber}>{transactionCount}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>

      {/* Menu Options */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/(merchant)/transactions')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="time" size={24} color={COLORS.primary} />
          </View>
          <Text style={styles.menuText}>Transaction History</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/(merchant)/scan')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="scan" size={24} color={COLORS.merchant} />
          </View>
          <Text style={styles.menuText}>Scan QR Code</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Settings', 'Settings coming soon!')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="settings" size={24} color={COLORS.warning} />
          </View>
          <Text style={styles.menuText}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('Help & Support', 'Contact support at support@vertopay.com')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="help-circle" size={24} color={COLORS.admin} />
          </View>
          <Text style={styles.menuText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => Alert.alert('About', 'VertoPay Merchant v1.0.0\n\nCampus Digital Payment System')}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="information-circle" size={24} color={COLORS.textLight} />
          </View>
          <Text style={styles.menuText}>About</Text>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>VertoPay Merchant v1.0.0</Text>
        <Text style={styles.footerText}>Secure Campus Payment System</Text>
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.merchant,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileCard: {
    backgroundColor: COLORS.card,
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.merchant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  merchantIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.merchant + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  merchantIdText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.merchant,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger + '15',
    padding: 16,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
});
