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

export default function AdminAuditScreen() {
  const { colors } = useTheme();
  const adminColor = colors.admin || colors.primary;
  const styles = getStyles(colors, adminColor);

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAudit();
    }, []),
  );

  const loadAudit = async () => {
    setLoading(true);
    try {
      // Build audit log from transactions + recharge requests
      const [txnData, rechData] = await Promise.all([
        apiRequest<{ transactions: any[] }>("/api/admin/transactions"),
        apiRequest<{ requests: any[] }>(
          "/api/admin/recharge-requests?status=approved",
        ),
      ]);

      const txnEvents = (txnData.transactions || []).map((t: any) => ({
        id: t._id,
        type: t.type === "recharge" ? "WALLET_RECHARGE" : "PAYMENT",
        actor: t.student?.name || "Student",
        target:
          t.merchant?.shopName || (t.type === "recharge" ? "Wallet" : "—"),
        amount: t.amount,
        status: t.status,
        timestamp: t.createdAt || t.qrTimestamp,
        icon: t.type === "recharge" ? "wallet" : "card",
        color: t.type === "recharge" ? colors.success : colors.primary,
      }));

      const rechEvents = (rechData.requests || []).map((r: any) => ({
        id: r._id,
        type: "RECHARGE_APPROVED",
        actor: "Admin",
        target: r.student?.name || "Student",
        amount: r.amount,
        status: "approved",
        timestamp: r.reviewedAt || r.createdAt,
        icon: "checkmark-circle",
        color: colors.success,
      }));

      const all = [...txnEvents, ...rechEvents]
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        .slice(0, 100);

      setEvents(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={[styles.iconBox, { backgroundColor: item.color + "20" }]}>
        <Ionicons name={item.icon as any} size={20} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardType}>{item.type}</Text>
        <Text style={styles.cardDetail}>
          {item.actor} → {item.target}
        </Text>
        <Text style={styles.cardTs}>
          {item.timestamp
            ? new Date(item.timestamp).toLocaleString("en-IN")
            : "—"}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        {item.amount != null && (
          <Text style={[styles.cardAmount, { color: item.color }]}>
            ₹{(item.amount || 0).toFixed(0)}
          </Text>
        )}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: colors.success + "20" },
          ]}
        >
          <Text style={[styles.statusText, { color: colors.success }]}>
            {(item.status || "").toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit Log</Text>
        <Text style={styles.subtitle}>Last {events.length} events</Text>
      </View>

      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item, i) => item.id || String(i)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadAudit}
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
                name="document-text-outline"
                size={64}
                color={colors.textLight}
              />
              <Text style={styles.emptyText}>No audit events yet</Text>
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
    list: { padding: 16 },
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
    cardType: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 3,
    },
    cardDetail: { fontSize: 12, color: colors.textLight },
    cardTs: { fontSize: 11, color: colors.textLight, marginTop: 2 },
    cardAmount: { fontSize: 16, fontWeight: "bold", marginBottom: 4 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    statusText: { fontSize: 10, fontWeight: "bold" },
    empty: { padding: 60, alignItems: "center" },
    emptyText: { fontSize: 16, color: colors.textLight, marginTop: 16 },
  });
