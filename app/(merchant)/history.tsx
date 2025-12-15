import React, { useEffect } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/Config";
import { useWallet } from "../../hooks/useWallet";

export default function MerchantHistoryScreen() {
  const { merchantTransactions, loading, fetchTransactions } = useWallet();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const renderTransaction = ({ item }: any) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View>
          <Text style={styles.studentId}>Student: {item.student_id}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
        <Text style={styles.amount}>+₹{item.amount}</Text>
      </View>
      <Text style={[styles.status, (styles as any)[`status_${item.status}`]]}>
        {item.status}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
      </View>
      <FlatList
        data={merchantTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.transaction_id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTransactions} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 60, backgroundColor: COLORS.merchant },
  title: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  list: { padding: 20 },
  transactionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  studentId: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  timestamp: { fontSize: 12, color: COLORS.textLight },
  amount: { fontSize: 18, fontWeight: "bold", color: COLORS.success },
  status: { fontSize: 12, fontWeight: "600", textTransform: "uppercase" },
  status_completed: { color: COLORS.success },
  status_pending: { color: COLORS.warning },
  status_failed: { color: COLORS.danger },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: { fontSize: 16, color: COLORS.textLight },
});
