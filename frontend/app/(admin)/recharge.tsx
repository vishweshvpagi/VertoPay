import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { apiRequest } from "../../utils/api";

export default function AdminRechargeScreen() {
  const { colors } = useTheme();
  const adminColor = colors.admin || colors.primary;
  const styles = getStyles(colors, adminColor);

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">(
    "pending",
  );
  const [processing, setProcessing] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [filter]),
  );

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ requests: any[] }>(
        `/api/admin/recharge-requests?status=${filter}`,
      );
      setRequests(data.requests || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const confirm = (msg: string) =>
    Platform.OS === "web"
      ? Promise.resolve(window.confirm(msg))
      : new Promise<boolean>((res) =>
          Alert.alert("Confirm", msg, [
            { text: "Cancel", onPress: () => res(false) },
            { text: "Confirm", onPress: () => res(true) },
          ]),
        );

  const handleApprove = async (
    requestId: string,
    amount: number,
    name: string,
  ) => {
    if (!(await confirm(`Approve ₹${amount} recharge for ${name}?`))) return;
    setProcessing(requestId);
    try {
      await apiRequest(`/api/admin/recharge-requests/${requestId}/approve`, {
        method: "POST",
      });
      const msg = "Recharge approved and balance credited!";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("✅ Approved", msg);
      loadRequests();
    } catch (e: any) {
      const msg = e?.message || "Failed to approve";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Error", msg);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (
    requestId: string,
    amount: number,
    name: string,
  ) => {
    if (!(await confirm(`Reject ₹${amount} recharge from ${name}?`))) return;
    setProcessing(requestId);
    try {
      await apiRequest(`/api/admin/recharge-requests/${requestId}/reject`, {
        method: "POST",
        body: JSON.stringify({ note: "Rejected by admin" }),
      });
      const msg = "Request rejected.";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Rejected", msg);
      loadRequests();
    } catch (e: any) {
      const msg = e?.message || "Failed to reject";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Error", msg);
    } finally {
      setProcessing(null);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isProcessing = processing === item.requestId;
    const name = item.student?.name || "Unknown";
    const studentId = item.student?.studentId || "—";

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardName}>{name}</Text>
            <Text style={styles.cardSub}>ID: {studentId}</Text>
            <Text style={styles.cardSub}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleString("en-IN")
                : "—"}
            </Text>
          </View>
          <Text style={styles.cardAmount}>₹{item.amount}</Text>
        </View>

        <Text style={styles.cardReqId}>Request ID: {item.requestId}</Text>

        {filter === "pending" && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.approveBtn, isProcessing && { opacity: 0.5 }]}
              onPress={() => handleApprove(item.requestId, item.amount, name)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectBtn, isProcessing && { opacity: 0.5 }]}
              onPress={() => handleReject(item.requestId, item.amount, name)}
              disabled={isProcessing}
            >
              <Ionicons name="close" size={18} color={colors.danger} />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {filter !== "pending" && (
          <View
            style={[
              styles.statusRow,
              {
                backgroundColor:
                  (filter === "approved" ? colors.success : colors.danger) +
                  "15",
              },
            ]}
          >
            <Ionicons
              name={filter === "approved" ? "checkmark-circle" : "close-circle"}
              size={16}
              color={filter === "approved" ? colors.success : colors.danger}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                marginLeft: 6,
                color: filter === "approved" ? colors.success : colors.danger,
              }}
            >
              {filter === "approved" ? "Approved" : "Rejected"}
              {item.reviewedAt
                ? ` • ${new Date(item.reviewedAt).toLocaleDateString("en-IN")}`
                : ""}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recharge Requests</Text>
        <Text style={styles.subtitle}>
          {requests.length} {filter} request{requests.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <View style={styles.filterRow}>
        {(["pending", "approved", "rejected"] as const).map((f) => (
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
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={(item) => item.requestId || item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadRequests}
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
                name="wallet-outline"
                size={64}
                color={colors.textLight}
              />
              <Text style={styles.emptyText}>No {filter} requests</Text>
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
    list: { padding: 16 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 8,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.student || colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    cardName: { fontSize: 16, fontWeight: "700", color: colors.text },
    cardSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    cardAmount: { fontSize: 26, fontWeight: "bold", color: colors.success },
    cardReqId: { fontSize: 11, color: colors.textLight, marginBottom: 12 },
    actions: { flexDirection: "row", gap: 10 },
    approveBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.success,
      padding: 12,
      borderRadius: 10,
      gap: 6,
    },
    approveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
    rejectBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.danger + "15",
      padding: 12,
      borderRadius: 10,
      gap: 6,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    rejectBtnText: { fontSize: 15, fontWeight: "700", color: colors.danger },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      borderRadius: 8,
    },
    empty: { padding: 60, alignItems: "center" },
    emptyText: { fontSize: 18, color: colors.textLight, marginTop: 16 },
  });
