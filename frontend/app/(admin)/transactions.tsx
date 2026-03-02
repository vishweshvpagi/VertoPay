import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { apiRequest } from "../../utils/api";

export default function AdminTransactionsScreen() {
  const { colors } = useTheme();
  const adminColor = colors.admin || colors.primary;
  const styles = getStyles(colors, adminColor);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "payment" | "recharge">("all");
  const [selected, setSelected] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, []),
  );

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ transactions: any[] }>(
        "/api/admin/transactions",
      );
      setTransactions(data.transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter((t) => {
    const matchFilter =
      filter === "all" ||
      (filter === "payment" && t.type === "payment") ||
      (filter === "recharge" && t.type === "recharge");
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      t.transactionId?.toLowerCase().includes(q) ||
      t.student?.name?.toLowerCase().includes(q) ||
      t.merchant?.shopName?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const totalAmount = filtered
    .filter((t) => t.type === "payment" && t.status === "completed")
    .reduce((s, t) => s + (t.amount || 0), 0);

  const renderItem = ({ item }: { item: any }) => {
    const isRecharge = item.type === "recharge";
    const ts = item.createdAt || item.qrTimestamp;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          setSelected(item);
          setModalVisible(true);
        }}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor:
                (isRecharge ? colors.success : colors.primary) + "20",
            },
          ]}
        >
          <Ionicons
            name={isRecharge ? "arrow-down" : "arrow-up"}
            size={18}
            color={isRecharge ? colors.success : colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>
            {isRecharge
              ? `${item.student?.name || "Student"} — Recharge`
              : `${item.student?.name || "?"} → ${item.merchant?.shopName || "?"}`}
          </Text>
          <Text style={styles.cardSub}>
            {ts ? new Date(ts).toLocaleString("en-IN") : "—"}
          </Text>
          <Text style={styles.cardId}>{item.transactionId || item._id}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={[
              styles.cardAmount,
              { color: isRecharge ? colors.success : colors.primary },
            ]}
          >
            {isRecharge ? "+" : ""}₹{(item.amount || 0).toFixed(2)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: colors.success + "20" },
            ]}
          >
            <Text style={[styles.statusText, { color: colors.success }]}>
              {(item.status || "completed").toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Transactions</Text>
        <Text style={styles.subtitle}>
          {filtered.length} records • ₹{totalAmount.toFixed(0)} volume
        </Text>
      </View>

      {/* Filters */}
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

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textLight} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name, ID..."
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
          autoComplete="off"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item, i) => item._id || item.transactionId || String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadTransactions}
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
                name="receipt-outline"
                size={64}
                color={colors.textLight}
              />
              <Text style={styles.emptyText}>No transactions found</Text>
            </View>
          )
        }
      />

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            {selected && (
              <>
                <Text
                  style={[
                    styles.modalAmount,
                    {
                      color:
                        selected.type === "recharge"
                          ? colors.success
                          : colors.primary,
                    },
                  ]}
                >
                  ₹{(selected.amount || 0).toFixed(2)}
                </Text>
                {[
                  { label: "Type", value: selected.type?.toUpperCase() || "—" },
                  {
                    label: "Status",
                    value: (selected.status || "completed").toUpperCase(),
                  },
                  {
                    label: "Txn ID",
                    value: selected.transactionId || selected._id || "—",
                  },
                  { label: "Student", value: selected.student?.name || "—" },
                  {
                    label: "Student ID",
                    value: selected.student?.studentId || "—",
                  },
                  {
                    label: "Merchant",
                    value:
                      selected.merchant?.shopName ||
                      (selected.type === "recharge" ? "Admin Top-up" : "—"),
                  },
                  {
                    label: "Date/Time",
                    value: selected.createdAt
                      ? new Date(selected.createdAt).toLocaleString("en-IN")
                      : "—",
                  },
                ].map((row) => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue}>{row.value}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any, adminColor: string) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 20, paddingTop: 60, backgroundColor: adminColor },
    title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
    subtitle: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },
    filterRow: { flexDirection: "row", padding: 16, gap: 8 },
    filterTab: {
      flex: 1,
      padding: 10,
      borderRadius: 10,
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterTabActive: { backgroundColor: adminColor, borderColor: adminColor },
    filterText: { fontSize: 13, fontWeight: "600", color: colors.text },
    filterTextActive: { color: "#fff" },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    searchInput: { flex: 1, padding: 12, fontSize: 14 },
    list: { padding: 16, paddingTop: 8 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    iconBox: {
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
      marginBottom: 3,
    },
    cardSub: { fontSize: 12, color: colors.textLight },
    cardId: { fontSize: 10, color: colors.textLight, marginTop: 2 },
    cardAmount: { fontSize: 17, fontWeight: "bold", marginBottom: 4 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: "bold", color: colors.success },
    empty: { padding: 60, alignItems: "center" },
    emptyText: { fontSize: 16, color: colors.textLight, marginTop: 16 },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: 20,
    },
    modalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 24 },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: { fontSize: 20, fontWeight: "bold", color: colors.text },
    modalAmount: {
      fontSize: 36,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 24,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailLabel: { fontSize: 13, color: colors.textLight, fontWeight: "500" },
    detailValue: {
      fontSize: 13,
      color: colors.text,
      fontWeight: "600",
      maxWidth: "60%",
      textAlign: "right",
    },
  });
