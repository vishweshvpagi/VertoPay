import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { apiRequest } from "../../utils/api";
import { MERCHANT_CATEGORIES } from "../../constants/Config";

export default function HistoryScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "payment" | "recharge">("all");

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, []),
  );

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ transactions: any[] }>(
        "/api/transactions/history",
      );
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error("Load transactions error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMerchantName = (t: any) => {
    if (t.merchant?.shopName) return t.merchant.shopName;
    const id = t.merchant_id || t.merchantId;
    if (!id) return "Unknown";
    return MERCHANT_CATEGORIES[id] || id;
  };

  const isRecharge = (t: any) => t.type === "recharge";

  const filtered = transactions.filter((t) => {
    if (filter === "all") return true;
    if (filter === "recharge") return isRecharge(t);
    if (filter === "payment") return !isRecharge(t);
    return true;
  });

  const renderItem = ({ item }: { item: any }) => {
    const recharge = isRecharge(item);
    const ts = item.createdAt || item.qrTimestamp || item.timestamp;
    const amount =
      typeof item.amount === "number"
        ? item.amount
        : parseFloat(item.amount) || 0;

    return (
      <View style={styles.txnCard}>
        {/* ✅ Green arrow-down for recharge, red arrow-up for payment */}
        <View
          style={[
            styles.txnIcon,
            recharge ? styles.iconRecharge : styles.iconPayment,
          ]}
        >
          <Ionicons
            name={recharge ? "arrow-down" : "arrow-up"}
            size={18}
            color={recharge ? colors.success : colors.danger}
          />
        </View>
        <View style={styles.txnInfo}>
          <Text style={styles.txnTitle}>
            {recharge ? "Wallet Recharge" : getMerchantName(item)}
          </Text>
          <Text style={styles.txnDate}>
            {ts
              ? `${new Date(ts).toLocaleDateString("en-IN")} • ${new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
              : "—"}
          </Text>
          <Text style={styles.txnId}>
            ID: {item.transactionId || item._id || "N/A"}
          </Text>
        </View>
        <View style={styles.txnRight}>
          {/* ✅ Green + for recharge, red - for payment */}
          <Text
            style={[
              styles.txnAmount,
              { color: recharge ? colors.success : colors.danger },
            ]}
          >
            {recharge ? "+" : "-"}₹{amount.toFixed(2)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.success + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.success }]}>
              {(item.status || "COMPLETED").toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transaction History</Text>
        <Text style={styles.subtitle}>{filtered.length} transactions</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(["all", "payment", "recharge"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f === "all"
                ? "All"
                : f === "payment"
                  ? "↑ Payment"
                  : "↓ Recharge"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item, i) =>
          (item.transactionId || item._id || i).toString()
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadTransactions}
            colors={[colors.student]}
            tintColor={colors.student}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={colors.student} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="receipt-outline"
                size={64}
                color={colors.textLight}
              />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 20, paddingTop: 60, backgroundColor: colors.student },
    title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
    subtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 4 },
    filterRow: { flexDirection: "row", padding: 16, gap: 8 },
    filterTab: {
      flex: 1,
      padding: 10,
      borderRadius: 12,
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterTabActive: {
      backgroundColor: colors.student,
      borderColor: colors.student,
    },
    filterText: { fontSize: 13, fontWeight: "600", color: colors.text },
    filterTextActive: { color: "#fff" },
    list: { padding: 16, paddingTop: 0 },
    txnCard: {
      flexDirection: "row",
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 16,
      marginBottom: 10,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    txnIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    iconRecharge: { backgroundColor: colors.success + "20" }, // ✅ green bg
    iconPayment: { backgroundColor: colors.danger + "20" }, // ✅ red bg
    txnInfo: { flex: 1 },
    txnTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 3,
    },
    txnDate: { fontSize: 12, color: colors.textLight, marginBottom: 2 },
    txnId: { fontSize: 10, color: colors.textLight },
    txnRight: { alignItems: "flex-end" },
    txnAmount: { fontSize: 17, fontWeight: "bold", marginBottom: 4 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: "bold" },
    empty: { alignItems: "center", padding: 60 },
    emptyText: { fontSize: 18, color: colors.textLight, marginTop: 16 },
  });
