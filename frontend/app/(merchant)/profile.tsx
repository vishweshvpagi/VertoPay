import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { apiRequest } from "../../utils/api";

export default function MerchantProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [balance, setBalance] = useState(0);
  const [txnCount, setTxnCount] = useState(0);
  const [todaySales, setTodaySales] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const meData = await apiRequest<{ user: any }>("/api/auth/me");
      setBalance(meData.user?.balance ?? 0);

      const salesData = await apiRequest<{
        totalSales: number;
        totalTransactions: number;
      }>("/api/merchants/sales/today");
      setTodaySales(salesData.totalSales ?? 0);
      setTxnCount(salesData.totalTransactions ?? 0);
    } catch (error) {
      console.error("Load merchant stats error:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to logout?");
      if (confirmed) logout();
      return;
    }
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Ionicons name="storefront" size={48} color="#fff" />
            </View>
            <Text style={styles.name}>{user?.merchantName || user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {user?.merchantId && (
              <View style={styles.badge}>
                <Ionicons name="card" size={14} color={colors.merchant} />
                <Text style={styles.badgeText}>{user.merchantId}</Text>
              </View>
            )}
          </View>

          {/* Stats */}
          {statsLoading ? (
            <View
              style={{
                height: 100,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator color={colors.merchant} />
            </View>
          ) : (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="wallet" size={28} color={colors.success} />
                <Text style={styles.statNumber}>₹{balance.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Balance</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="today" size={28} color={colors.merchant} />
                <Text style={styles.statNumber}>₹{todaySales.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Today's Sales</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="receipt" size={28} color={colors.primary} />
                <Text style={styles.statNumber}>{txnCount}</Text>
                <Text style={styles.statLabel}>Today's Txns</Text>
              </View>
            </View>
          )}

          {/* Info */}
          <View style={styles.section}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={20} color={colors.textLight} />
              <Text style={styles.infoLabel}>Owner</Text>
              <Text style={styles.infoValue}>
                {user?.ownerName || user?.name || "—"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color={colors.textLight} />
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={colors.textLight} />
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{user?.phone || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="pricetag" size={20} color={colors.textLight} />
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>
                {user?.category || user?.merchantId || "—"}
              </Text>
            </View>
          </View>

          {/* Logout */}
          <View style={{ padding: 20 }}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out" size={24} color={colors.danger} />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>

          <View style={{ alignItems: "center", paddingBottom: 20 }}>
            <Text style={{ fontSize: 12, color: colors.textLight }}>
              VertoPay v1.0.0
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 20, paddingTop: 60, backgroundColor: colors.merchant },
    title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
    profileCard: {
      margin: 20,
      padding: 24,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.merchant,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    name: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    email: { fontSize: 14, color: colors.textLight, marginBottom: 8 },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.merchant + "20",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
    },
    badgeText: { fontSize: 13, fontWeight: "600", color: colors.merchant },
    statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 12 },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    statNumber: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 8,
    },
    statLabel: { fontSize: 11, color: colors.textLight, marginTop: 4 },
    section: {
      margin: 20,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    infoLabel: { fontSize: 14, color: colors.textLight, width: 70 },
    infoValue: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      textAlign: "right",
    },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.danger + "15",
      padding: 18,
      borderRadius: 12,
      gap: 10,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    logoutText: { fontSize: 18, fontWeight: "bold", color: colors.danger },
  });
