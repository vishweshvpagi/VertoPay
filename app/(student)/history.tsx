import React, { useEffect } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { COLORS, MERCHANT_CATEGORIES } from "../../constants/Config";
import { useWallet } from "../../hooks/useWallet";

export default function StudentHistoryScreen() {
  const { transactions, loading, fetchTransactions } = useWallet();

  useEffect(() => {
    fetchTransactions();
  }, []);

  const renderTransaction = ({ item }: any) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Text style={styles.merchantName}>
          {MERCHANT_CATEGORIES[item.merchant_id] || item.merchant_id}
        </Text>
        <Text
          style={[
            styles.amount,
            item.type === "credit" ? styles.credit : styles.debit,
          ]}
        >
          {item.type === "credit" ? "+" : "-"}₹{item.amount}
        </Text>
      </View>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
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
        data={transactions}
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
  header: { padding: 20, paddingTop: 60, backgroundColor: COLORS.primary },
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
    alignItems: "center",
    marginBottom: 8,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  amount: { fontSize: 18, fontWeight: "bold" },
  credit: { color: COLORS.success },
  debit: { color: COLORS.danger },
  timestamp: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
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
