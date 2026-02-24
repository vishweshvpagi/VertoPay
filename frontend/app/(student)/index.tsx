import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator, Dimensions, Modal, Platform,
  RefreshControl, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MERCHANT_CATEGORIES } from "../../constants/Config";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { apiRequest } from "../../utils/api";

const { width } = Dimensions.get("window");

export default function StudentHomeScreen() {
  const { user, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  console.log('🏠 StudentHome - User:', user?.email);

  // ✅ Reload every time screen is focused
  useFocusEffect(
    useCallback(() => {
      if (user) loadData();
    }, [user])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      // ✅ Fetch balance from backend
      const meData = await apiRequest<{ user: any }>('/api/auth/me');
      setBalance(meData.user?.balance ?? 0);

      // ✅ Fetch transactions from backend
      const txnData = await apiRequest<{ transactions: any[] }>('/api/transactions/history');
      const txns = txnData.transactions || [];
      setTransactions(txns);

      // Derive unread notification count from unseen transactions
      // (simple approach: count transactions from last 24h as "new")
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recent = txns.filter((t: any) => {
        const ts = t.createdAt || t.qrTimestamp || t.timestamp;
        return ts && new Date(ts).getTime() > oneDayAgo;
      });
      setUnreadCount(recent.length);
    } catch (error) {
      console.error("❌ Load data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMerchantName = (t: any) => {
    // Handle both old AsyncStorage shape and new MongoDB populated shape
    if (t.merchant?.shopName) return t.merchant.shopName;
    const merchantId = t.merchant_id || t.merchantId;
    if (!merchantId || merchantId === 'WALLET_RECHARGE') return 'Wallet Recharge';
    return MERCHANT_CATEGORIES[merchantId] || merchantId;
  };

  const getTimestamp = (t: any) =>
    t.createdAt || t.timestamp || t.qrTimestamp || new Date().toISOString();

  const getAmount = (t: any) =>
    typeof t.amount === 'number' ? t.amount : parseFloat(t.amount) || 0;

  const isPayment = (t: any) =>
    t.type === 'payment' || (t.merchant && t.type !== 'recharge');

  const handleNotificationPress = () => {
    if (unreadCount === 0) {
      setNotificationMessage("No new notifications");
    } else {
      const recent = transactions.slice(0, unreadCount);
      const message = recent.map((t: any) => {
        const amt = getAmount(t);
        return isPayment(t)
          ? `• Payment of ₹${amt.toFixed(2)} to ${getMerchantName(t)}`
          : `• Wallet recharged with ₹${amt.toFixed(2)}`;
      }).join('\n');
      setNotificationMessage(message);
      setUnreadCount(0);
    }
    setNotificationModalVisible(true);
  };

  // Stats computed from real backend transactions
  const rechargeCount = transactions.filter((t) => t.type === 'recharge').length;
  const paymentCount  = transactions.filter((t) => isPayment(t)).length;
  const totalSpent    = transactions
    .filter((t) => isPayment(t))
    .reduce((sum, t) => sum + getAmount(t), 0);

  const recentTransactions = transactions.slice(0, 5);
  const styles = getStyles(colors as unknown as Record<string, string>);

  if (authLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.student} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>No user data</Text>
      </View>
    );
  }

  const userName  = user.name || user.fullName || user.email?.split('@')[0] || 'Student';
  const studentId = user.studentId || user._id || user.id || 'N/A';

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
            colors={[colors.student]}
            tintColor={colors.student}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerGradient, { paddingTop: insets.top + 24 }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.greeting}>Welcome back! 👋</Text>
                <Text style={styles.name}>{userName}</Text>
                <View style={styles.studentIdContainer}>
                  <Ionicons name="school" size={14} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.studentId}>ID: {studentId}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.notificationBtn}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={22} color="#fff" />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCardContainer}>
          <View style={styles.balanceCard}>
            <View style={styles.balanceCardGradient} />
            <View style={styles.balanceCardContent}>
              <View style={styles.balanceHeader}>
                <View>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <View style={styles.balanceAmountContainer}>
                    <Text style={styles.currencySymbol}>₹</Text>
                    <Text style={styles.balanceAmount}>{balance.toFixed(2)}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={loadData} activeOpacity={0.7}>
                  <Ionicons name="refresh" size={20} color="rgba(255,255,255,0.9)" />
                </TouchableOpacity>
              </View>
              <View style={styles.balanceActions}>
                <TouchableOpacity
                  style={styles.rechargeBtn}
                  onPress={() => router.push("/(student)/wallet")}
                  activeOpacity={0.8}
                >
                  <View style={styles.btnIconContainer}>
                    <Ionicons name="add-circle" size={20} color="#fff" />
                  </View>
                  <Text style={styles.rechargeBtnText}>Recharge</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.sectionTitleUnderline} />
          </View>
          <View style={styles.quickActions}>
            {[
              { icon: 'restaurant', label: 'Canteen',  color: colors.primary,   bg: 'actionIconPrimary' },
              { icon: 'book',       label: 'Library',  color: colors.success,   bg: 'actionIconSuccess' },
              { icon: 'medical',    label: 'Clinic',   color: '#EC4899',        bg: 'actionIconMedical' },
              { icon: 'print',      label: 'Print',    color: colors.warning,   bg: 'actionIconWarning' },
              { icon: 'shirt',      label: 'Laundry',  color: colors.primary,   bg: 'actionIconPrimary' },
              { icon: 'film',       label: 'Events',   color: colors.warning,   bg: 'actionIconWarning' },
              { icon: 'ellipsis-horizontal', label: 'More', color: colors.danger, bg: 'actionIconDanger' },
            ].map(({ icon, label, color, bg }) => (
              <TouchableOpacity
                key={label}
                style={styles.actionCard}
                onPress={() => router.push("/(student)/pay")}
                activeOpacity={0.7}
              >
                <View style={[styles.actionIcon, styles[bg as keyof typeof styles] as any]}>
                  <Ionicons name={icon as any} size={22} color={color} />
                </View>
                <Text style={styles.actionText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Stats — from real backend data */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <View style={styles.sectionTitleUnderline} />
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, styles.statIconSuccess]}>
                <Ionicons name="trending-up" size={20} color={colors.success} />
              </View>
              <Text style={styles.statNumber}>{rechargeCount}</Text>
              <Text style={styles.statLabel}>Recharges</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, styles.statIconPrimary]}>
                <Ionicons name="cart" size={20} color={colors.primary} />
              </View>
              <Text style={styles.statNumber}>{paymentCount}</Text>
              <Text style={styles.statLabel}>Payments</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconContainer, styles.statIconWarning]}>
                <Ionicons name="cash" size={20} color={colors.warning} />
              </View>
              <Text style={styles.statNumber}>₹{totalSpent.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <View style={styles.sectionTitleUnderline} />
            </View>
            <TouchableOpacity onPress={() => router.push("/(student)/history")} activeOpacity={0.7}>
              <View style={styles.viewAllContainer}>
                <Text style={styles.viewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.student} />
              </View>
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            recentTransactions.map((txn, index) => {
              const payment = isPayment(txn);
              const amount  = getAmount(txn);
              const ts      = getTimestamp(txn);
              return (
                <TouchableOpacity
                  key={txn.transactionId || txn._id || index}
                  style={styles.txnCard}
                  activeOpacity={0.7}
                >
                  <View style={[styles.txnIcon, payment ? styles.txnIconPayment : styles.txnIconRecharge]}>
                    <Ionicons
                      name={payment ? "arrow-up" : "arrow-down"}
                      size={18}
                      color={payment ? colors.danger : colors.success}
                    />
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnTitle}>
                      {payment ? getMerchantName(txn) : "Wallet Recharge"}
                    </Text>
                    <Text style={styles.txnDate}>
                      {new Date(ts).toLocaleDateString('en-IN')} •{" "}
                      {new Date(ts).toLocaleTimeString('en-IN', { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                  <View style={styles.txnAmountContainer}>
                    <Text style={[styles.txnAmount, { color: payment ? colors.danger : colors.success }]}>
                      {payment ? "-" : "+"}₹{amount.toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="receipt-outline" size={48} color={colors.student} />
              </View>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Start by recharging your wallet or scan to pay at campus outlets
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push("/(student)/wallet")}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyButtonText}>Recharge Now</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Notification Modal */}
      <Modal
        visible={notificationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="notifications" size={28} color={colors.student} />
              <Text style={styles.modalTitle}>Notifications</Text>
              <TouchableOpacity
                onPress={() => setNotificationModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>{notificationMessage}</Text>
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setNotificationModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function getStyles(colors: Record<string, string>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingText: { marginTop: 16, fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
    errorText: { fontSize: 16, color: colors.danger, fontWeight: '600' },
    header: { paddingBottom: 0, overflow: "hidden" },
    headerGradient: {
      backgroundColor: colors.student, paddingBottom: 30, paddingHorizontal: 20,
      ...Platform.select({
        ios: { shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
        android: { elevation: 8 },
      }),
    },
    headerContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    headerTextContainer: { flex: 1 },
    greeting: { fontSize: 15, color: "#fff", opacity: 0.95, fontWeight: "500", letterSpacing: 0.3, marginBottom: 4 },
    name: { fontSize: 28, fontWeight: "700", color: "#fff", marginTop: 2, marginBottom: 6, letterSpacing: -0.5 },
    studentIdContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
    studentId: { fontSize: 13, color: "#fff", opacity: 0.9, fontWeight: "500" },
    notificationBtn: {
      width: 48, height: 48, borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.25)",
      alignItems: "center", justifyContent: "center",
      borderWidth: 1, borderColor: "rgba(255,255,255,0.3)", position: "relative",
    },
    notificationBadge: {
      position: "absolute", top: 6, right: 6, minWidth: 18, height: 18,
      borderRadius: 9, backgroundColor: "#EF4444", borderWidth: 2, borderColor: "#fff",
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    },
    notificationBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    balanceCardContainer: { marginHorizontal: 20, marginTop: -20, marginBottom: 8 },
    balanceCard: {
      borderRadius: 24, overflow: "hidden",
      ...Platform.select({
        ios: { shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
        android: { elevation: 12 },
      }),
    },
    balanceCardGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.student, opacity: 0.95 },
    balanceCardContent: { padding: 28, backgroundColor: "transparent" },
    balanceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
    balanceLabel: { fontSize: 14, color: "rgba(255,255,255,0.9)", fontWeight: "500", letterSpacing: 0.5, marginBottom: 8 },
    balanceAmountContainer: { flexDirection: "row", alignItems: "baseline", gap: 4 },
    currencySymbol: { fontSize: 28, fontWeight: "600", color: "rgba(255,255,255,0.95)" },
    balanceAmount: { fontSize: 44, fontWeight: "700", color: "#fff", letterSpacing: -1 },
    refreshBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center", justifyContent: "center",
      borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
    },
    balanceActions: { flexDirection: "row", gap: 14, marginTop: 8 },
    btnIconContainer: { marginRight: 6 },
    rechargeBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.25)", paddingVertical: 16, paddingHorizontal: 20,
      borderRadius: 16, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)",
    },
    rechargeBtnText: { color: "#fff", fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },
    section: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    sectionTitleContainer: { flex: 1 },
    sectionTitle: { fontSize: 22, fontWeight: "700", color: colors.text, letterSpacing: -0.3, marginBottom: 6 },
    sectionTitleUnderline: { width: 40, height: 3, backgroundColor: colors.student, borderRadius: 2, opacity: 0.6 },
    viewAllContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
    viewAllText: { fontSize: 14, color: colors.student, fontWeight: "600", letterSpacing: 0.2 },
    quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
    actionCard: {
      width: (width - 64) / 4, backgroundColor: colors.card,
      padding: 16, borderRadius: 18, alignItems: "center",
      borderWidth: 1, borderColor: colors.borderLight, marginBottom: 12,
      ...Platform.select({
        ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
        android: { elevation: 3 },
      }),
    },
    actionIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 10 },
    actionIconPrimary:  { backgroundColor: colors.primary + "15" },
    actionIconSuccess:  { backgroundColor: colors.success + "15" },
    actionIconMedical:  { backgroundColor: "#EC489915" },
    actionIconWarning:  { backgroundColor: colors.warning + "15" },
    actionIconDanger:   { backgroundColor: colors.danger  + "15" },
    actionText: { fontSize: 12, fontWeight: "600", color: colors.text, textAlign: "center", letterSpacing: 0.2 },
    statsGrid: { flexDirection: "row", gap: 14 },
    statCard: {
      flex: 1, backgroundColor: colors.card, padding: 20, borderRadius: 20,
      alignItems: "center", borderWidth: 1, borderColor: colors.borderLight,
      ...Platform.select({
        ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
        android: { elevation: 4 },
      }),
    },
    statIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 12 },
    statIconSuccess: { backgroundColor: colors.success + "15" },
    statIconPrimary: { backgroundColor: colors.primary + "15" },
    statIconWarning: { backgroundColor: colors.warning + "15" },
    statNumber: { fontSize: 22, fontWeight: "700", color: colors.text, marginTop: 4, letterSpacing: -0.5 },
    statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 6, fontWeight: "500", letterSpacing: 0.2 },
    txnCard: {
      flexDirection: "row", backgroundColor: colors.card, padding: 16,
      borderRadius: 18, marginBottom: 12, alignItems: "center",
      borderWidth: 1, borderColor: colors.borderLight,
      ...Platform.select({
        ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
        android: { elevation: 2 },
      }),
    },
    txnIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 14 },
    txnIconPayment:  { backgroundColor: colors.danger  + "15" },
    txnIconRecharge: { backgroundColor: colors.success + "15" },
    txnInfo: { flex: 1 },
    txnTitle: { fontSize: 16, fontWeight: "600", color: colors.text, marginBottom: 4, letterSpacing: -0.2 },
    txnDate: { fontSize: 12, color: colors.textSecondary, fontWeight: "500" },
    txnAmountContainer: { alignItems: "flex-end" },
    txnAmount: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
    emptyState: {
      alignItems: "center", padding: 48, backgroundColor: colors.card,
      borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight, marginTop: 8,
      ...Platform.select({
        ios: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
        android: { elevation: 3 },
      }),
    },
    emptyIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.student + "18", alignItems: "center", justifyContent: "center" },
    emptyText: { fontSize: 20, color: colors.text, marginTop: 20, fontWeight: "600", letterSpacing: -0.3 },
    emptySubtext: { fontSize: 15, color: colors.textSecondary, marginTop: 8, textAlign: "center", fontWeight: "500" },
    emptyButton: {
      backgroundColor: colors.student, paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, marginTop: 24,
      ...Platform.select({
        ios: { shadowColor: colors.student, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
        android: { elevation: 4 },
      }),
    },
    emptyButtonText: { color: "#fff", fontSize: 16, fontWeight: "600", letterSpacing: 0.3 },
    scrollContent: { paddingBottom: 100 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 20 },
    modalContent: {
      backgroundColor: colors.card, borderRadius: 24, width: "100%", maxWidth: 400, padding: 24,
      ...Platform.select({
        ios: { shadowColor: colors.shadowDark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
        android: { elevation: 12 },
      }),
    },
    modalHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
    modalTitle: { fontSize: 22, fontWeight: "700", color: colors.text, flex: 1 },
    modalCloseBtn: { padding: 4 },
    modalBody: { marginBottom: 24 },
    modalMessage: { fontSize: 16, color: colors.text, lineHeight: 24 },
    modalButton: { backgroundColor: colors.student, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: "center" },
    modalButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  });
}
