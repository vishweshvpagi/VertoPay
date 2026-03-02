import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { apiRequest } from "../../utils/api";

export default function WalletScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [balance, setBalance] = useState(0);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

  useEffect(() => {
    loadBalance();
    loadPendingRequests();
  }, []);

  const loadBalance = async () => {
    setBalanceLoading(true);
    try {
      const data = await apiRequest<{ user: any }>("/api/auth/me");
      setBalance(data.user?.balance ?? 0);
    } catch (error) {
      console.error("Load balance error:", error);
    } finally {
      setBalanceLoading(false);
    }
  };

  const loadPendingRequests = async () => {
    try {
      const data = await apiRequest<{ requests: any[] }>(
        "/api/students/recharge-requests",
      );
      setPendingRequests(
        (data.requests || []).filter((r: any) => r.status === "pending"),
      );
    } catch (error) {
      console.error("Load requests error:", error);
    }
  };

  const handleRecharge = async () => {
    const amount = parseFloat(rechargeAmount);

    if (!amount || amount <= 0) {
      if (Platform.OS === "web") {
        window.alert("Please enter a valid amount");
      } else {
        Alert.alert("Invalid Amount", "Please enter a valid amount");
      }
      return;
    }
    if (amount < 10) {
      if (Platform.OS === "web") {
        window.alert("Minimum recharge amount is ₹10");
      } else {
        Alert.alert("Minimum Amount", "Minimum recharge amount is ₹10");
      }
      return;
    }
    if (amount > 10000) {
      if (Platform.OS === "web") {
        window.alert("Maximum recharge amount is ₹10,000");
      } else {
        Alert.alert("Maximum Amount", "Maximum recharge amount is ₹10,000");
      }
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest<{ message: string; request: any }>(
        "/api/students/recharge",
        { method: "POST", body: JSON.stringify({ amount }) },
      );

      setRechargeAmount("");
      await loadPendingRequests();

      const msg = `₹${amount} recharge request submitted!\n\nAwaiting admin approval. Your balance will be updated once approved.`;
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("✅ Request Submitted!", msg);
      }
    } catch (error: any) {
      const msg = error?.message || "Failed to submit recharge request";
      if (Platform.OS === "web") {
        window.alert(msg);
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 200, 500, 1000, 2000, 5000];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Balance</Text>
        {balanceLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.student}
            style={{ marginVertical: 12 }}
          />
        ) : (
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        )}
        <View style={styles.balanceInfo}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <Text style={styles.balanceInfoText}>Secure Wallet</Text>
        </View>
      </View>

      {/* Pending Requests Banner */}
      {pendingRequests.length > 0 && (
        <View style={styles.pendingBanner}>
          <Ionicons name="time" size={20} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.pendingTitle}>Pending Recharge Request</Text>
            <Text style={styles.pendingText}>
              ₹{pendingRequests[0].amount} — Awaiting admin approval
            </Text>
          </View>
        </View>
      )}

      {/* Recharge Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Recharge</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.rupeeSymbol}>₹</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter amount"
            value={rechargeAmount}
            onChangeText={setRechargeAmount}
            keyboardType="numeric"
            placeholderTextColor={colors.textLight}
          />
        </View>

        <View style={styles.quickAmounts}>
          {quickAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[
                styles.quickBtn,
                rechargeAmount === amount.toString() && styles.quickBtnActive,
              ]}
              onPress={() => setRechargeAmount(amount.toString())}
            >
              <Text
                style={[
                  styles.quickBtnText,
                  rechargeAmount === amount.toString() &&
                    styles.quickBtnTextActive,
                ]}
              >
                ₹{amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.rechargeButton, loading && { opacity: 0.6 }]}
          onPress={handleRecharge}
          disabled={loading || pendingRequests.length > 0}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={24} color="#fff" />
              <Text style={styles.rechargeButtonText}>
                {pendingRequests.length > 0
                  ? "Request Pending..."
                  : "Request Recharge"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {pendingRequests.length > 0 && (
          <Text style={styles.pendingNote}>
            You can submit a new request after the current one is reviewed.
          </Text>
        )}
      </View>

      {/* Info Cards */}
      <View style={styles.section}>
        {[
          {
            icon: "time",
            color: colors.warning,
            title: "Admin Approval",
            text: "Recharge requests are reviewed and approved by admin",
          },
          {
            icon: "shield-checkmark",
            color: colors.success,
            title: "100% Secure",
            text: "All transactions are encrypted and secure",
          },
          {
            icon: "notifications",
            color: colors.primary,
            title: "Instant Update",
            text: "Balance updates immediately after approval",
          },
        ].map((item) => (
          <View key={item.title} style={styles.infoCard}>
            <Ionicons name={item.icon as any} size={24} color={item.color} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>{item.title}</Text>
              <Text style={styles.infoText}>{item.text}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: 20, paddingTop: 60, backgroundColor: colors.student },
    title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
    balanceCard: {
      backgroundColor: colors.card,
      margin: 20,
      padding: 24,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    balanceLabel: { fontSize: 14, color: colors.textLight, marginBottom: 8 },
    balanceAmount: {
      fontSize: 48,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 12,
    },
    balanceInfo: { flexDirection: "row", alignItems: "center", gap: 6 },
    balanceInfoText: { fontSize: 12, color: colors.success, fontWeight: "600" },
    pendingBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.warning + "15",
      margin: 20,
      marginTop: 0,
      padding: 16,
      borderRadius: 12,
      gap: 12,
      borderWidth: 1,
      borderColor: colors.warning + "40",
    },
    pendingTitle: { fontSize: 14, fontWeight: "700", color: colors.warning },
    pendingText: { fontSize: 12, color: colors.warning, marginTop: 2 },
    section: { padding: 20, paddingTop: 0 },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      borderWidth: 2,
      borderColor: colors.student,
    },
    rupeeSymbol: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      padding: 16,
    },
    quickAmounts: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      marginTop: 16,
    },
    quickBtn: {
      width: "31%",
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickBtnActive: {
      backgroundColor: colors.student,
      borderColor: colors.student,
    },
    quickBtnText: { fontSize: 16, fontWeight: "600", color: colors.text },
    quickBtnTextActive: { color: "#fff" },
    rechargeButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.student,
      padding: 18,
      borderRadius: 12,
      marginTop: 24,
      gap: 10,
      elevation: 4,
    },
    rechargeButtonText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
    pendingNote: {
      fontSize: 13,
      color: colors.textLight,
      textAlign: "center",
      marginTop: 12,
    },
    infoCard: {
      flexDirection: "row",
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    infoContent: { flex: 1, marginLeft: 12 },
    infoTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    infoText: { fontSize: 12, color: colors.textLight },
  });
