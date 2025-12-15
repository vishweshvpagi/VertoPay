import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/Config";
import { Transaction } from "../../contexts/WalletContext";
import { useWallet } from "../../hooks/useWallet";

export default function MerchantTransactionsScreen() {
  const { merchantTransactions, refreshWallet, loading } = useWallet();

  useEffect(() => {
    refreshWallet();
  }, []);

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.iconContainer}>
        <Ionicons name="arrow-up" size={24} color={COLORS.success} />
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.studentName}>
          {item.student_name || item.student_id}
        </Text>
        <Text style={styles.transactionDate}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
        <Text style={styles.transactionId}>ID: {item.transaction_id}</Text>
      </View>
      <View style={styles.amountContainer}>
        <Text style={styles.amount}>+₹{(item.amount * 0.98).toFixed(2)}</Text>
        <Text style={styles.commission}>(-2% fee)</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <Text style={styles.subtitle}>All received payments</Text>
      </View>

      <FlatList
        data={merchantTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.transaction_id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refreshWallet} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={64}
              color={COLORS.textLight}
            />
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        }
      />
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
    fontWeight: "bold",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  list: {
    padding: 20,
  },
  transactionCard: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  transactionDate: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 4,
  },
  transactionId: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.success,
  },
  commission: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textLight,
    marginTop: 16,
  },
});
