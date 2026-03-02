import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { apiRequest } from "../../utils/api";

export default function AdminFraudScreen() {
  const { colors } = useTheme();
  const adminColor = colors.admin || colors.primary;
  const styles = getStyles(colors, adminColor);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch all transactions and flag suspicious ones (high value or duplicates)
      const data = await apiRequest<{ transactions: any[] }>(
        "/api/admin/transactions",
      );
      const all = data.transactions || [];

      // Flag: amount > ₹5000 OR same student had 3+ txns in 1 hour
      const suspicious = all.filter((t: any) => {
        if (t.amount > 5000) return true;
        const studentTxns = all.filter(
          (x: any) => x.student?._id === t.student?._id && x.type === "payment",
        );
        if (studentTxns.length >= 3) {
          const sorted = studentTxns
            .map((x: any) => new Date(x.createdAt).getTime())
            .sort();
          const oldest = sorted[0],
            newest = sorted[sorted.length - 1];
          if (newest - oldest < 60 * 60 * 1000) return true;
        }
        return false;
      });

      setTransactions(suspicious);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isHighValue = item.amount > 5000;
    const ts = item.createdAt || item.qrTimestamp;

    return (
      <View style={styles.card}>
        <View
          style={[styles.flagIcon, { backgroundColor: colors.danger + "20" }]}
        >
          <Ionicons name="warning" size={22} color={colors.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>
            {item.student?.name || "Unknown"} →{" "}
            {item.merchant?.shopName || "Unknown"}
          </Text>
          <Text style={styles.cardSub}>
            {ts ? new Date(ts).toLocaleString("en-IN") : "—"}
          </Text>
          <View
            style={[
              styles.flagBadge,
              { backgroundColor: colors.danger + "15" },
            ]}
          >
            <Text style={[styles.flagText, { color: colors.danger }]}>
              {isHighValue
                ? "⚡ High Value Transaction"
                : "⚡ Rapid Transactions"}
            </Text>
          </View>
        </View>
        <Text style={[styles.amount, { color: colors.danger }]}>
          ₹{(item.amount || 0).toFixed(0)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Fraud Detection</Text>
        <Text style={styles.subtitle}>
          {transactions.length} flagged transaction
          {transactions.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Legend */}
      <View style={styles.legendBox}>
        <View style={styles.legendRow}>
          <Ionicons name="warning" size={16} color={colors.danger} />
          <Text style={styles.legendText}>Transactions over ₹5,000</Text>
        </View>
        <View style={styles.legendRow}>
          <Ionicons name="warning" size={16} color={colors.danger} />
          <Text style={styles.legendText}>
            3+ transactions by same student within 1 hour
          </Text>
        </View>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderItem}
        keyExtractor={(item, i) => item._id || String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            colors={[adminColor]}
          />
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color={adminColor} />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons
                name="shield-checkmark-outline"
                size={64}
                color={colors.success}
              />
              <Text style={[styles.emptyText, { color: colors.success }]}>
                No suspicious activity
              </Text>
              <Text style={styles.emptySub}>All transactions look normal</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const getStyles = (colors: any, adminColor: string) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 20, paddingTop: 60, backgroundColor: adminColor },
    title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
    subtitle: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },
    legendBox: {
      margin: 16,
      backgroundColor: colors.danger + "10",
      borderRadius: 12,
      padding: 14,
      gap: 8,
      borderWidth: 1,
      borderColor: colors.danger + "30",
    },
    legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    legendText: { fontSize: 13, color: colors.text },
    list: { padding: 16 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.danger + "40",
      gap: 12,
    },
    flagIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    cardSub: { fontSize: 12, color: colors.textLight, marginBottom: 6 },
    flagBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    flagText: { fontSize: 11, fontWeight: "700" },
    amount: { fontSize: 18, fontWeight: "bold" },
    empty: { padding: 60, alignItems: "center" },
    emptyText: { fontSize: 18, marginTop: 16, fontWeight: "600" },
    emptySub: { fontSize: 14, color: colors.textLight, marginTop: 8 },
  });
