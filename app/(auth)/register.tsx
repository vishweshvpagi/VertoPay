import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, MERCHANT_CATEGORIES } from "../../constants/Config";
import { useAuth } from "../../hooks/useAuth";

export default function RegisterScreen() {
  const [role, setRole] = useState<"student" | "merchant" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  // Convert MERCHANT_CATEGORIES object to array
  const categories = Object.entries(MERCHANT_CATEGORIES).map(([id, name]) => ({
    id,
    name,
    icon: id === 'CAFE_01' ? 'cafe' :
          id === 'CAFE_02' ? 'restaurant' :
          id === 'LIBRARY_01' ? 'library' :
          id === 'STATIONARY_01' ? 'book' : 'storefront',
  }));

  const handleRegister = async () => {
    if (!role || !email || !password || !name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (role === 'student' && !studentId) {
      Alert.alert('Error', 'Please enter your Student ID');
      return;
    }

    if (role === 'merchant' && !selectedCategory) {
      Alert.alert('Error', 'Please select a business category');
      return;
    }

    setLoading(true);

    try {
      const details: any = { name };

      if (role === 'student') {
        details.studentId = studentId;
      } else if (role === 'merchant') {
        details.merchantName = MERCHANT_CATEGORIES[selectedCategory];
        details.merchantId = selectedCategory;
        details.category = selectedCategory;
      }

      await register(email.toLowerCase().trim(), password, role, details);

      setTimeout(() => {
        if (role === 'student') {
          router.replace('/(student)');
        } else if (role === 'merchant') {
          router.replace('/(merchant)');
        }
      }, 100);
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Registration Failed', error.message || 'Something went wrong');
    }
  };

  if (!role) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>Register As</Text>
          <Text style={styles.subtitle}>Choose your account type</Text>

          <View style={styles.roleButtons}>
            <TouchableOpacity
              style={[styles.roleCard, { backgroundColor: COLORS.student }]}
              onPress={() => setRole("student")}
            >
              <Ionicons name="school" size={48} color="#fff" />
              <Text style={styles.roleTitle}>Student</Text>
              <Text style={styles.roleDesc}>For campus students</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleCard, { backgroundColor: COLORS.merchant }]}
              onPress={() => setRole("merchant")}
            >
              <Ionicons name="storefront" size={48} color="#fff" />
              <Text style={styles.roleTitle}>Merchant</Text>
              <Text style={styles.roleDesc}>For campus vendors</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setRole(null)}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {role === "student" ? "Student" : "Merchant"} Registration
        </Text>

        <View style={styles.form}>
          {role === "merchant" && (
            <>
              <Text style={styles.categoryLabel}>
                Select Your Business Type
              </Text>
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      selectedCategory === category.id &&
                        styles.categoryCardSelected,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={40}
                      color={
                        selectedCategory === category.id
                          ? COLORS.merchant
                          : COLORS.textLight
                      }
                    />
                    <Text
                      style={[
                        styles.categoryName,
                        selectedCategory === category.id &&
                          styles.categoryNameSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                    {selectedCategory === category.id && (
                      <View style={styles.checkmark}>
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={COLORS.merchant}
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {selectedCategory && (
                <View style={styles.selectedInfo}>
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.selectedInfoText}>
                    Merchant Name:{" "}
                    <Text style={styles.selectedInfoBold}>
                      {MERCHANT_CATEGORIES[selectedCategory]}
                    </Text>
                    {'\n'}
                    Merchant ID:{" "}
                    <Text style={styles.selectedInfoBold}>
                      {selectedCategory}
                    </Text>
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={20}
              color={COLORS.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color={COLORS.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color={COLORS.textLight}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={COLORS.textLight}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          </View>

          {role === "student" && (
            <View style={styles.inputContainer}>
              <Ionicons
                name="card-outline"
                size={20}
                color={COLORS.textLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Student ID (e.g., STU001)"
                value={studentId}
                onChangeText={setStudentId}
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.loginLink}
          >
            <Text style={styles.link}>
              Already have an account?{" "}
              <Text style={styles.linkBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
    padding: 20,
    paddingTop: 60,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginBottom: 32,
  },
  roleButtons: {
    gap: 16,
  },
  roleCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: "center",
  },
  roleTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
  },
  roleDesc: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  eyeIcon: {
    padding: 8,
  },
  categoryLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  categoryCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    position: "relative",
    gap: 12,
  },
  categoryCardSelected: {
    borderColor: COLORS.merchant,
    backgroundColor: COLORS.merchant + "10",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textLight,
    textAlign: "center",
  },
  categoryNameSelected: {
    color: COLORS.merchant,
    fontWeight: "bold",
  },
  checkmark: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: 'flex-start',
    backgroundColor: COLORS.primary + "10",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  selectedInfoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  selectedInfoBold: {
    fontWeight: "bold",
    color: COLORS.merchant,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  loginLink: {
    marginTop: 8,
    alignItems: "center",
  },
  link: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  linkBold: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
