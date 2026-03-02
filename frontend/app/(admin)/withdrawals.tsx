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
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import {
  apiRequest,
  apiDownloadCSV,
  getStoredToken,
  API_BASE_URL,
} from "../../utils/api";

// ── helpers ───────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];
const weekAgoStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
};

export default function AdminWithdrawalsScreen() {
  const { colors } = useTheme();
  const adminColor = colors.admin || "#7c3aed";
  const styles = getStyles(colors, adminColor);

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">(
    "pending",
  );
  const [processing, setProcessing] = useState<string | null>(null);

  // Export modal state
  const [exportModal, setExportModal] = useState(false);
  const [exportFrom, setExportFrom] = useState(weekAgoStr());
  const [exportTo, setExportTo] = useState(todayStr());
  const [exportStatus, setExportStatus] = useState<
    "approved" | "pending" | "rejected"
  >("approved");
  const [exporting, setExporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [filter]),
  );

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ requests: any[] }>(
        `/api/admin/withdrawals?status=${filter}`,
      );
      setRequests(data.requests || []);
    } catch (e: any) {
      console.error("Load withdrawals error:", e);
      showAlert("Error", e?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const confirmDialog = (title: string, msg: string): Promise<boolean> => {
    if (Platform.OS === "web")
      return Promise.resolve(window.confirm(`${title}\n\n${msg}`));
    return new Promise((resolve) =>
      Alert.alert(title, msg, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Confirm", style: "default", onPress: () => resolve(true) },
      ]),
    );
  };

  const showAlert = (title: string, msg: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}: ${msg}`);
      return;
    }
    Alert.alert(title, msg);
  };

  const handleApprove = async (item: any) => {
    const ok = await confirmDialog(
      "Approve Withdrawal",
      `Approve ₹${item.amount} for ${item.merchant?.shopName}?\n\nUPI: ${item.upiId}\n\nMerchant balance will be debited.`,
    );
    if (!ok) return;
    setProcessing(item.requestId);
    try {
      await apiRequest(`/api/admin/withdrawals/${item.requestId}/approve`, {
        method: "POST",
      });
      showAlert(
        "✅ Approved",
        `Remember to manually transfer ₹${item.amount} to UPI: ${item.upiId}`,
      );
      loadRequests();
    } catch (e: any) {
      showAlert("Error", e?.message || "Failed to approve");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (item: any) => {
    const ok = await confirmDialog(
      "Reject Withdrawal",
      `Reject ₹${item.amount} withdrawal from ${item.merchant?.shopName}?`,
    );
    if (!ok) return;
    setProcessing(item.requestId);
    try {
      await apiRequest(`/api/admin/withdrawals/${item.requestId}/reject`, {
        method: "POST",
        body: JSON.stringify({ note: "Rejected by admin" }),
      });
      showAlert("Rejected", "Request rejected.");
      loadRequests();
    } catch (e: any) {
      showAlert("Error", e?.message || "Failed to reject");
    } finally {
      setProcessing(null);
    }
  };

  // ── Export CSV ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ status: exportStatus });
      if (exportFrom.trim()) params.append("from", exportFrom.trim());
      if (exportTo.trim()) params.append("to", exportTo.trim());

      const path = `/api/admin/withdrawals/export?${params.toString()}`;

      if (Platform.OS === "web") {
        // ✅ uses apiDownloadCSV — same token logic as apiRequest
        const blob = await apiDownloadCSV(path);
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `vertopay_withdrawals_${exportStatus}_${todayStr()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
        setExportModal(false);
        showAlert("✅ Exported", "CSV downloaded successfully");
      } else {
        // ✅ Native — expo-file-system + expo-sharing
        const FileSystem = require("expo-file-system");
        const Sharing = require("expo-sharing");
        const token = await getStoredToken(); // ✅ uses shared helper

        const filename = `vertopay_withdrawals_${exportStatus}_${todayStr()}.csv`;
        const fileUri = `${FileSystem.cacheDirectory}${filename}`;

        const result = await FileSystem.downloadAsync(
          `${API_BASE_URL}${path}`,
          fileUri,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (result.status !== 200) throw new Error("Export failed");

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(result.uri, {
            mimeType: "text/csv",
            dialogTitle: "Save or Share Withdrawal CSV",
          });
        } else {
          showAlert("Downloaded", `Saved to: ${result.uri}`);
        }
        setExportModal(false);
      }
    } catch (e: any) {
      showAlert("Export Failed", e?.message || "Could not export CSV");
    } finally {
      setExporting(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === "approved") return colors.success || "#22c55e";
    if (s === "rejected") return colors.danger || "#ef4444";
    return colors.warning || "#f59e0b";
  };

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Withdrawal Requests</Text>
          <Text style={styles.subtitle}>
            {loading
              ? "Loading..."
              : `${requests.length} ${filter} request${requests.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.exportHeaderBtn}
          onPress={() => setExportModal(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="download-outline" size={18} color="#fff" />
          <Text style={styles.exportHeaderBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* ── Filter tabs ────────────────────────────────────────────────── */}
      <View style={styles.filterRow}>
        {(["pending", "approved", "rejected"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={
                f === "pending"
                  ? "time-outline"
                  : f === "approved"
                    ? "checkmark-circle-outline"
                    : "close-circle-outline"
              }
              size={14}
              color={filter === f ? "#fff" : colors.textLight}
            />
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

      {/* ── List ───────────────────────────────────────────────────────── */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item.requestId || item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadRequests}
            colors={[adminColor]}
            tintColor={adminColor}
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
                name="cash-outline"
                size={64}
                color={colors.textLight}
              />
              <Text style={styles.emptyTitle}>No {filter} requests</Text>
              <Text style={styles.emptySubtitle}>
                {filter === "pending"
                  ? "All caught up! No pending withdrawals."
                  : `No ${filter} withdrawal requests yet.`}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const isProcessing = processing === item.requestId;
          const shopName = item.merchant?.shopName || "Unknown";
          const balance = item.merchant?.balance ?? 0;

          return (
            <View
              style={[
                styles.card,
                {
                  borderLeftColor: statusColor(item.status),
                  borderLeftWidth: 4,
                },
              ]}
            >
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: colors.merchant || "#f59e0b" },
                  ]}
                >
                  <Ionicons name="storefront" size={20} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{shopName}</Text>
                  <Text style={styles.cardMeta}>
                    {item.merchant?.merchantId}
                  </Text>
                  <Text style={styles.cardMeta}>{item.merchant?.email}</Text>
                </View>
                <Text style={styles.cardAmount}>₹{item.amount}</Text>
              </View>

              <View style={styles.divider} />

              {/* UPI */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: (colors.primary || "#3b82f6") + "20" },
                  ]}
                >
                  <Ionicons
                    name="phone-portrait-outline"
                    size={16}
                    color={colors.primary || "#3b82f6"}
                  />
                </View>
                <View>
                  <Text style={styles.detailLabel}>UPI ID</Text>
                  <Text style={styles.detailValue}>{item.upiId}</Text>
                </View>
              </View>

              {/* Balance */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: (colors.success || "#22c55e") + "20" },
                  ]}
                >
                  <Ionicons
                    name="wallet-outline"
                    size={16}
                    color={colors.success || "#22c55e"}
                  />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Merchant Balance</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      balance < item.amount && {
                        color: colors.danger || "#ef4444",
                      },
                    ]}
                  >
                    ₹{balance.toFixed(2)}
                    {balance < item.amount ? "  ⚠️ Low" : ""}
                  </Text>
                </View>
              </View>

              {/* Date */}
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: colors.textLight + "20" },
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={colors.textLight}
                  />
                </View>
                <View>
                  <Text style={styles.detailLabel}>Requested</Text>
                  <Text style={styles.detailValue}>
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </View>

              {/* Merchant note */}
              {item.note ? (
                <View style={styles.detailRow}>
                  <View
                    style={[
                      styles.detailIcon,
                      { backgroundColor: colors.textLight + "15" },
                    ]}
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={16}
                      color={colors.textLight}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Note</Text>
                    <Text style={styles.detailValue}>{item.note}</Text>
                  </View>
                </View>
              ) : null}

              {/* Admin note */}
              {item.adminNote ? (
                <View
                  style={[
                    styles.adminNote,
                    {
                      backgroundColor: (colors.danger || "#ef4444") + "10",
                      borderColor: (colors.danger || "#ef4444") + "30",
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
                    {item.adminNote}
                  </Text>
                </View>
              ) : null}

              {item.reviewedAt && (
                <Text style={styles.reviewedText}>
                  {item.status === "approved" ? "✅ Approved" : "❌ Rejected"}{" "}
                  on {new Date(item.reviewedAt).toLocaleDateString("en-IN")}
                </Text>
              )}

              {/* Pending actions */}
              {filter === "pending" && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[
                      styles.approveBtn,
                      { backgroundColor: colors.success || "#22c55e" },
                      (isProcessing || balance < item.amount) && {
                        opacity: 0.5,
                      },
                    ]}
                    onPress={() => handleApprove(item)}
                    disabled={isProcessing || balance < item.amount}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={18} color="#fff" />
                        <Text style={styles.approveTxt}>Approve</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.rejectBtn,
                      {
                        borderColor: colors.danger || "#ef4444",
                        backgroundColor: (colors.danger || "#ef4444") + "12",
                      },
                      isProcessing && { opacity: 0.5 },
                    ]}
                    onPress={() => handleReject(item)}
                    disabled={isProcessing}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={colors.danger || "#ef4444"}
                    />
                    <Text
                      style={[
                        styles.rejectTxt,
                        { color: colors.danger || "#ef4444" },
                      ]}
                    >
                      Reject
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Status badge for non-pending */}
              {filter !== "pending" && (
                <View
                  style={[
                    styles.statusRow,
                    {
                      backgroundColor: statusColor(item.status) + "15",
                      borderColor: statusColor(item.status) + "30",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      item.status === "approved"
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={16}
                    color={statusColor(item.status)}
                  />
                  <Text
                    style={[
                      styles.statusTxt,
                      { color: statusColor(item.status) },
                    ]}
                  >
                    {item.status === "approved"
                      ? "Approved — Transfer Pending"
                      : "Rejected"}
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* ── Export Modal ────────────────────────────────────────────────── */}
      <Modal
        visible={exportModal}
        transparent
        animationType="slide"
        onRequestClose={() => !exporting && setExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIconWrap,
                  { backgroundColor: adminColor + "20" },
                ]}
              >
                <Ionicons
                  name="download-outline"
                  size={28}
                  color={adminColor}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Export CSV
                </Text>
                <Text
                  style={[styles.modalSubtitle, { color: colors.textLight }]}
                >
                  For bulk NEFT/IMPS settlement
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setExportModal(false)}
                disabled={exporting}
              >
                <Ionicons name="close" size={24} color={colors.textLight} />
              </TouchableOpacity>
            </View>

            {/* Status tabs */}
            <Text style={[styles.modalLabel, { color: colors.text }]}>
              Status
            </Text>
            <View style={styles.statusTabs}>
              {(["approved", "pending", "rejected"] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.statusTab,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    },
                    exportStatus === s && {
                      backgroundColor: adminColor,
                      borderColor: adminColor,
                    },
                  ]}
                  onPress={() => setExportStatus(s)}
                >
                  <Text
                    style={[
                      styles.statusTabTxt,
                      { color: colors.textLight },
                      exportStatus === s && { color: "#fff" },
                    ]}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Date range */}
            <Text style={[styles.modalLabel, { color: colors.text }]}>
              Date Range
            </Text>
            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dateLabel, { color: colors.textLight }]}>
                  From
                </Text>
                <TextInput
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={exportFrom}
                  onChangeText={setExportFrom}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textLight}
                  autoComplete="off"
                />
              </View>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.textLight}
                style={{ marginTop: 22 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.dateLabel, { color: colors.textLight }]}>
                  To
                </Text>
                <TextInput
                  style={[
                    styles.dateInput,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={exportTo}
                  onChangeText={setExportTo}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textLight}
                  autoComplete="off"
                />
              </View>
            </View>

            {/* Info box */}
            <View
              style={[
                styles.infoBox,
                {
                  backgroundColor: (colors.primary || "#3b82f6") + "12",
                  borderColor: (colors.primary || "#3b82f6") + "25",
                },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={colors.primary || "#3b82f6"}
              />
              <Text style={[styles.infoTxt, { color: colors.textLight }]}>
                Leave dates empty to export all records. CSV includes UPI IDs,
                amounts and a total row for easy bank upload.
              </Text>
            </View>

            {/* Buttons */}
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[
                  styles.modalCancelBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                  },
                ]}
                onPress={() => setExportModal(false)}
                disabled={exporting}
              >
                <Text style={[styles.modalCancelTxt, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalExportBtn,
                  { backgroundColor: adminColor },
                  exporting && { opacity: 0.6 },
                ]}
                onPress={handleExport}
                disabled={exporting}
                activeOpacity={0.8}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={18} color="#fff" />
                    <Text style={styles.modalExportTxt}>Download CSV</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any, adminColor: string) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      paddingTop: 60,
      backgroundColor: adminColor,
    },
    title: { fontSize: 26, fontWeight: "bold", color: "#fff" },
    subtitle: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },
    exportHeaderBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
    },
    exportHeaderBtnText: { fontSize: 13, fontWeight: "700", color: "#fff" },
    filterRow: { flexDirection: "row", padding: 16, gap: 8 },
    filterTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      padding: 10,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterTabActive: { backgroundColor: adminColor, borderColor: adminColor },
    filterText: { fontSize: 12, fontWeight: "600", color: colors.textLight },
    filterTextActive: { color: "#fff" },
    list: { padding: 16, paddingBottom: 40 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 14,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: "center",
      justifyContent: "center",
    },
    shopName: { fontSize: 17, fontWeight: "700", color: colors.text },
    cardMeta: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    cardAmount: {
      fontSize: 26,
      fontWeight: "bold",
      color: colors.success || "#22c55e",
    },
    divider: { height: 1, backgroundColor: colors.border, marginBottom: 12 },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 10,
    },
    detailIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: "center",
      justifyContent: "center",
    },
    detailLabel: { fontSize: 11, color: colors.textLight, marginBottom: 1 },
    detailValue: { fontSize: 14, fontWeight: "600", color: colors.text },
    adminNote: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      padding: 10,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
    },
    adminNoteText: { flex: 1, fontSize: 12, fontWeight: "600" },
    reviewedText: {
      fontSize: 12,
      color: colors.textLight,
      marginBottom: 10,
      fontStyle: "italic",
    },
    actions: { flexDirection: "row", gap: 10, marginTop: 6 },
    approveBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: 13,
      borderRadius: 10,
    },
    approveTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },
    rejectBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      padding: 13,
      borderRadius: 10,
      borderWidth: 1.5,
    },
    rejectTxt: { fontSize: 15, fontWeight: "700" },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 10,
      borderRadius: 10,
      marginTop: 6,
      borderWidth: 1,
    },
    statusTxt: { fontSize: 13, fontWeight: "700" },
    empty: { padding: 60, alignItems: "center" },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.textLight,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textLight,
      marginTop: 8,
      textAlign: "center",
    },
    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 20,
    },
    modalIconWrap: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
    },
    modalTitle: { fontSize: 20, fontWeight: "bold" },
    modalSubtitle: { fontSize: 13, marginTop: 2 },
    modalLabel: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
    statusTabs: { flexDirection: "row", gap: 8, marginBottom: 20 },
    statusTab: {
      flex: 1,
      padding: 10,
      borderRadius: 8,
      alignItems: "center",
      borderWidth: 1,
    },
    statusTabTxt: { fontSize: 13, fontWeight: "600" },
    dateRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    dateLabel: { fontSize: 12, marginBottom: 6 },
    dateInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14 },
    infoBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      marginBottom: 20,
    },
    infoTxt: { flex: 1, fontSize: 12, lineHeight: 18 },
    modalBtns: { flexDirection: "row", gap: 12 },
    modalCancelBtn: {
      flex: 1,
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
    },
    modalCancelTxt: { fontSize: 15, fontWeight: "600" },
    modalExportBtn: {
      flex: 2,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
      borderRadius: 12,
    },
    modalExportTxt: { fontSize: 15, fontWeight: "700", color: "#fff" },
  });
