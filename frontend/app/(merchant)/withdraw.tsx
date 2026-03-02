import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { apiRequest } from "../../utils/api";

export default function MerchantWithdrawScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const merchantColor = colors.merchant || "#f59e0b";
  const styles = getStyles(colors, merchantColor);

  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [tab, setTab] = useState<"request" | "history">("request");

  // ✅ Fresh balance — not from stale auth context
  const [balance, setBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // ✅ Fetch both balance and history on every screen focus
  useFocusEffect(
    useCallback(() => {
      fetchBalance();
      loadHistory();
    }, []),
  );

  const fetchBalance = async () => {
    setBalanceLoading(true);
    try {
      const data = await apiRequest<{ balance: number }>(
        "/api/merchants/balance",
      );
      setBalance(data.balance ?? 0);
    } catch (e) {
      console.error("Fetch balance error:", e);
    } finally {
      setBalanceLoading(false);
    }
  };

  const loadHistory = async () => {
    setFetching(true);
    try {
      const data = await apiRequest<{ requests: any[] }>(
        "/api/merchants/withdraw/history",
      );
      setHistory(data.requests || []);
    } catch (e) {
      console.error("Load history error:", e);
    } finally {
      setFetching(false);
    }
  };

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${msg}`);
      return;
    }
    Alert.alert(title, msg);
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);

    if (!parsedAmount || parsedAmount < 100) {
      showAlert("Invalid Amount", "Minimum withdrawal is ₹100");
      return;
    }
    if (!upiId.trim()) {
      showAlert("UPI ID Required", "Please enter your UPI ID");
      return;
    }
    if (parsedAmount > balance) {
      showAlert(
        "Insufficient Balance",
        `Your available balance is ₹${balance.toFixed(2)}`,
      );
      return;
    }

    setLoading(true);
    try {
      await apiRequest("/api/merchants/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: parsedAmount,
          upiId: upiId.trim(),
          note: note.trim(),
        }),
      });

      setAmount("");
      setUpiId("");
      setNote("");

      // Refresh both after submit
      await Promise.all([fetchBalance(), loadHistory()]);
      setTab("history");

      showAlert(
        "✅ Request Submitted",
        "Admin will review and transfer to your UPI ID shortly.",
      );
    } catch (e: any) {
      showAlert("Error", e?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "approved") return colors.success || "#22c55e";
    if (s === "rejected") return colors.danger || "#ef4444";
    return colors.warning || "#f59e0b";
  };

  const statusIcon = (s: string): any => {
    if (s === "approved") return "checkmark-circle";
    if (s === "rejected") return "close-circle";
    return "time";
  };

  const pendingCount = history.filter((r) => r.status === "pending").length;
  const hasPending = pendingCount > 0;

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Fund Withdrawal</Text>
          <Text style={styles.subtitle}>
            {user?.shopName || user?.name || "Merchant"}
          </Text>
        </View>

        {/* ✅ Balance badge with refresh button */}
        <TouchableOpacity
          style={styles.balanceBadge}
          onPress={fetchBalance}
          activeOpacity={0.7}
        >
          {balanceLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="wallet" size={18} color="#fff" />
              <Text style={styles.balanceBadgeText}>₹{balance.toFixed(2)}</Text>
              <Ionicons
                name="refresh"
                size={14}
                color="rgba(255,255,255,0.7)"
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ✅ Available balance bar below header */}
      <View
        style={[styles.balanceBar, { backgroundColor: merchantColor + "15" }]}
      >
        <Ionicons
          name="information-circle-outline"
          size={16}
          color={merchantColor}
        />
        <Text style={[styles.balanceBarText, { color: merchantColor }]}>
          Available for withdrawal:{" "}
          <Text style={{ fontWeight: "800" }}>₹{balance.toFixed(2)}</Text>
        </Text>
        {balanceLoading && (
          <ActivityIndicator
            size="small"
            color={merchantColor}
            style={{ marginLeft: 8 }}
          />
        )}
      </View>

      {/* Pending warning */}
      {hasPending && (
        <View style={styles.pendingBanner}>
          <Ionicons name="time" size={18} color={colors.warning || "#f59e0b"} />
          <Text style={styles.pendingBannerText}>
            You have {pendingCount} pending request{pendingCount > 1 ? "s" : ""}{" "}
            awaiting admin approval
          </Text>
        </View>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "request" && styles.tabActive]}
          onPress={() => setTab("request")}
        >
          <Ionicons
            name="send-outline"
            size={16}
            color={tab === "request" ? "#fff" : colors.text}
          />
          <Text
            style={[styles.tabText, tab === "request" && styles.tabTextActive]}
          >
            New Request
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "history" && styles.tabActive]}
          onPress={() => setTab("history")}
        >
          <Ionicons
            name="list-outline"
            size={16}
            color={tab === "history" ? "#fff" : colors.text}
          />
          <Text
            style={[styles.tabText, tab === "history" && styles.tabTextActive]}
          >
            History {history.length > 0 ? `(${history.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Request Form ─────────────────────────────────────────────── */}
      {tab === "request" ? (
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Info */}
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle-outline"
              size={22}
              color={colors.primary || "#3b82f6"}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                Submit your UPI ID and amount. Admin will review and manually
                transfer the funds. Minimum withdrawal is ₹100.
              </Text>
            </View>
          </View>

          {/* Amount */}
          <Text style={styles.label}>Amount (₹) *</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputPrefix}>₹</Text>
            <TextInput
              style={[styles.inputInner, { color: colors.text }]}
              placeholder="Enter amount (min ₹100)"
              placeholderTextColor={colors.textLight}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              autoComplete="off"
              returnKeyType="next"
            />
          </View>

          {/* Quick amount buttons */}
          <View style={styles.quickAmounts}>
            {["500", "1000", "2000", "5000"].map((a) => (
              <TouchableOpacity
                key={a}
                style={[
                  styles.quickAmtBtn,
                  amount === a && {
                    backgroundColor: merchantColor,
                    borderColor: merchantColor,
                  },
                ]}
                onPress={() => setAmount(a)}
              >
                <Text
                  style={[
                    styles.quickAmtText,
                    amount === a && { color: "#fff" },
                  ]}
                >
                  ₹{a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* UPI ID */}
          <Text style={styles.label}>UPI ID *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons
              name="phone-portrait-outline"
              size={18}
              color={colors.textLight}
              style={{ paddingHorizontal: 12 }}
            />
            <TextInput
              style={[styles.inputInner, { color: colors.text }]}
              placeholder="yourname@upi"
              placeholderTextColor={colors.textLight}
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              keyboardType="email-address"
              returnKeyType="next"
            />
          </View>

          {/* Note */}
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={[styles.textArea, { color: colors.text }]}
            placeholder="Any additional info for admin..."
            placeholderTextColor={colors.textLight}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            autoComplete="off"
            textAlignVertical="top"
          />

          {/* Summary */}
          {amount && upiId ? (
            <View
              style={[
                styles.summaryCard,
                {
                  borderColor: merchantColor + "40",
                  backgroundColor: merchantColor + "10",
                },
              ]}
            >
              <Text style={[styles.summaryTitle, { color: merchantColor }]}>
                Request Summary
              </Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={[styles.summaryValue, { color: merchantColor }]}>
                  ₹{parseFloat(amount || "0").toFixed(2)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>UPI ID</Text>
                <Text style={styles.summaryValue}>{upiId}</Text>
              </View>
              <View style={[styles.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.summaryLabel}>Remaining Balance</Text>
                <Text style={styles.summaryValue}>
                  ₹{Math.max(0, balance - parseFloat(amount || "0")).toFixed(2)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: merchantColor },
              (loading || hasPending) && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            disabled={loading || hasPending}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" />
                <Text style={styles.submitText}>
                  {hasPending ? "Pending Request Exists" : "Submit Request"}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {hasPending && (
            <Text style={styles.pendingNote}>
              You can only have one pending request at a time. Wait for admin to
              process it before submitting a new one.
            </Text>
          )}
        </ScrollView>
      ) : (
        /* ── History ─────────────────────────────────────────────────── */
        <FlatList
          data={history}
          keyExtractor={(item) => item.requestId || item._id}
          contentContainerStyle={styles.list}
          refreshing={fetching}
          onRefresh={() => {
            fetchBalance();
            loadHistory();
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            fetching ? (
              <View style={styles.empty}>
                <ActivityIndicator size="large" color={merchantColor} />
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons
                  name="wallet-outline"
                  size={64}
                  color={colors.textLight}
                />
                <Text style={styles.emptyTitle}>
                  No withdrawal requests yet
                </Text>
                <Text style={styles.emptySubtitle}>
                  Submit your first request from the New Request tab
                </Text>
                <TouchableOpacity
                  style={[styles.emptyBtn, { backgroundColor: merchantColor }]}
                  onPress={() => setTab("request")}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    Make a Request
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.card,
                {
                  borderLeftColor: statusColor(item.status),
                  borderLeftWidth: 4,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <View
                  style={[
                    styles.cardIconBox,
                    { backgroundColor: statusColor(item.status) + "20" },
                  ]}
                >
                  <Ionicons
                    name={statusIcon(item.status)}
                    size={24}
                    color={statusColor(item.status)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardAmount}>₹{item.amount}</Text>
                  <Text style={styles.cardDate}>
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor(item.status) + "20" },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: statusColor(item.status) },
                    ]}
                  >
                    {item.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDetailRow}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={14}
                  color={colors.textLight}
                />
                <Text style={styles.cardDetailText}>UPI: {item.upiId}</Text>
              </View>

              {item.note ? (
                <View style={styles.cardDetailRow}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={14}
                    color={colors.textLight}
                  />
                  <Text style={styles.cardDetailText}>{item.note}</Text>
                </View>
              ) : null}

              {item.adminNote ? (
                <View
                  style={[
                    styles.adminNoteBox,
                    {
                      backgroundColor: colors.danger + "10",
                      borderColor: colors.danger + "30",
                    },
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={14}
                    color={colors.danger}
                  />
                  <Text
                    style={[styles.adminNoteText, { color: colors.danger }]}
                  >
                    Admin: {item.adminNote}
                  </Text>
                </View>
              ) : null}

              {item.reviewedAt && (
                <Text style={styles.reviewedText}>
                  {item.status === "approved" ? "✅ Approved" : "❌ Rejected"}{" "}
                  on {new Date(item.reviewedAt).toLocaleDateString("en-IN")}
                </Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const getStyles = (colors: any, merchantColor: string) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 20,
      paddingTop: 60,
      backgroundColor: merchantColor,
    },
    title: { fontSize: 26, fontWeight: "bold", color: "#fff" },
    subtitle: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },
    balanceBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
      minWidth: 80,
      justifyContent: "center",
    },
    balanceBadgeText: { fontSize: 15, fontWeight: "bold", color: "#fff" },
    balanceBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    balanceBarText: { fontSize: 14, fontWeight: "600" },
    pendingBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: (colors.warning || "#f59e0b") + "15",
      margin: 12,
      marginBottom: 0,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: (colors.warning || "#f59e0b") + "40",
    },
    pendingBannerText: {
      flex: 1,
      fontSize: 13,
      color: colors.warning || "#f59e0b",
      fontWeight: "500",
    },
    tabRow: { flexDirection: "row", padding: 16, gap: 10 },
    tabBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabActive: { backgroundColor: merchantColor, borderColor: merchantColor },
    tabText: { fontSize: 13, fontWeight: "600", color: colors.text },
    tabTextActive: { color: "#fff" },
    form: { padding: 16, paddingTop: 4, paddingBottom: 40 },
    infoBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      backgroundColor: (colors.primary || "#3b82f6") + "12",
      padding: 14,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: (colors.primary || "#3b82f6") + "25",
    },
    infoTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 4,
    },
    infoText: { fontSize: 12, color: colors.textLight, lineHeight: 18 },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 18,
      overflow: "hidden",
    },
    inputPrefix: {
      paddingHorizontal: 14,
      fontSize: 18,
      fontWeight: "bold",
      color: colors.textLight,
    },
    inputInner: { flex: 1, padding: 14, fontSize: 15 },
    textArea: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 18,
      height: 90,
    },
    quickAmounts: {
      flexDirection: "row",
      gap: 8,
      marginTop: -10,
      marginBottom: 18,
    },
    quickAmtBtn: {
      flex: 1,
      padding: 8,
      borderRadius: 8,
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickAmtText: { fontSize: 13, fontWeight: "600", color: colors.text },
    summaryCard: {
      borderRadius: 12,
      padding: 14,
      marginBottom: 18,
      borderWidth: 1,
    },
    summaryTitle: { fontSize: 14, fontWeight: "700", marginBottom: 10 },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    summaryLabel: { fontSize: 13, color: colors.textLight },
    summaryValue: { fontSize: 13, fontWeight: "600", color: colors.text },
    submitBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 16,
      borderRadius: 12,
      marginTop: 4,
    },
    submitText: { fontSize: 16, fontWeight: "700", color: "#fff" },
    pendingNote: {
      fontSize: 12,
      color: colors.textLight,
      textAlign: "center",
      marginTop: 12,
      lineHeight: 18,
    },
    list: { padding: 16, paddingBottom: 40 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    cardIconBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    cardAmount: { fontSize: 22, fontWeight: "bold", color: colors.text },
    cardDate: { fontSize: 12, color: colors.textLight, marginTop: 3 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    statusText: { fontSize: 11, fontWeight: "700" },
    cardDetailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginBottom: 6,
    },
    cardDetailText: { fontSize: 13, color: colors.textLight },
    adminNoteBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 10,
      borderRadius: 8,
      marginTop: 6,
      borderWidth: 1,
    },
    adminNoteText: { flex: 1, fontSize: 12, fontWeight: "600" },
    reviewedText: {
      fontSize: 12,
      color: colors.textLight,
      marginTop: 8,
      fontStyle: "italic",
    },
    empty: { padding: 60, alignItems: "center" },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.textLight,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textLight,
      marginTop: 8,
      textAlign: "center",
    },
    emptyBtn: {
      marginTop: 20,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 10,
    },
  });
