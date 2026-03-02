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
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../hooks/useTheme";
import { apiRequest } from "../../utils/api";

type TabType = "students" | "merchants";

export default function AdminUsersScreen() {
  const { colors } = useTheme();
  const adminColor = colors.admin || colors.primary;
  const styles = getStyles(colors, adminColor);

  const [tab, setTab] = useState<TabType>("students");
  const [students, setStudents] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [topUpId, setTopUpId] = useState("");
  const [topUpAmt, setTopUpAmt] = useState("");
  const [topUpLoading, setTopUpLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, mData] = await Promise.all([
        apiRequest<{ students: any[] }>("/api/admin/students"),
        apiRequest<{ merchants: any[] }>("/api/admin/merchants"),
      ]);
      setStudents(sData.students || []);
      setMerchants(mData.merchants || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStudent = async (
    studentId: string,
    isActive: boolean,
    name: string,
  ) => {
    const action = isActive ? "Deactivate" : "Activate";
    const ok =
      Platform.OS === "web"
        ? window.confirm(`${action} student ${name}?`)
        : await new Promise<boolean>((res) =>
            Alert.alert(action, `${action} ${name}?`, [
              { text: "Cancel", onPress: () => res(false) },
              {
                text: action,
                onPress: () => res(true),
                style: isActive ? "destructive" : "default",
              },
            ]),
          );
    if (!ok) return;
    try {
      await apiRequest(`/api/admin/students/${studentId}/toggle`, {
        method: "PATCH",
      });
      loadData();
    } catch (e: any) {
      const msg = e?.message || "Failed";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Error", msg);
    }
  };

  const handleToggleMerchant = async (
    merchantId: string,
    isActive: boolean,
    name: string,
  ) => {
    const action = isActive ? "Deactivate" : "Activate";
    const ok =
      Platform.OS === "web"
        ? window.confirm(`${action} merchant ${name}?`)
        : await new Promise<boolean>((res) =>
            Alert.alert(action, `${action} ${name}?`, [
              { text: "Cancel", onPress: () => res(false) },
              {
                text: action,
                onPress: () => res(true),
                style: isActive ? "destructive" : "default",
              },
            ]),
          );
    if (!ok) return;
    try {
      await apiRequest(`/api/admin/merchants/${merchantId}/toggle`, {
        method: "PATCH",
      });
      loadData();
    } catch (e: any) {
      const msg = e?.message || "Failed";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Error", msg);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmt);
    if (!topUpId.trim() || !amount || amount <= 0) {
      const msg = "Enter a valid Student ID and amount";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Error", msg);
      return;
    }
    setTopUpLoading(true);
    try {
      const data = await apiRequest<{ newBalance: number; studentId: string }>(
        "/api/admin/top-up",
        {
          method: "POST",
          body: JSON.stringify({ studentId: topUpId.trim(), amount }),
        },
      );
      setTopUpId("");
      setTopUpAmt("");
      const msg = `₹${amount} added to ${data.studentId}.\nNew balance: ₹${data.newBalance}`;
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("✅ Top-up Done", msg);
      loadData();
    } catch (e: any) {
      const msg = e?.message || "Top-up failed";
      if (Platform.OS === "web") window.alert(msg);
      else Alert.alert("Error", msg);
    } finally {
      setTopUpLoading(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredMerchants = merchants.filter(
    (m) =>
      !search ||
      m.shopName?.toLowerCase().includes(search.toLowerCase()) ||
      m.merchantId?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()),
  );

  const renderStudent = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View
        style={[
          styles.cardAvatar,
          {
            backgroundColor:
              item.isActive !== false
                ? colors.student || colors.primary
                : colors.textLight,
          },
        ]}
      >
        <Ionicons name="person" size={20} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardSub}>
          {item.studentId} • {item.email}
        </Text>
        <Text style={[styles.cardBalance, { color: colors.success }]}>
          ₹{(item.balance || 0).toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.toggleBtn,
          {
            backgroundColor:
              item.isActive !== false
                ? colors.danger + "15"
                : colors.success + "15",
            borderColor:
              item.isActive !== false ? colors.danger : colors.success,
          },
        ]}
        onPress={() =>
          handleToggleStudent(
            item.studentId,
            item.isActive !== false,
            item.name,
          )
        }
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: item.isActive !== false ? colors.danger : colors.success,
          }}
        >
          {item.isActive !== false ? "Deactivate" : "Activate"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderMerchant = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View
        style={[
          styles.cardAvatar,
          {
            backgroundColor:
              item.isActive !== false
                ? colors.merchant || "#f59e0b"
                : colors.textLight,
          },
        ]}
      >
        <Ionicons name="storefront" size={20} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardName}>{item.shopName}</Text>
        <Text style={styles.cardSub}>
          {item.merchantId} • {item.email}
        </Text>
        <Text style={[styles.cardBalance, { color: colors.success }]}>
          ₹{(item.balance || 0).toFixed(2)}
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.toggleBtn,
          {
            backgroundColor:
              item.isActive !== false
                ? colors.danger + "15"
                : colors.success + "15",
            borderColor:
              item.isActive !== false ? colors.danger : colors.success,
          },
        ]}
        onPress={() =>
          handleToggleMerchant(
            item.merchantId,
            item.isActive !== false,
            item.shopName,
          )
        }
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: item.isActive !== false ? colors.danger : colors.success,
          }}
        >
          {item.isActive !== false ? "Deactivate" : "Activate"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const data = tab === "students" ? filteredStudents : filteredMerchants;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <Text style={styles.subtitle}>
          {students.length} students • {merchants.length} merchants
        </Text>
      </View>

      {/* Manual Top-up */}
      <View style={styles.topUpCard}>
        <Text style={styles.topUpTitle}>
          <Ionicons name="add-circle" size={16} color={colors.success} /> Manual
          Top-up
        </Text>
        <View style={styles.topUpRow}>
          <TextInput
            style={[styles.topUpInput, { flex: 2, color: colors.text }]}
            placeholder="Student ID (e.g. STU001)"
            placeholderTextColor={colors.textLight}
            value={topUpId}
            onChangeText={setTopUpId}
            autoComplete="off"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.topUpInput, { flex: 1, color: colors.text }]}
            placeholder="₹ Amount"
            placeholderTextColor={colors.textLight}
            value={topUpAmt}
            onChangeText={setTopUpAmt}
            keyboardType="numeric"
            autoComplete="off"
          />
          <TouchableOpacity
            style={styles.topUpBtn}
            onPress={handleTopUp}
            disabled={topUpLoading}
          >
            {topUpLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.topUpBtnText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "students" && styles.tabBtnActive]}
          onPress={() => {
            setTab("students");
            setSearch("");
          }}
        >
          <Ionicons
            name="people"
            size={16}
            color={tab === "students" ? "#fff" : colors.text}
          />
          <Text
            style={[styles.tabText, tab === "students" && styles.tabTextActive]}
          >
            Students ({students.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, tab === "merchants" && styles.tabBtnActive]}
          onPress={() => {
            setTab("merchants");
            setSearch("");
          }}
        >
          <Ionicons
            name="storefront"
            size={16}
            color={tab === "merchants" ? "#fff" : colors.text}
          />
          <Text
            style={[
              styles.tabText,
              tab === "merchants" && styles.tabTextActive,
            ]}
          >
            Merchants ({merchants.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textLight} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={`Search ${tab}...`}
          placeholderTextColor={colors.textLight}
          value={search}
          onChangeText={setSearch}
          autoComplete="off"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.textLight} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={data}
        renderItem={tab === "students" ? renderStudent : renderMerchant}
        keyExtractor={(item) => item._id || item.studentId || item.merchantId}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadData}
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
                name={
                  tab === "students" ? "people-outline" : "storefront-outline"
                }
                size={64}
                color={colors.textLight}
              />
              <Text style={styles.emptyText}>No {tab} found</Text>
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
    topUpCard: {
      margin: 16,
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    topUpTitle: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 12,
    },
    topUpRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    topUpInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    topUpBtn: {
      backgroundColor: colors.success,
      padding: 10,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 52,
    },
    topUpBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
    tabRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      paddingTop: 4,
      gap: 10,
    },
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
    tabBtnActive: { backgroundColor: adminColor, borderColor: adminColor },
    tabText: { fontSize: 13, fontWeight: "600", color: colors.text },
    tabTextActive: { color: "#fff" },
    searchBox: {
      flexDirection: "row",
      alignItems: "center",
      margin: 16,
      marginBottom: 8,
      backgroundColor: colors.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    searchInput: { flex: 1, padding: 12, fontSize: 14 },
    list: { padding: 16, paddingTop: 8 },
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
    cardAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
    },
    cardName: { fontSize: 15, fontWeight: "600", color: colors.text },
    cardSub: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    cardBalance: { fontSize: 14, fontWeight: "700", marginTop: 4 },
    toggleBtn: {
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 8,
      borderWidth: 1,
    },
    empty: { padding: 60, alignItems: "center" },
    emptyText: { fontSize: 16, color: colors.textLight, marginTop: 16 },
  });
