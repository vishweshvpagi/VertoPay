import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { MERCHANT_CATEGORIES } from '../../constants/Config';
import { apiRequest } from '../../utils/api';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'payment' | 'recharge'>('all');
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ Fetch from backend instead of AsyncStorage
      const data = await apiRequest<{ transactions: any[] }>('/api/transactions/history');
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Load transactions error:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    if (filterType === 'all') return true;
    if (filterType === 'payment') return t.type === 'payment' || t.status === 'completed';
    if (filterType === 'recharge') return t.type === 'recharge';
    return true;
  });

  const getMerchantName = (merchantId: string) => {
    if (!merchantId || merchantId === 'WALLET_RECHARGE') return 'Wallet Recharge';
    // Check populated merchant object first
    return MERCHANT_CATEGORIES[merchantId] || merchantId;
  };

  const getTxnId = (t: any) =>
    t.transactionId || t.transaction_id || t._id || 'N/A';

  const getTxnAmount = (t: any) =>
    typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;

  const getTxnTimestamp = (t: any) =>
    t.createdAt || t.timestamp || t.qrTimestamp || new Date().toISOString();

  const getMerchantId = (t: any) =>
    t.merchant?.merchantId || t.merchant_id || t.merchantId || '';

  const showDetails = (txn: any) => {
    setSelectedTxn(txn);
    setModalVisible(true);
  };

  const renderTransaction = ({ item }: { item: any }) => {
    const isPayment = item.type === 'payment' || item.status === 'completed';
    const amount = getTxnAmount(item);
    const merchantId = getMerchantId(item);
    const timestamp = getTxnTimestamp(item);

    return (
      <TouchableOpacity style={styles.txnCard} onPress={() => showDetails(item)} activeOpacity={0.7}>
        <View style={[styles.txnIcon, { backgroundColor: isPayment ? colors.danger + '20' : colors.success + '20' }]}>
          <Ionicons
            name={isPayment ? 'arrow-up' : 'arrow-down'}
            size={24}
            color={isPayment ? colors.danger : colors.success}
          />
        </View>
        <View style={styles.txnInfo}>
          <Text style={styles.txnTitle}>
            {isPayment
              ? item.merchant?.shopName || getMerchantName(merchantId)
              : 'Wallet Recharge'}
          </Text>
          <Text style={styles.txnDate}>
            {new Date(timestamp).toLocaleDateString()} •{' '}
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.txnId}>ID: {getTxnId(item)}</Text>
        </View>
        <View style={styles.txnRight}>
          <Text style={[styles.txnAmount, { color: isPayment ? colors.danger : colors.success }]}>
            {isPayment ? '-' : '+'}₹{amount.toFixed(2)}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'completed' ? colors.success + '20' : colors.warning + '20' }
          ]}>
            <Text style={[
              styles.statusText,
              { color: item.status === 'completed' ? colors.success : colors.warning }
            ]}>
              {(item.status || 'completed').toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <Text style={styles.subtitle}>{filteredTransactions.length} transactions</Text>
      </View>

      <View style={styles.filterContainer}>
        {(['all', 'payment', 'recharge'] as const).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.filterTab, filterType === type && styles.filterTabActive]}
            onPress={() => setFilterType(type)}
          >
            {type === 'payment' && (
              <Ionicons name="arrow-up" size={14} color={filterType === type ? '#fff' : colors.danger} />
            )}
            {type === 'recharge' && (
              <Ionicons name="arrow-down" size={14} color={filterType === type ? '#fff' : colors.success} />
            )}
            <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item, index) => getTxnId(item) + index}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTransactions} colors={[colors.student]} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.student} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>Your transactions will appear here</Text>
            </View>
          )
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
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedTxn && (() => {
              const isPayment = selectedTxn.type === 'payment' || selectedTxn.status === 'completed';
              const amount = getTxnAmount(selectedTxn);
              const merchantId = getMerchantId(selectedTxn);
              const timestamp = getTxnTimestamp(selectedTxn);

              return (
                <>
                  <View style={[
                    styles.modalIcon,
                    { backgroundColor: isPayment ? colors.danger : colors.success }
                  ]}>
                    <Ionicons name={isPayment ? 'arrow-up' : 'arrow-down'} size={40} color="#fff" />
                  </View>

                  <Text style={[styles.modalAmount, { color: isPayment ? colors.danger : colors.success }]}>
                    {isPayment ? '-' : '+'}₹{amount.toFixed(2)}
                  </Text>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{(selectedTxn.type || 'payment').toUpperCase()}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={styles.detailValue}>{getTxnId(selectedTxn)}</Text>
                  </View>
                  {isPayment && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Merchant</Text>
                      <Text style={styles.detailValue}>
                        {selectedTxn.merchant?.shopName || getMerchantName(merchantId)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Date & Time</Text>
                    <Text style={styles.detailValue}>
                      {new Date(timestamp).toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={[
                      styles.detailStatusBadge,
                      { backgroundColor: selectedTxn.status === 'completed' ? colors.success + '20' : colors.warning + '20' }
                    ]}>
                      <Text style={[
                        styles.detailStatusText,
                        { color: selectedTxn.status === 'completed' ? colors.success : colors.warning }
                      ]}>
                        {(selectedTxn.status || 'completed').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingTop: 60, backgroundColor: colors.student },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  filterContainer: { flexDirection: 'row', padding: 16, gap: 8 },
  filterTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', backgroundColor: colors.card,
    padding: 10, borderRadius: 12, gap: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  filterTabActive: { backgroundColor: colors.student, borderColor: colors.student },
  filterText: { fontSize: 14, fontWeight: '600', color: colors.text },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 0 },
  txnCard: {
    flexDirection: 'row', backgroundColor: colors.card,
    padding: 14, borderRadius: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  txnIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txnInfo: { flex: 1 },
  txnTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  txnDate: { fontSize: 12, color: colors.textLight, marginBottom: 2 },
  txnId: { fontSize: 10, color: colors.textLight, fontFamily: 'monospace' },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 20, fontWeight: 'bold', marginBottom: 6 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { fontSize: 18, color: colors.textLight, marginTop: 16, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: colors.textLight, marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.card, borderRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  modalAmount: { fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 14, color: colors.textLight, fontWeight: '500' },
  detailValue: { fontSize: 14, color: colors.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  detailStatusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  detailStatusText: { fontSize: 12, fontWeight: 'bold' },
});
