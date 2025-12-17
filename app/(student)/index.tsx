import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

  useEffect(() => {
    loadData();
  }, []);

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

  const recentTransactions = transactions.slice(0, 5);

  const getMerchantName = (merchantId: string) => {
    if (merchantId === "WALLET_RECHARGE") return "Wallet Recharge";
    return MERCHANT_CATEGORIES[merchantId] || merchantId;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={loadData} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back! 👋</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.studentId}>ID: {user?.studentId}</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => Alert.alert("Notifications", "No new notifications")}
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <TouchableOpacity onPress={loadData}>
            <Ionicons name="refresh" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        <View style={styles.balanceActions}>
          <TouchableOpacity
            style={styles.rechargeBtn}
            onPress={() => router.push("/(student)/wallet")}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.rechargeBtnText}>Recharge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => router.push("/(student)/pay")}
          >
            <Ionicons name="qr-code" size={20} color={COLORS.student} />
            <Text style={styles.scanBtnText}>Scan & Pay</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(student)/pay")}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: COLORS.primary + "20" },
              ]}
            >
              <Ionicons name="restaurant" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.actionText}>Canteen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(student)/pay")}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: COLORS.success + "20" },
              ]}
            >
              <Ionicons name="book" size={28} color={COLORS.success} />
            </View>
            <Text style={styles.actionText}>Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(student)/pay")}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: COLORS.warning + "20" },
              ]}
            >
              <Ionicons name="storefront" size={28} color={COLORS.warning} />
            </View>
            <Text style={styles.actionText}>Store</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(student)/pay")}
          >
            <View
              style={[
                styles.actionIcon,
                { backgroundColor: COLORS.danger + "20" },
              ]}
            >
              <Ionicons name="cafe" size={28} color={COLORS.danger} />
            </View>
            <Text style={styles.actionText}>Cafe</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={COLORS.success} />
            <Text style={styles.statNumber}>
              {transactions.filter((t) => t.type === "recharge").length}
            </Text>
            <Text style={styles.statLabel}>Recharges</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cart" size={24} color={COLORS.primary} />
            <Text style={styles.statNumber}>
              {transactions.filter((t) => t.type === "payment").length}
            </Text>
            <Text style={styles.statLabel}>Payments</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cash" size={24} color={COLORS.warning} />
            <Text style={styles.statNumber}>
              ₹
              {transactions
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
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push("/(student)/history")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentTransactions.length > 0 ? (
          recentTransactions.map((txn, index) => (
            <View key={index} style={styles.txnCard}>
              <View
                style={[
                  styles.txnIcon,
                  {
                    backgroundColor:
                      txn.type === "payment"
                        ? COLORS.danger + "20"
                        : COLORS.success + "20",
                  },
                ]}
              >
                <Ionicons
                  name={txn.type === "payment" ? "arrow-up" : "arrow-down"}
                  size={20}
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.student,
  },
  greeting: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 4,
  },
  studentId: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
    marginTop: 2,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCard: {
    backgroundColor: COLORS.card,
    margin: 20,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 20,
  },
  balanceActions: {
    flexDirection: "row",
    gap: 12,
  },
  rechargeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.student,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  rechargeBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  scanBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.student + "20",
    padding: 16,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.student,
  },
  scanBtnText: {
    color: COLORS.student,
    fontSize: 16,
    fontWeight: "600",
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.student,
    fontWeight: "600",
  },
  quickActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionCard: {
    width: (width - 64) / 2,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 4,
  },
  txnCard: {
    flexDirection: "row",
    backgroundColor: COLORS.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txnInfo: {
    flex: 1,
  },
  txnTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  txnDate: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
  },
  txnAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textLight,
    marginTop: 16,
    fontWeight: "600",
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: COLORS.student,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
