import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { Transaction } from '../../contexts/WalletContext';
import { MERCHANT_CATEGORIES } from '../../constants/Config';
import { useTheme } from '../../hooks/useTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FraudScreen() {
  const { user } = useAuth();
  const { getSuspiciousTransactions, markTransactionFraud, clearTransactionFraud, blockUser } = useAdmin();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [suspiciousTransactions, setSuspiciousTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalSuspicious: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    markedFraud: 0,
  });

  useEffect(() => {
    loadSuspiciousTransactions();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [suspiciousTransactions]);

  const loadSuspiciousTransactions = async () => {
    setLoading(true);
    try {
      const txns = await getSuspiciousTransactions();
      setSuspiciousTransactions(txns);
    } catch (error) {
      console.error('Load suspicious transactions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const highRisk = suspiciousTransactions.filter(t => (t.riskScore || 0) >= 60).length;
    const mediumRisk = suspiciousTransactions.filter(t => (t.riskScore || 0) >= 30 && (t.riskScore || 0) < 60).length;
    const lowRisk = suspiciousTransactions.filter(t => (t.riskScore || 0) < 30).length;
    const fraud = suspiciousTransactions.filter(t => t.reviewStatus === 'fraud').length;

    setStats({
      totalSuspicious: suspiciousTransactions.length,
      highRisk,
      mediumRisk,
      lowRisk,
      markedFraud: fraud,
    });
  };

  const handleMarkFraud = async (txn: Transaction) => {
    Alert.alert(
      '⚠️ Confirm Fraud',
      `Mark this transaction as fraud and block the user?\n\nThis will:\n• Mark transaction as fraudulent\n• Block student account\n• Prevent future logins`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Fraud',
          style: 'destructive',
          onPress: async () => {
            try {
              await markTransactionFraud(txn.transaction_id, user?.email || 'admin');
              
              // Get user email from student_id
              const usersStr = await AsyncStorage.getItem('ALL_USERS');
              if (usersStr) {
                const users = JSON.parse(usersStr);
                const studentEmail = Object.keys(users).find(email => users[email].studentId === txn.student_id);
                
                if (studentEmail) {
                  await blockUser(studentEmail, 'Fraudulent transaction detected', user?.email || 'admin');
                }
              }
              
              loadSuspiciousTransactions();
              Alert.alert('✅ Success', 'Transaction marked as fraud and user blocked');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleClearFraud = async (txn: Transaction) => {
    Alert.alert(
      'Clear Fraud Flag',
      'Mark this transaction as clean and remove from suspicious list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Flag',
          onPress: async () => {
            try {
              await clearTransactionFraud(txn.transaction_id, user?.email || 'admin');
              loadSuspiciousTransactions();
              Alert.alert('✅ Success', 'Fraud flag cleared');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const showTransactionDetails = (txn: Transaction) => {
    setSelectedTxn(txn);
    setDetailsModalVisible(true);
  };

  const getRiskColor = (score?: number) => {
    if (!score) return colors.warning;
    if (score >= 60) return colors.danger;
    if (score >= 30) return colors.warning;
    return colors.success;
  };

  const getRiskLevel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 60) return 'High Risk';
    if (score >= 30) return 'Medium Risk';
    return 'Low Risk';
  };

  const renderSuspiciousTransaction = ({ item }: { item: Transaction }) => {
    const merchantName = item.merchant_id === 'WALLET_RECHARGE' 
      ? 'Wallet Recharge' 
      : MERCHANT_CATEGORIES[item.merchant_id] || item.merchant_id;

    return (
      <TouchableOpacity
        style={[
          styles.fraudCard,
          { borderLeftColor: getRiskColor(item.riskScore), borderLeftWidth: 4 }
        ]}
        onPress={() => showTransactionDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.fraudHeader}>
          <View style={[
            styles.riskBadge,
            { backgroundColor: getRiskColor(item.riskScore) + '20' }
          ]}>
            <Ionicons name="warning" size={20} color={getRiskColor(item.riskScore)} />
            <Text style={[styles.riskScore, { color: getRiskColor(item.riskScore) }]}>
              {getRiskLevel(item.riskScore)}
            </Text>
          </View>

          <View style={[
            styles.reviewBadge,
            { backgroundColor: item.reviewStatus === 'fraud' ? colors.danger + '20' : colors.warning + '20' }
          ]}>
            <Text style={[
              styles.reviewText,
              { color: item.reviewStatus === 'fraud' ? colors.danger : colors.warning }
            ]}>
              {item.reviewStatus?.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.fraudDetails}>
          <View style={styles.fraudMainInfo}>
            <View>
              <Text style={styles.fraudMerchant}>{merchantName}</Text>
              <Text style={styles.fraudStudent}>{item.student_name || item.student_id}</Text>
              <Text style={styles.fraudDate}>
                {new Date(item.timestamp).toLocaleString()}
              </Text>
            </View>
            <Text style={styles.fraudAmount}>₹{item.amount}</Text>
          </View>
          
          <Text style={styles.fraudId}>ID: {item.transaction_id}</Text>
        </View>

        {item.riskFlags && item.riskFlags.length > 0 && (
          <View style={styles.flagsContainer}>
            <Text style={styles.flagsTitle}>🚩 Risk Flags:</Text>
            <View style={styles.flagsWrapper}>
              {item.riskFlags.map((flag, index) => (
                <View key={index} style={styles.flagChip}>
                  <Ionicons name="alert-circle" size={12} color={colors.danger} />
                  <Text style={styles.flagText}>{flag.replace(/_/g, ' ')}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.fraudActions}>
          <TouchableOpacity
            style={[styles.fraudBtn, item.reviewStatus === 'fraud' && styles.fraudBtnDisabled]}
            onPress={() => handleMarkFraud(item)}
            disabled={item.reviewStatus === 'fraud'}
          >
            <Ionicons name="close-circle" size={18} color={item.reviewStatus === 'fraud' ? colors.textLight : colors.danger} />
            <Text style={[
              styles.fraudBtnText,
              item.reviewStatus === 'fraud' && styles.fraudBtnTextDisabled
            ]}>
              {item.reviewStatus === 'fraud' ? 'Marked Fraud' : 'Confirm Fraud'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cleanBtn}
            onPress={() => handleClearFraud(item)}
          >
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.cleanBtnText}>Clear Flag</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fraud Detection</Text>
        <Text style={styles.subtitle}>{stats.totalSuspicious} suspicious transactions</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.danger + '15' }]}>
          <Ionicons name="alert-circle" size={24} color={colors.danger} />
          <Text style={styles.statNumber}>{stats.highRisk}</Text>
          <Text style={styles.statLabel}>High Risk</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.warning + '15' }]}>
          <Ionicons name="warning" size={24} color={colors.warning} />
          <Text style={styles.statNumber}>{stats.mediumRisk}</Text>
          <Text style={styles.statLabel}>Medium Risk</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.success + '15' }]}>
          <Ionicons name="shield-checkmark" size={24} color={colors.success} />
          <Text style={styles.statNumber}>{stats.lowRisk}</Text>
          <Text style={styles.statLabel}>Low Risk</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.danger + '20' }]}>
          <Ionicons name="ban" size={24} color={colors.danger} />
          <Text style={styles.statNumber}>{stats.markedFraud}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
      </View>

      <View style={styles.alertBanner}>
        <Ionicons name="shield-checkmark" size={24} color={colors.warning} />
        <View style={{ flex: 1 }}>
          <Text style={styles.alertTitle}>Fraud Detection Active</Text>
          <Text style={styles.alertText}>
            Review suspicious transactions and take appropriate action
          </Text>
        </View>
      </View>

      <FlatList
        data={suspiciousTransactions}
        renderItem={renderSuspiciousTransaction}
        keyExtractor={(item) => item.transaction_id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadSuspiciousTransactions} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shield-checkmark-outline" size={80} color={colors.success} />
            <Text style={styles.emptyTitle}>All Clear! ✅</Text>
            <Text style={styles.emptyText}>No suspicious transactions detected</Text>
            <Text style={styles.emptySubtext}>System is monitoring all transactions</Text>
          </View>
        }
      />

      {/* Transaction Details Modal */}
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[
                styles.modalRiskBadge,
                { backgroundColor: getRiskColor(selectedTxn?.riskScore) }
              ]}>
                <Ionicons name="warning" size={32} color="#fff" />
              </View>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Suspicious Transaction</Text>
            <Text style={styles.modalRiskLevel}>
              {getRiskLevel(selectedTxn?.riskScore)} • Score: {selectedTxn?.riskScore || 0}/100
            </Text>

            {selectedTxn && (
              <>
                <View style={styles.detailSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={styles.detailValue}>{selectedTxn.transaction_id}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={[styles.detailValue, styles.amountBig]}>₹{selectedTxn.amount}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Student</Text>
                    <Text style={styles.detailValue}>
                      {selectedTxn.student_name || selectedTxn.student_id}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Merchant</Text>
                    <Text style={styles.detailValue}>
                      {selectedTxn.merchant_id === 'WALLET_RECHARGE' 
                        ? 'Wallet Recharge' 
                        : MERCHANT_CATEGORIES[selectedTxn.merchant_id] || selectedTxn.merchant_id}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedTxn.timestamp).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={styles.detailValue}>{selectedTxn.reviewStatus?.toUpperCase()}</Text>
                  </View>
                </View>

                {selectedTxn.riskFlags && selectedTxn.riskFlags.length > 0 && (
                  <View style={styles.flagsSection}>
                    <Text style={styles.flagsSectionTitle}>Detected Risk Factors:</Text>
                    {selectedTxn.riskFlags.map((flag, index) => (
                      <View key={index} style={styles.flagItem}>
                        <Ionicons name="alert-circle" size={16} color={colors.danger} />
                        <Text style={styles.flagItemText}>{flag.replace(/_/g, ' ')}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.actionButtonsContainer}>
                  {selectedTxn.reviewStatus !== 'fraud' && (
                    <TouchableOpacity
                      style={styles.confirmFraudButton}
                      onPress={() => {
                        setDetailsModalVisible(false);
                        handleMarkFraud(selectedTxn);
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#fff" />
                      <Text style={styles.confirmFraudText}>Confirm Fraud & Block User</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.clearFlagButton}
                    onPress={() => {
                      setDetailsModalVisible(false);
                      handleClearFraud(selectedTxn);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.clearFlagText}>Clear Flag</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
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
    backgroundColor: colors.card,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textLight,
    fontWeight: '600',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '15',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  alertText: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  fraudCard: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fraudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  riskScore: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  reviewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  reviewText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  fraudDetails: {
    marginBottom: 10,
  },
  fraudMainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  fraudMerchant: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  fraudStudent: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 3,
  },
  fraudDate: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 2,
  },
  fraudAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.danger,
  },
  fraudId: {
    fontSize: 10,
    color: colors.textLight,
    fontFamily: 'monospace',
  },
  flagsContainer: {
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  flagsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  flagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  flagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger + '10',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  flagText: {
    fontSize: 10,
    color: colors.danger,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  fraudActions: {
    flexDirection: 'row',
    gap: 8,
  },
  fraudBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 11,
    backgroundColor: colors.danger + '15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  fraudBtnDisabled: {
    backgroundColor: colors.border,
    borderColor: colors.border,
  },
  fraudBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.danger,
  },
  fraudBtnTextDisabled: {
    color: colors.textLight,
  },
  cleanBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 11,
    backgroundColor: colors.success + '15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.success,
  },
  cleanBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.success,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textLight,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalRiskBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  modalRiskLevel: {
    fontSize: 16,
    color: colors.textLight,
    marginBottom: 20,
  },
  detailSection: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
  amountBig: {
    fontSize: 18,
    color: colors.danger,
  },
  flagsSection: {
    backgroundColor: colors.danger + '10',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  flagsSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  flagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  flagItemText: {
    fontSize: 13,
    color: colors.text,
    textTransform: 'capitalize',
  },
  actionButtonsContainer: {
    gap: 10,
  },
  confirmFraudButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmFraudText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearFlagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success + '20',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.success,
  },
  clearFlagText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.success,
  },
});
