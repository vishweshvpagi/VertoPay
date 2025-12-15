import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../hooks/useAuth";

const COLORS = {
  merchant: '#FF6B6B',
  danger: '#FF5252',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#212121',
  textLight: '#757575',
};

export default function MerchantProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (confirmed) {
      logout();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>🏪</Text>
        </View>
        <Text style={styles.name}>{user?.merchantName || "Merchant"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Info</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Merchant ID</Text>
          <Text style={styles.value}>{user?.merchantId || "N/A"}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Business Name</Text>
          <Text style={styles.value}>{user?.merchantName || "N/A"}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 LOGOUT</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { backgroundColor: COLORS.merchant, padding: 40, paddingTop: 80, alignItems: "center" },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  avatarText: { fontSize: 48 },
  name: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  email: { fontSize: 16, color: "#fff", opacity: 0.9, marginTop: 4 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text, paddingHorizontal: 20, marginBottom: 12 },
  card: { backgroundColor: COLORS.card, padding: 16, marginHorizontal: 20, marginBottom: 8, borderRadius: 12 },
  label: { fontSize: 12, color: COLORS.textLight, marginBottom: 4 },
  value: { fontSize: 16, color: COLORS.text, fontWeight: "600" },
  logoutBtn: { backgroundColor: COLORS.danger, padding: 20, marginHorizontal: 20, marginTop: 30, marginBottom: 40, borderRadius: 12 },
  logoutText: { fontSize: 20, fontWeight: "bold", color: "#fff", textAlign: "center" },
});
