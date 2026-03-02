import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { apiRequest } from "../../utils/api";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const router = useRouter();
  const adminColor = colors.admin || "#7c3aed";
  const styles = getStyles(colors, adminColor);

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, []),
  );

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any>("/api/admin/dashboard");
      setStats(data);
    } catch (e) {
      console.error("Dashboard error:", e);
    } finally {
      setLoading(false);
    }
  };

  const confirmLogout = () => {
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to logout?")) doLogout();
    } else {
      setLogoutModal(true);
    }
  };

  const doLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (e) {
      console.error("Logout error:", e);
      setLoggingOut(false);
      setLogoutModal(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadStats}
            colors={[adminColor]}
            tintColor={adminColor}
          />
        }
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {user?.name || user?.email}
            </Text>
          </View>
          <View style={styles.headerBtns}>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleTheme}>
              <Ionicons
                name={theme === "dark" ? "sunny-outline" : "moon-outline"}
                size={22}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconBtn, styles.logoutIconBtn]}
              onPress={confirmLogout}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Content ────────────────────────────────────────────────────── */}
        {loading && !stats ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={adminColor} />
            <Text style={styles.centerText}>Loading dashboard...</Text>
          </View>
        ) : stats ? (
          <>
            {/* Alert banners */}
            {(stats.pendingRecharges > 0 || stats.pendingWithdrawals > 0) && (
              <View style={styles.alertsContainer}>
                {stats.pendingRecharges > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.alertCard,
                      { borderColor: (colors.warning || "#f59e0b") + "60" },
                    ]}
                    onPress={() => router.push("/(admin)/recharge")}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.alertIconBox,
                        {
                          backgroundColor: (colors.warning || "#f59e0b") + "25",
                        },
                      ]}
                    >
                      <Ionicons
                        name="notifications"
                        size={22}
                        color={colors.warning || "#f59e0b"}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.alertTitle,
                          { color: colors.warning || "#f59e0b" },
                        ]}
                      >
                        {stats.pendingRecharges} Pending Recharge
                        {stats.pendingRecharges > 1 ? "s" : ""}
                      </Text>
                      <Text style={styles.alertSub}>
                        Tap to review and approve
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.warning || "#f59e0b"}
                    />
                  </TouchableOpacity>
                )}

                {stats.pendingWithdrawals > 0 && (
                  <TouchableOpacity
                    style={[
                      styles.alertCard,
                      { borderColor: (colors.success || "#22c55e") + "60" },
                    ]}
                    onPress={() => router.push("/(admin)/withdrawals")}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.alertIconBox,
                        {
                          backgroundColor: (colors.success || "#22c55e") + "25",
                        },
                      ]}
                    >
                      <Ionicons
                        name="cash"
                        size={22}
                        color={colors.success || "#22c55e"}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.alertTitle,
                          { color: colors.success || "#22c55e" },
                        ]}
                      >
                        {stats.pendingWithdrawals} Pending Withdrawal
                        {stats.pendingWithdrawals > 1 ? "s" : ""}
                      </Text>
                      <Text style={styles.alertSub}>
                        Tap to review and transfer
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={colors.success || "#22c55e"}
                    />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Top 3 stat cards */}
            <View style={styles.topRow}>
              {[
                {
                  label: "Students",
                  value: stats.totalStudents,
                  icon: "people",
                  color: colors.student || "#6366f1",
                },
                {
                  label: "Merchants",
                  value: stats.totalMerchants,
                  icon: "storefront",
                  color: colors.merchant || "#f59e0b",
                },
                {
                  label: "Transactions",
                  value: stats.totalTransactions,
                  icon: "receipt",
                  color: colors.primary || "#3b82f6",
                },
              ].map((s) => (
                <View
                  key={s.label}
                  style={[styles.topCard, { backgroundColor: s.color }]}
                >
                  <Ionicons name={s.icon as any} size={24} color="#fff" />
                  <Text style={styles.topValue}>{s.value ?? 0}</Text>
                  <Text style={styles.topLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Financial Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Financial Overview</Text>
              <View style={styles.grid}>
                {[
                  {
                    label: "Total Revenue",
                    value: `₹${(stats.totalRevenue || 0).toFixed(0)}`,
                    icon: "trending-up",
                    color: colors.success || "#22c55e",
                  },
                  {
                    label: "Today's Revenue",
                    value: `₹${(stats.todayRevenue || 0).toFixed(0)}`,
                    icon: "today",
                    color: colors.primary || "#3b82f6",
                  },
                  {
                    label: "Today's Txns",
                    value: stats.todayTransactions ?? 0,
                    icon: "flash",
                    color: colors.warning || "#f59e0b",
                  },
                  {
                    label: "Pending Recharges",
                    value: stats.pendingRecharges ?? 0,
                    icon: "wallet",
                    color: colors.danger || "#ef4444",
                  },
                  {
                    label: "Pending Withdrawals",
                    value: stats.pendingWithdrawals ?? 0,
                    icon: "cash",
                    color: colors.merchant || "#f59e0b",
                  },
                  {
                    label: "Total Students",
                    value: stats.totalStudents ?? 0,
                    icon: "school",
                    color: colors.student || "#6366f1",
                  },
                ].map((s) => (
                  <View key={s.label} style={styles.gridCard}>
                    <View
                      style={[
                        styles.gridIconBox,
                        { backgroundColor: s.color + "22" },
                      ]}
                    >
                      <Ionicons
                        name={s.icon as any}
                        size={22}
                        color={s.color}
                      />
                    </View>
                    <Text style={styles.gridValue}>{s.value}</Text>
                    <Text style={styles.gridLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              {[
                {
                  label: "Recharge Requests",
                  icon: "wallet",
                  color: colors.warning || "#f59e0b",
                  route: "/(admin)/recharge",
                  badge: stats.pendingRecharges ?? 0,
                },
                {
                  label: "Withdrawal Requests",
                  icon: "cash",
                  color: colors.success || "#22c55e",
                  route: "/(admin)/withdrawals",
                  badge: stats.pendingWithdrawals ?? 0,
                },
                {
                  label: "Manage Users",
                  icon: "people",
                  color: colors.student || "#6366f1",
                  route: "/(admin)/users",
                  badge: 0,
                },
                {
                  label: "Transactions",
                  icon: "receipt",
                  color: colors.primary || "#3b82f6",
                  route: "/(admin)/transactions",
                  badge: 0,
                },
                {
                  label: "Fraud Detection",
                  icon: "shield",
                  color: colors.danger || "#ef4444",
                  route: "/(admin)/fraud",
                  badge: 0,
                },
                {
                  label: "Audit Log",
                  icon: "document-text",
                  color: colors.textLight || "#94a3b8",
                  route: "/(admin)/audit",
                  badge: 0,
                },
              ].map((a) => (
                <TouchableOpacity
                  key={a.label}
                  style={styles.actionRow}
                  onPress={() => router.push(a.route as any)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.actionIconBox,
                      { backgroundColor: a.color + "20" },
                    ]}
                  >
                    <Ionicons name={a.icon as any} size={22} color={a.color} />
                  </View>
                  <Text style={styles.actionText}>{a.label}</Text>
                  {a.badge > 0 && (
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.danger || "#ef4444" },
                      ]}
                    >
                      <Text style={styles.badgeText}>{a.badge}</Text>
                    </View>
                  )}
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.textLight}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Logout row */}
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.logoutRow}
                onPress={confirmLogout}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionIconBox,
                    { backgroundColor: "#ef444420" },
                  ]}
                >
                  <Ionicons name="log-out-outline" size={22} color="#ef4444" />
                </View>
                <Text style={[styles.actionText, { color: "#ef4444" }]}>
                  Logout
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.centerBox}>
            <Ionicons
              name="cloud-offline-outline"
              size={64}
              color={colors.textLight}
            />
            <Text style={styles.centerText}>Failed to load dashboard</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: adminColor }]}
              onPress={loadStats}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>VertoPay Admin v1.0.0</Text>
          <Text style={styles.footerText}>
            {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
          </Text>
        </View>
      </ScrollView>

      {/* ── Logout modal ───────────────────────────────────────────────────── */}
      <Modal
        visible={logoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => !loggingOut && setLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={40} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to logout from the admin panel?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  styles.cancelBtn,
                  { borderColor: colors.border },
                ]}
                onPress={() => setLogoutModal(false)}
                disabled={loggingOut}
              >
                <Text style={[styles.modalBtnText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={doLogout}
                disabled={loggingOut}
                activeOpacity={0.8}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={18} color="#fff" />
                    <Text
                      style={[
                        styles.modalBtnText,
                        { color: "#fff", marginLeft: 6 },
                      ]}
                    >
                      Logout
                    </Text>
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
    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      padding: 20,
      paddingTop: 60,
      backgroundColor: adminColor,
    },
    title: { fontSize: 26, fontWeight: "bold", color: "#fff" },
    subtitle: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 3 },
    headerBtns: { flexDirection: "row", gap: 10, marginLeft: 12 },
    iconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    logoutIconBtn: { backgroundColor: "rgba(239,68,68,0.6)" },

    // Alerts
    alertsContainer: { gap: 8, margin: 16, marginBottom: 0 },
    alertCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 14,
      gap: 12,
      borderWidth: 1,
    },
    alertIconBox: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
    },
    alertTitle: { fontSize: 14, fontWeight: "700" },
    alertSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },

    // Top cards
    topRow: { flexDirection: "row", padding: 16, paddingBottom: 0, gap: 10 },
    topCard: {
      flex: 1,
      padding: 14,
      borderRadius: 14,
      alignItems: "center",
      gap: 6,
      elevation: 2,
    },
    topValue: { fontSize: 22, fontWeight: "bold", color: "#fff" },
    topLabel: { fontSize: 11, color: "rgba(255,255,255,0.9)" },

    // Sections
    section: { padding: 16 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 14,
    },

    // Grid
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    gridCard: {
      width: "47%",
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    gridIconBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    gridValue: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    gridLabel: { fontSize: 12, color: colors.textLight },

    // Action rows
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 10,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logoutRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ef444410",
      padding: 16,
      borderRadius: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: "#ef444430",
    },
    actionIconBox: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    actionText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
    },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
    badgeText: { fontSize: 12, fontWeight: "bold", color: "#fff" },

    // Center states
    centerBox: { padding: 80, alignItems: "center" },
    centerText: { color: colors.textLight, marginTop: 16, fontSize: 15 },
    retryBtn: {
      marginTop: 20,
      paddingHorizontal: 28,
      paddingVertical: 12,
      borderRadius: 10,
    },
    retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },

    // Footer
    footer: { padding: 24, alignItems: "center", gap: 4 },
    footerText: { fontSize: 12, color: colors.textLight },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.55)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 28,
      alignItems: "center",
    },
    modalIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "#ef444415",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
    },
    modalBody: {
      fontSize: 15,
      color: colors.textLight,
      textAlign: "center",
      marginBottom: 28,
      lineHeight: 22,
    },
    modalBtns: { flexDirection: "row", gap: 12, width: "100%" },
    modalBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 14,
      borderRadius: 12,
    },
    cancelBtn: { backgroundColor: colors.background, borderWidth: 1 },
    confirmBtn: { backgroundColor: "#ef4444" },
    modalBtnText: { fontSize: 15, fontWeight: "700" },
  });
