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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useAdmin } from '../../hooks/useAdmin';
import { Transaction } from '../../contexts/WalletContext';
import { COLORS, MERCHANT_CATEGORIES } from '../../constants/Config';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const { getAllTransactions, reverseTransaction } = useAdmin();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'payment' | 'recharge' | 'reversal'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'reversed'>('all');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [reverseModalVisible, setReverseModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [reversalReason, setReversalReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalVolume: 0,
    completedCount: 0,
    reversedCount: 0,
    avgAmount: 0,
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
    calculateStats();
  }, [transactions, filterType, filterStatus, searchQuery]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const allTxns = await getAllTransactions();
      setTransactions(allTxns);
    } catch (error) {
      console.error('Load transactions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.transaction_id.toLowerCase().includes(query) ||
        t.student_id.toLowerCase().includes(query) ||
        t.merchant_id.toLowerCase().includes(query) ||
        t.student_name?.toLowerCase().includes(query)
      );
    }

    setFilteredTransactions(filtered);
  };

  const calculateStats = () => {
    const completed = transactions.filter(t => t.status === 'completed' && t.type === 'payment');
    const reversed = transactions.filter(t => t.status === 'reversed');
    const totalVol = completed.reduce((sum, t) => sum + t.amount, 0);
    const avg = completed.length > 0 ? totalVol / completed.length : 0;

    setStats({
      totalTransactions: transactions.length,
      totalVolume: totalVol,
      completedCount: completed.length,
      reversedCount: reversed.length,
      avgAmount: avg,
    });
  };

  const handleReverseTransaction = (txn: Transaction) => {
    if (txn.status === 'reversed') {
      Alert.alert('Error', 'Transaction already reversed');
      return;
    }

    if (txn.type !== 'payment') {
      Alert.alert('Error', 'Can only reverse payment transactions');
      return;
    }

    setSelectedTxn(txn);
    setReverseModalVisible(true);
  };

  const confirmReversal = async () => {
    if (!selectedTxn || !reversalReason.trim()) {
      Alert.alert('Error', 'Please enter a reason');
      return;
    }

    try {
      await reverseTransaction(selectedTxn.transaction_id, reversalReason, user?.email || 'admin');
      setReverseModalVisible(false);
      setReversalReason('');
      setSelectedTxn(null);
      loadTransactions();
      Alert.alert('✅ Success', 'Transaction reversed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const showTransactionDetails = (txn: Transaction) => {
    setSelectedTxn(txn);
    setDetailsModalVisible(true);
  };

  const getRiskColor = (score?: number) => {
    if (!score) return COLORS.success;
    if (score >= 60) return COLORS.danger;
    if (score >= 30) return COLORS.warning;
    return COLORS.success;
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const merchantName = item.merchant_id === 'WALLET_RECHARGE' 
      ? 'Wallet Recharge' 
      : MERCHANT_CATEGORIES[item.merchant_id] || item.merchant_id;

    return (
      <TouchableOpacity 
        style={styles.txnCard}
        onPress={() => showTransactionDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.txnHeader}>
          <View style={[
            styles.txnIcon,
            { backgroundColor: item.type === 'reversal' ? COLORS.warning + '20' : 
                             item.type === 'recharge' ? COLORS.success + '20' : 
                             COLORS.primary + '20' }
          ]}>
            <Ionicons
              name={item.type === 'reversal' ? 'refresh' : 
                    item.type === 'recharge' ? 'add' : 
                    'arrow-forward'}
              size={24}
              color={item.type === 'reversal' ? COLORS.warning : 
                     item.type === 'recharge' ? COLORS.success : 
                     COLORS.primary}
            />
          </View>

          <View style={styles.txnInfo}>
            <Text style={styles.txnMerchant}>{merchantName}</Text>
            <Text style={styles.txnStudent}>
              {item.student_name || item.student_id}
            </Text>
            <Text style={styles.txnDate}>
              {new Date(item.timestamp).toLocaleString()}
            </Text>
          </View>

          <View style={styles.txnRight}>
            <Text style={[
              styles.txnAmount,
              { color: item.type === 'reversal' ? COLORS.warning : COLORS.text }
            ]}>
              {item.type === 'reversal' ? '-' : ''}₹{item.amount}
            </Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.status === 'reversed' ? COLORS.warning + '20' : COLORS.success + '20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: item.status === 'reversed' ? COLORS.warning : COLORS.success }
              ]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {item.riskScore && item.riskScore > 0 && (
          <View style={styles.riskSection}>
            <View style={[
              styles.riskBadge,
              { backgroundColor: getRiskColor(item.riskScore) + '20' }
            ]}>
              <Ionicons name="shield" size={14} color={getRiskColor(item.riskScore)} />
              <Text style={[styles.riskText, { color: getRiskColor(item.riskScore) }]}>
                Risk: {item.riskScore}
              </Text>
            </View>
            {item.riskFlags && item.riskFlags.length > 0 && (
              <Text style={styles.riskFlags}>
                {item.riskFlags.join(', ')}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>{filteredTransactions.length} transactions</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₹{stats.totalVolume.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Total Volume</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₹{stats.avgAmount.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Avg Amount</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.textLight} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID, student, merchant..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textLight}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Type Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Type:</Text>
        <TouchableOpacity
          style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'payment' && styles.filterChipActive]}
          onPress={() => setFilterType('payment')}
        >
          <Ionicons name="arrow-forward" size={14} color={filterType === 'payment' ? '#fff' : COLORS.primary} />
          <Text style={[styles.filterText, filterType === 'payment' && styles.filterTextActive]}>
            Payments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'recharge' && styles.filterChipActive]}
          onPress={() => setFilterType('recharge')}
        >
          <Ionicons name="add" size={14} color={filterType === 'recharge' ? '#fff' : COLORS.success} />
          <Text style={[styles.filterText, filterType === 'recharge' && styles.filterTextActive]}>
            Recharges
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterType === 'reversal' && styles.filterChipActive]}
          onPress={() => setFilterType('reversal')}
        >
          <Ionicons name="refresh" size={14} color={filterType === 'reversal' ? '#fff' : COLORS.warning} />
          <Text style={[styles.filterText, filterType === 'reversal' && styles.filterTextActive]}>
            Reversals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status Filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Status:</Text>
        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'completed' && styles.filterChipActive]}
          onPress={() => setFilterStatus('completed')}
        >
          <Ionicons name="checkmark" size={14} color={filterStatus === 'completed' ? '#fff' : COLORS.success} />
          <Text style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterStatus === 'reversed' && styles.filterChipActive]}
          onPress={() => setFilterStatus('reversed')}
        >
          <Ionicons name="close" size={14} color={filterStatus === 'reversed' ? '#fff' : COLORS.danger} />
          <Text style={[styles.filterText, filterStatus === 'reversed' && styles.filterTextActive]}>
            Reversed
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.transaction_id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTransactions} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No transactions found</Text>
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
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedTxn && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>{selectedTxn.transaction_id}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{selectedTxn.type.toUpperCase()}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={[styles.detailValue, styles.amountBig]}>₹{selectedTxn.amount}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: selectedTxn.status === 'completed' ? COLORS.success : COLORS.warning }
                  ]}>
                    {selectedTxn.status.toUpperCase()}
                  </Text>
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

                {selectedTxn.riskScore !== undefined && selectedTxn.riskScore > 0 && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Risk Score</Text>
                      <Text style={[
                        styles.detailValue,
                        { color: getRiskColor(selectedTxn.riskScore) }
                      ]}>
                        {selectedTxn.riskScore} / 100
                      </Text>
                    </View>

                    {selectedTxn.riskFlags && selectedTxn.riskFlags.length > 0 && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Risk Flags</Text>
                        <Text style={styles.detailValue}>
                          {selectedTxn.riskFlags.join(', ')}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {selectedTxn.reviewStatus && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Review Status</Text>
                    <Text style={styles.detailValue}>
                      {selectedTxn.reviewStatus.toUpperCase()}
                    </Text>
                  </View>
                )}

                {selectedTxn.type === 'payment' && selectedTxn.status === 'completed' && (
                  <TouchableOpacity
                    style={styles.reverseButton}
                    onPress={() => {
                      setDetailsModalVisible(false);
                      handleReverseTransaction(selectedTxn);
                    }}
                  >
                    <Ionicons name="refresh" size={20} color="#fff" />
                    <Text style={styles.reverseButtonText}>Reverse Transaction</Text>
                  </TouchableOpacity>
                )}

                {selectedTxn.type === 'reversal' && selectedTxn.reversalReason && (
                  <View style={styles.reversalInfoCard}>
                    <Ionicons name="information-circle" size={20} color={COLORS.warning} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reversalLabel}>Reversal Reason</Text>
                      <Text style={styles.reversalText}>{selectedTxn.reversalReason}</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Reverse Transaction Modal */}
      <Modal
        visible={reverseModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReverseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="refresh" size={32} color={COLORS.danger} />
              <Text style={styles.modalTitle}>Reverse Transaction</Text>
            </View>
            <Text style={styles.modalSubtitle}>
              Amount: ₹{selectedTxn?.amount}
            </Text>
            <Text style={styles.modalWarning}>
              ⚠️ This will refund the student and deduct from merchant
            </Text>

            <TextInput
              style={styles.reasonInput}
              placeholder="Enter reason for reversal..."
              value={reversalReason}
              onChangeText={setReversalReason}
              multiline
              numberOfLines={4}
              placeholderTextColor={COLORS.textLight}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setReverseModalVisible(false);
                  setReversalReason('');
                  setSelectedTxn(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={confirmReversal}
              >
                <Text style={styles.modalConfirmText}>Reverse</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    backgroundColor: COLORS.card,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.admin,
    borderColor: COLORS.admin,
  },
  filterText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  txnCard: {
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txnHeader: {
    flexDirection: 'row',
  },
  txnIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txnInfo: {
    flex: 1,
  },
  txnMerchant: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  txnStudent: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  txnDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  riskSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  riskText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  riskFlags: {
    fontSize: 10,
    color: COLORS.textLight,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textLight,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  modalWarning: {
    fontSize: 14,
    color: COLORS.warning,
    marginBottom: 20,
  },
  reasonInput: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalConfirmBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  amountBig: {
    fontSize: 20,
    color: COLORS.primary,
  },
  reverseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  reverseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  reversalInfoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.warning + '10',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  reversalLabel: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: '600',
    marginBottom: 4,
  },
  reversalText: {
    fontSize: 13,
    color: COLORS.text,
  },
});
