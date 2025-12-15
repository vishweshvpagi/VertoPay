import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../hooks/useAuth";

const COLORS = {
  primary: "#6C63FF",
  background: "#F5F5F5",
  text: "#212121",
  textLight: "#757575",
  border: "#E0E0E0",
  merchant: "#FF6B6B",
  student: "#4ECDC4",
  danger: "#FF5252",
};

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "merchant">("student");
  const [studentId, setStudentId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password || !name || !confirmPassword) {
      alert("Please fill all required fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (role === "student" && !studentId) {
      alert("Please enter Student ID");
      return;
    }
    if (role === "merchant" && (!merchantId || !merchantName)) {
      alert("Please enter Merchant ID and Name");
      return;
    }

    setLoading(true);
    await register(email, password, role, {
      name,
      studentId,
      merchantId,
      merchantName,
    });
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Register for VertoPay</Text>

          {/* Role Toggle */}
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "student" && styles.roleButtonActiveStudent,
              ]}
              onPress={() => setRole("student")}
            >
              <Text
                style={[
                  styles.roleText,
                  role === "student" && styles.roleTextActive,
                ]}
              >
                👨‍🎓 Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                role === "merchant" && styles.roleButtonActiveMerchant,
              ]}
              onPress={() => setRole("merchant")}
            >
              <Text
                style={[
                  styles.roleText,
                  role === "merchant" && styles.roleTextActive,
                ]}
              >
                🏪 Merchant
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />

            {/* Password */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password (min 6 characters)"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <View
              style={[
                styles.passwordContainer,
                password && confirmPassword && password !== confirmPassword
                  ? styles.passwordError
                  : undefined,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Password Match Indicator */}
            {password && confirmPassword && (
              <Text
                style={
                  password === confirmPassword
                    ? styles.matchText
                    : styles.noMatchText
                }
              >
                {password === confirmPassword
                  ? "✓ Passwords match"
                  : "✗ Passwords do not match"}
              </Text>
            )}

            {role === "student" && (
              <TextInput
                style={styles.input}
                placeholder="Student ID (e.g., 22BBTCS001)"
                placeholderTextColor="#999"
                value={studentId}
                onChangeText={setStudentId}
                editable={!loading}
              />
            )}

            {role === "merchant" && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Merchant ID (e.g., CAFE_01)"
                  placeholderTextColor="#999"
                  value={merchantId}
                  onChangeText={setMerchantId}
                  editable={!loading}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Business Name"
                  placeholderTextColor="#999"
                  value={merchantName}
                  onChangeText={setMerchantName}
                  editable={!loading}
                />
              </>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  Register as {role === "student" ? "Student" : "Merchant"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
                <Text style={styles.linkText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 24,
  },
  roleSelector: { flexDirection: "row", marginBottom: 24, gap: 12 },
  roleButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  roleButtonActiveStudent: {
    borderColor: COLORS.student,
    backgroundColor: COLORS.student,
  },
  roleButtonActiveMerchant: {
    borderColor: COLORS.merchant,
    backgroundColor: COLORS.merchant,
  },
  roleText: { fontSize: 16, color: COLORS.text, fontWeight: "600" },
  roleTextActive: { color: "#fff" },
  form: { width: "100%" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  passwordError: { borderColor: COLORS.danger, borderWidth: 2 },
  passwordInput: { flex: 1, padding: 16, fontSize: 16, color: COLORS.text },
  eyeButton: { padding: 12 },
  eyeIcon: { fontSize: 20 },
  matchText: {
    color: "#4CAF50",
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "600",
  },
  noMatchText: {
    color: COLORS.danger,
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "600",
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 16, color: COLORS.textLight },
  linkText: { fontSize: 16, color: COLORS.primary, fontWeight: "600" },
});
