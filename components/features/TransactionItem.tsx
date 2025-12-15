import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/Config";
import { Transaction } from "../../contexts/WalletContext";

interface TransactionItemProps {
  transaction: Transaction;
  showDetails?: boolean;
}

export default function TransactionItem({
  transaction,
  showDetails = false,
}: TransactionItemProps) {
  const isDebit = transaction.amount < 0 || true; // Assuming all are debits for student app

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, isDebit && styles.debitIcon]}>
        <Ionicons
          name={isDebit ? "arrow-down" : "arrow-up"}
          size={24}
          color={isDebit ? COLORS.danger : COLORS.success}
        />
      </View>

      <View style={styles.details}>
        <Text style={styles.merchantName}>{transaction.merchant_id}</Text>
        <Text style={styles.date}>
          {new Date(transaction.timestamp).toLocaleString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {showDetails && (
          <Text style={styles.transactionId} numberOfLines={1}>
            ID: {transaction.transaction_id}
          </Text>
        )}
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, isDebit && styles.debitAmount]}>
          {isDebit ? "-" : "+"}₹{Math.abs(transaction.amount)}
        </Text>
        <Text
          style={[
            styles.status,
            transaction.status === "completed" && styles.statusCompleted,
            transaction.status === "pending" && styles.statusPending,
            transaction.status === "failed" && styles.statusFailed,
          ]}
        >
          {transaction.status}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  debitIcon: {
    backgroundColor: "#FFE5E5",
  },
  details: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: COLORS.textLight,
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
  debitAmount: {
    color: COLORS.danger,
  },
  status: {
    fontSize: 12,
    marginTop: 4,
    textTransform: "capitalize",
    fontWeight: "500",
  },
  statusCompleted: {
    color: COLORS.success,
  },
  statusPending: {
    color: COLORS.warning,
  },
  statusFailed: {
    color: COLORS.danger,
  },
});
