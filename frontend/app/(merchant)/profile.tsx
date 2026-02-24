import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { apiRequest } from '../../utils/api';

export default function TransactionsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'today' | 'week'>('all');
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // ✅ Fetch from backend
      const data = await apiRequest<{ transactions: any[] }>('/api/transactions/history');
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Load transactions error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper accessors — handle both old AsyncStorage shape and new MongoDB shape
  const getTimestamp = (t: any) =>
    t.createdAt || t.timestamp || t.qrTimestamp || new Date().toISOString();

  const getTxnId = (t: any) =>
    t.transactionId || t.transaction_id || t._id || 'N/A';

  const getStudentName = (t: any) =>
    t.student?.name || t.student_name || t.studentName || 'Unknown Student';

  const getStudentId = (t: any) =>
    t.student?.studentId || t.student_id || t.studentId || 'N/A';

  const getAmount = (t: any) =>
    typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;

  const getFilteredTransactions = () => {
    if (filterType === 'all') return transactions;
    const now = new Date();
    return transactions.filter((t) => {
      const txnDate = new Date(getTimestamp(t));
      if (filterType === 'today') return txnDate.toDateString() === now.toDateString();
      if (filterType === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txnDate >= weekAgo;
      }
      return true;
    });
  };

  const filteredTransactions = getFilteredTransactions();
  const totalEarnings = filteredTransactions.reduce((sum, t) => sum + getAmount(t), 0);

  const showDetails = (txn: any) => {
    setSelectedTxn(txn);
    setModalVisible(true);
  };

  const renderTransaction = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.txnCard} onPress={() => showDetails(item)} activeOpacity={0.7}>
      <View style={styles.txnIcon}>
        <Ionicons name="person" size={24} color={colors.success} />
      </View>
      <View style={styles.txnInfo}>
        <Text style={styles.txnTitle}>{getStudentName(item)}</Text>
        <Text style={styles.txnDate}>
          {new Date(getTimestamp(item)).toLocaleDateString()} •{' '}
          {new Date(getTimestamp(item)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.txnId}>ID: {getTxnId(item)}</Text>
      </View>
      <View style={styles.txnRight}>
        <Text style={styles.txnAmount}>+₹{getAmount(item).toFixed(2)}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {(item.status || 'completed').toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>
          {filteredTransactions.length} transactions • ₹{totalEarnings.toFixed(2)}
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {([
          { key: 'all', label: 'All Time', icon: null },
          { key: 'today', label: 'Today', icon: 'today' },
          { key: 'week', label: 'This Week', icon: 'calendar' },
        ] as const).map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            style={[styles.filterTab, filterType === key && styles.filterTabActive]}
            onPress={() => setFilterType(key)}
          >
            {icon && (
              <Ionicons
                name={icon}
                size={14}
                color={filterType === key ? '#fff' : colors.primary}
              />
            )}
            <Text style={[styles.filterText, filterType === key && styles.filterTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item, index) => getTxnId(item) + index}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadTransactions}
            colors={[colors.merchant]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.merchant} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={colors.textLight} />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubtext}>
                {filterType === 'all'
                  ? 'Start scanning student QR codes'
                  : `No transactions ${filterType === 'today' ? 'today' : 'this week'}`}
              </Text>
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

            {selectedTxn && (
              <>
                <View style={styles.modalIcon}>
                  <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                </View>

                <Text style={styles.modalAmount}>
                  +₹{getAmount(selectedTxn).toFixed(2)}
                </Text>

                <View style={styles.studentCard}>
                  <View style={styles.studentAvatar}>
                    <Ionicons name="person" size={24} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.studentName}>{getStudentName(selectedTxn)}</Text>
                    <Text style={styles.studentId}>ID: {getStudentId(selectedTxn)}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Transaction ID</Text>
                  <Text style={styles.detailValue}>{getTxnId(selectedTxn)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date & Time</Text>
                  <Text style={styles.detailValue}>
                    {new Date(getTimestamp(selectedTxn)).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={styles.detailStatusBadge}>
                    <Text style={styles.detailStatusText}>
                      {(selectedTxn.status || 'completed').toUpperCase()}
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

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20, paddingTop: 60, backgroundColor: colors.merchant },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#fff', opacity: 0.9, marginTop: 4 },
  filterContainer: { flexDirection: 'row', padding: 16, gap: 8 },
  filterTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, padding: 10, borderRadius: 12, gap: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  filterTabActive: { backgroundColor: colors.merchant, borderColor: colors.merchant },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.text },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingTop: 0 },
  txnCard: {
    flexDirection: 'row', backgroundColor: colors.card, padding: 14,
    borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: colors.border,
  },
  txnIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.success + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  txnInfo: { flex: 1 },
  txnTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
  txnDate: { fontSize: 12, color: colors.textLight, marginBottom: 2 },
  txnId: { fontSize: 10, color: colors.textLight, fontFamily: 'monospace' },
  txnRight: { alignItems: 'flex-end' },
  txnAmount: { fontSize: 20, fontWeight: 'bold', color: colors.success, marginBottom: 6 },
  statusBadge: { backgroundColor: colors.success + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 10, fontWeight: 'bold', color: colors.success },
  emptyState: { alignItems: 'center', padding: 60 },
  emptyText: { fontSize: 18, color: colors.textLight, marginTop: 16, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: colors.textLight, marginTop: 8, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: colors.card, borderRadius: 20, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  modalIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.success + '20',
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16,
  },
  modalAmount: { fontSize: 36, fontWeight: 'bold', color: colors.success, textAlign: 'center', marginBottom: 24 },
  studentCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background, padding: 12,
    borderRadius: 12, marginBottom: 20, gap: 12,
  },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.student, alignItems: 'center', justifyContent: 'center' },
  studentName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  studentId: { fontSize: 12, color: colors.textLight, marginTop: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { fontSize: 14, color: colors.textLight, fontWeight: '500' },
  detailValue: { fontSize: 14, color: colors.text, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  detailStatusBadge: { backgroundColor: colors.success + '20', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  detailStatusText: { fontSize: 12, fontWeight: 'bold', color: colors.success },
});
