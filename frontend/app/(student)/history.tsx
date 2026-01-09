import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { COLORS, MERCHANT_CATEGORIES } from '../../constants/Config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'payment' | 'recharge'>('all');
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      if (user?.email) {
        const walletData = await AsyncStorage.getItem(`WALLET_${user.email}`);
        if (walletData) {
          const wallet = JSON.parse(walletData);
          setTransactions(wallet.transactions || []);
        }
      }
    } catch (error) {
      console.error('Load transactions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = filterType === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filterType);

  const getMerchantName = (merchantId: string) => {
    if (merchantId === 'WALLET_RECHARGE') return 'Wallet Recharge';
    return MERCHANT_CATEGORIES[merchantId] || merchantId;
  };

  const showDetails = (txn: any) => {
    setSelectedTxn(txn);
    setModalVisible(true);
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.txnCard}
      onPress={() => showDetails(item)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.txnIcon,
        { backgroundColor: item.type === 'payment' ? COLORS.danger + '20' : COLORS.success + '20' }
      ]}>
        <Ionicons
          name={item.type === 'payment' ? 'arrow-up' : 'arrow-down'}
          size={24}
          color={item.type === 'payment' ? COLORS.danger : COLORS.success}
        />
      </View>
      <View style={styles.txnInfo}>
        <Text style={styles.txnTitle}>
          {item.type === 'payment' ? getMerchantName(item.merchant_id) : 'Wallet Recharge'}
        </Text>
        <Text style={styles.txnDate}>
          {new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.txnId}>ID: {item.transaction_id}</Text>
      </View>
      <View style={styles.txnRight}>
        <Text style={[
          styles.txnAmount,
          { color: item.type === 'payment' ? COLORS.danger : COLORS.success }
        ]}>
          {item.type === 'payment' ? '-' : '+'}₹{item.amount}
        </Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.status === 'completed' ? COLORS.success + '20' : COLORS.warning + '20' }
        ]}>
          <Text style={[
            styles.statusText,
            { color: item.status === 'completed' ? COLORS.success : COLORS.warning }
          ]}>
            {item.status.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <Text style={styles.subtitle}>{filteredTransactions.length} transactions</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filterType === 'payment' && styles.filterTabActive]}
          onPress={() => setFilterType('payment')}
        >
          <Ionicons 
            name="arrow-up" 
            size={14} 
            color={filterType === 'payment' ? '#fff' : COLORS.danger} 
          />
          <Text style={[styles.filterText, filterType === 'payment' && styles.filterTextActive]}>
            Payments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterTab, filterType === 'recharge' && styles.filterTabActive]}
          onPress={() => setFilterType('recharge')}
        >
          <Ionicons 
            name="arrow-down" 
            size={14} 
            color={filterType === 'recharge' ? '#fff' : COLORS.success} 
          />
          <Text style={[styles.filterText, filterType === 'recharge' && styles.filterTextActive]}>
            Recharges
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.transaction_id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTransactions} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyText}>No transactions found</Text>
            <Text style={styles.emptySubtext}>Your transactions will appear here</Text>
          </View>
        }
      />

      {/* Transaction Details Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedTxn && (
              <>
                <View style={[
                  styles.modalIcon,
                  { backgroundColor: selectedTxn.type === 'payment' ? COLORS.danger : COLORS.success }
                ]}>
                  <Ionicons
                    name={selectedTxn.type === 'payment' ? 'arrow-up' : 'arrow-down'}
                    size={40}
                    color="#fff"
                  />
                </View>

                <Text style={[
                  styles.modalAmount,
                  { color: selectedTxn.type === 'payment' ? COLORS.danger : COLORS.success }
                ]}>
                  {selectedTxn.type === 'payment' ? '-' : '+'}₹{selectedTxn.amount}
                </Text>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{selectedTxn.type.toUpperCase()}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>{selectedTxn.transaction_id}</Text>
                </View>

                {selectedTxn.type === 'payment' && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Merchant</Text>
                    <Text style={styles.detailValue}>
                      {getMerchantName(selectedTxn.merchant_id)}
                    </Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTxn.timestamp).toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={[
                    styles.detailStatusBadge,
                    { backgroundColor: selectedTxn.status === 'completed' ? COLORS.success + '20' : COLORS.warning + '20' }
                  ]}>
                    <Text style={[
                      styles.detailStatusText,
                      { color: selectedTxn.status === 'completed' ? COLORS.success : COLORS.warning }
                    ]}>
                      {selectedTxn.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </>
            )}
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
    backgroundColor: COLORS.student,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    padding: 10,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.student,
    borderColor: COLORS.student,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  txnCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txnInfo: {
    flex: 1,
  },
  txnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  txnDate: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 2,
  },
  txnId: {
    fontSize: 10,
    color: COLORS.textLight,
    fontFamily: 'monospace',
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 60,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textLight,
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
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
  detailStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});
