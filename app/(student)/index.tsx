import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { COLORS, MERCHANT_CATEGORIES } from "../../constants/Config";
import { useAuth } from "../../hooks/useAuth";

const { width } = Dimensions.get("window");

export default function StudentHomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      loadNotifications();
    }
  }, [transactions]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (user?.email) {
        const walletData = await AsyncStorage.getItem(`WALLET_${user.email}`);
        if (walletData) {
          const wallet = JSON.parse(walletData);
          setBalance(wallet.balance || 0);
          setTransactions(wallet.transactions || []);
        }
      }
    } catch (error) {
      console.error("Load wallet error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMerchantName = (merchantId: string) => {
    if (merchantId === "WALLET_RECHARGE") return "Wallet Recharge";
    return MERCHANT_CATEGORIES[merchantId] || merchantId;
  };

  const loadNotifications = async () => {
    try {
      if (user?.email) {
        const notificationsData = await AsyncStorage.getItem(`NOTIFICATIONS_${user.email}`);
        
        let allNotifications: any[] = notificationsData ? JSON.parse(notificationsData) : [];
        
        // Generate notifications from recent transactions
        if (transactions.length > 0) {
          const existingNotificationIds = new Set(allNotifications.map((n: any) => n.transactionId));
          const newNotifications: any[] = [];
          
          // Check last 10 transactions for new notifications
          const recentTxns = transactions.slice(0, 10);
          for (const txn of recentTxns) {
            if (!existingNotificationIds.has(txn.transaction_id)) {
              let message = '';
              if (txn.type === 'recharge') {
                message = `Wallet recharged with ₹${txn.amount}`;
              } else if (txn.type === 'payment') {
                const merchantName = getMerchantName(txn.merchant_id);
                message = `Payment of ₹${txn.amount} to ${merchantName}`;
              } else if (txn.type === 'reversal') {
                message = `Transaction reversed: ₹${txn.amount} refunded`;
              }
              
              if (message) {
                newNotifications.push({
                  id: `NOTIF_${txn.transaction_id}`,
                  transactionId: txn.transaction_id,
                  message,
                  read: false,
                  timestamp: txn.timestamp || new Date().toISOString(),
                });
              }
            }
          }
          
          if (newNotifications.length > 0) {
            allNotifications = [...newNotifications, ...allNotifications];
            await AsyncStorage.setItem(`NOTIFICATIONS_${user.email}`, JSON.stringify(allNotifications));
          }
        }
        
        setNotifications(allNotifications);
        const unread = allNotifications.filter((n: any) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Load notifications error:", error);
    }
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <>
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
    >
      {/* Premium Header with Gradient Effect */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <View style={styles.headerTextContainer}>
              <Text style={styles.greeting}>Welcome back! 👋</Text>
              <Text style={styles.name}>{user?.name}</Text>
              <View style={styles.studentIdContainer}>
                <Ionicons name="school" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.studentId}>ID: {user?.studentId}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.notificationBtn}
              onPress={() => {
                if (notifications.length === 0) {
                  setNotificationMessage("No new notifications");
                  setNotificationModalVisible(true);
                } else {
                  const unreadNotifications = notifications.filter((n: any) => !n.read);
                  if (unreadNotifications.length === 0) {
                    setNotificationMessage("No new notifications");
                    setNotificationModalVisible(true);
                  } else {
                    const message = unreadNotifications.map((n: any) => `• ${n.message}`).join('\n');
                    setNotificationMessage(message);
                    setNotificationModalVisible(true);
                    // Mark as read
                    const updatedNotifications = notifications.map((n: any) => ({ ...n, read: true }));
                    setNotifications(updatedNotifications);
                    setUnreadCount(0);
                    if (user?.email) {
                      AsyncStorage.setItem(`NOTIFICATIONS_${user.email}`, JSON.stringify(updatedNotifications));
                    }
                  }
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Premium Balance Card */}
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
              <TouchableOpacity 
                style={styles.refreshBtn}
                onPress={loadData}
                activeOpacity={0.7}
              >
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
              <TouchableOpacity
                style={styles.scanBtn}
                onPress={() => router.push("/(student)/pay")}
                activeOpacity={0.8}
              >
                <View style={styles.btnIconContainer}>
                  <Ionicons name="qr-code" size={20} color={COLORS.student} />
                </View>
                <Text style={styles.scanBtnText}>Scan & Pay</Text>
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
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(student)/pay")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                styles.actionIconPrimary,
              ]}
            >
              <Ionicons name="restaurant" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Canteen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(student)/pay")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                styles.actionIconSuccess,
              ]}
            >
              <Ionicons name="book" size={22} color={COLORS.success} />
            </View>
            <Text style={styles.actionText}>Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(student)/pay")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                styles.actionIconMedical,
              ]}
            >
              <Ionicons name="medical" size={22} color="#EC4899" />
            </View>
            <Text style={styles.actionText}>Clinic</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(student)/pay")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                styles.actionIconWarning,
              ]}
            >
              <Ionicons name="print" size={22} color={COLORS.warning} />
            </View>
            <Text style={styles.actionText}>Print</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(student)/pay")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                styles.actionIconPrimary,
              ]}
            >
              <Ionicons name="shirt" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Laundry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(student)/pay")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                styles.actionIconWarning,
              ]}
            >
              <Ionicons name="film" size={22} color={COLORS.warning} />
            </View>
            <Text style={styles.actionText}>Events</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(student)/pay")}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.actionIcon,
                styles.actionIconDanger,
              ]}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.danger} />
            </View>
            <Text style={styles.actionText}>More</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.sectionTitleUnderline} />
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconSuccess]}>
              <Ionicons name="trending-up" size={20} color={COLORS.success} />
            </View>
            <Text style={styles.statNumber}>
              {transactions.filter((t) => t.type === "recharge").length}
            </Text>
            <Text style={styles.statLabel}>Recharges</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconPrimary]}>
              <Ionicons name="cart" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.statNumber}>
              {transactions.filter((t) => t.type === "payment").length}
            </Text>
            <Text style={styles.statLabel}>Payments</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIconContainer, styles.statIconWarning]}>
              <Ionicons name="cash" size={20} color={COLORS.warning} />
            </View>
            <Text style={styles.statNumber}>
              ₹{transactions
                .filter((t) => t.type === "payment")
                .reduce((sum, t) => sum + t.amount, 0)
                .toFixed(0)}
            </Text>
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
          <TouchableOpacity 
            onPress={() => router.push("/(student)/history")}
            activeOpacity={0.7}
          >
            <View style={styles.viewAllContainer}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.student} />
            </View>
          </TouchableOpacity>
        </View>

        {recentTransactions.length > 0 ? (
          recentTransactions.map((txn, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.txnCard}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.txnIcon,
                  txn.type === "payment" ? styles.txnIconPayment : styles.txnIconRecharge,
                ]}
              >
                <Ionicons
                  name={txn.type === "payment" ? "arrow-up" : "arrow-down"}
                  size={18}
                  color={
                    txn.type === "payment" ? COLORS.danger : COLORS.success
                  }
                />
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnTitle}>
                  {txn.type === "payment"
                    ? getMerchantName(txn.merchant_id)
                    : "Wallet Recharge"}
                </Text>
                <Text style={styles.txnDate}>
                  {new Date(txn.timestamp).toLocaleDateString()} •{" "}
                  {new Date(txn.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <View style={styles.txnAmountContainer}>
                <Text
                  style={[
                    styles.txnAmount,
                    {
                      color:
                        txn.type === "payment" ? COLORS.danger : COLORS.success,
                    },
                  ]}
                >
                  {txn.type === "payment" ? "-" : "+"}₹{txn.amount}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="receipt-outline"
              size={64}
              color={COLORS.textLight}
            />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Start by recharging your wallet
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push("/(student)/wallet")}
            >
              <Text style={styles.emptyButtonText}>Recharge Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>

    {/* Notification Modal - Outside ScrollView for proper rendering */}
    <Modal
      visible={notificationModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setNotificationModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name="notifications" size={28} color={COLORS.student} />
            <Text style={styles.modalTitle}>Notifications</Text>
            <TouchableOpacity
              onPress={() => setNotificationModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingBottom: 0,
    overflow: "hidden",
  },
  headerGradient: {
    backgroundColor: COLORS.student,
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadowDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 15,
    color: "#fff",
    opacity: 0.95,
    fontWeight: "500",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginTop: 2,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  studentIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  studentId: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.9,
    fontWeight: "500",
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  balanceCardContainer: {
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 8,
  },
  balanceCard: {
    borderRadius: 24,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadowDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  balanceCardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.student,
    opacity: 0.95,
  },
  balanceCardContent: {
    padding: 28,
    backgroundColor: "transparent",
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  balanceAmountContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: "600",
    color: "rgba(255,255,255,0.95)",
  },
  balanceAmount: {
    fontSize: 44,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -1,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  balanceActions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 8,
  },
  btnIconContainer: {
    marginRight: 6,
  },
  rechargeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
  },
  rechargeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  scanBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  scanBtnText: {
    color: COLORS.student,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  sectionTitleUnderline: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.student,
    borderRadius: 2,
    opacity: 0.6,
  },
  viewAllContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.student,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  actionCard: {
    width: (width - 64) / 4,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  actionIconPrimary: {
    backgroundColor: COLORS.primary + "15",
  },
  actionIconSuccess: {
    backgroundColor: COLORS.success + "15",
  },
  actionIconMedical: {
    backgroundColor: "#EC489915",
  },
  actionIconWarning: {
    backgroundColor: COLORS.warning + "15",
  },
  actionIconDanger: {
    backgroundColor: COLORS.danger + "15",
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statIconSuccess: {
    backgroundColor: COLORS.success + "15",
  },
  statIconPrimary: {
    backgroundColor: COLORS.primary + "15",
  },
  statIconWarning: {
    backgroundColor: COLORS.warning + "15",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  txnCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  txnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  txnIconPayment: {
    backgroundColor: COLORS.danger + "15",
  },
  txnIconRecharge: {
    backgroundColor: COLORS.success + "15",
  },
  txnInfo: {
    flex: 1,
  },
  txnTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  txnDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  txnAmountContainer: {
    alignItems: "flex-end",
  },
  txnAmount: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  emptyText: {
    fontSize: 20,
    color: COLORS.text,
    marginTop: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  emptyButton: {
    backgroundColor: COLORS.student,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.student,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    width: "100%",
    maxWidth: 400,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadowDark,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    flex: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalMessage: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: COLORS.student,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
