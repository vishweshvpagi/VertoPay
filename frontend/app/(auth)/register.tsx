import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MERCHANT_CATEGORIES } from "../../constants/Config";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import Switch from "../../components/ui/Switch";

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
  const { colors, theme, toggleTheme } = useTheme();
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

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters' };
    }
    if (password.length > 50) {
      return { valid: false, message: 'Password must be less than 50 characters' };
    }
    return { valid: true };
  };

  const handleRegister = async () => {
    if (!role || !email || !password || !name) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      Alert.alert('Invalid Password', passwordValidation.message || 'Password does not meet requirements');
      return;
    }

    if (name.trim().length < 2) {
      Alert.alert('Invalid Name', 'Name must be at least 2 characters');
      return;
    }

    if (role === 'student' && !studentId) {
      Alert.alert('Error', 'Please enter your Student ID');
      return;
    }

    if (role === 'student' && studentId.trim().length < 3) {
      Alert.alert('Invalid Student ID', 'Student ID must be at least 3 characters');
      return;
    }

    if (role === 'merchant' && !selectedCategory) {
      Alert.alert('Error', 'Please select a business category');
      return;
    }

    setLoading(true);

    try {
      const details: any = { name: name.trim() };

      if (role === 'student') {
        details.studentId = studentId.trim();
      } else if (role === 'merchant') {
        details.merchantName = MERCHANT_CATEGORIES[selectedCategory];
        details.merchantId = selectedCategory;
        details.category = selectedCategory;
      }

      await register(email.toLowerCase().trim(), password, role, details);

      // Navigate to root so index can do role-based redirect with updated auth state
      setTimeout(() => {
        router.replace('/');
      }, 50);
    } catch (error: any) {
      const message = error?.message || error?.toString?.() || 'Something went wrong';
      if (__DEV__ && typeof console !== 'undefined') console.error('Registration error:', error);
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const styles = getStyles(colors);

  if (!role) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View style={[styles.darkModeRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                <Ionicons name={theme === "dark" ? "moon" : "sunny"} size={18} color={colors.textSecondary} />
                <Text style={[styles.darkModeLabel, { color: colors.textSecondary }]}>Dark</Text>
                <Switch value={theme === "dark"} onValueChange={() => toggleTheme()} />
              </View>
            </View>

            <View style={styles.content}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: colors.text }]}>Register As</Text>
                <View style={[styles.titleUnderline, { backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Choose your account type</Text>

              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[styles.roleCard, { backgroundColor: colors.student }]}
                  onPress={() => setRole("student")}
                  activeOpacity={0.8}
                >
                  <View style={styles.roleIconContainer}>
                    <Ionicons name="school" size={52} color="#fff" />
                  </View>
                  <Text style={styles.roleTitle}>Student</Text>
                  <Text style={styles.roleDesc}>For campus students</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.roleCard, { backgroundColor: colors.merchant }]}
                  onPress={() => setRole("merchant")}
                  activeOpacity={0.8}
                >
                  <View style={styles.roleIconContainer}>
                    <Ionicons name="storefront" size={52} color="#fff" />
                  </View>
                  <Text style={styles.roleTitle}>Merchant</Text>
                  <Text style={styles.roleDesc}>For campus vendors</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setRole(null)}
              style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.borderLight }]}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={[styles.darkModeRow, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
              <Ionicons name={theme === "dark" ? "moon" : "sunny"} size={18} color={colors.textSecondary} />
              <Text style={[styles.darkModeLabel, { color: colors.textSecondary }]}>Dark</Text>
              <Switch value={theme === "dark"} onValueChange={() => toggleTheme()} />
            </View>
          </View>

          <ScrollView
            style={styles.flex1}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.titleContainer}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {role === "student" ? "Student" : "Merchant"} Registration
                </Text>
                <View style={[styles.titleUnderline, { backgroundColor: colors.primary }]} />
              </View>

              <View style={styles.form}>
                {role === "merchant" && (
                  <>
                    <View style={styles.categoryLabelContainer}>
                      <Text style={[styles.categoryLabel, { color: colors.text }]}>Select Your Business Type</Text>
                      <View style={[styles.categoryLabelUnderline, { backgroundColor: colors.merchant }]} />
                    </View>
                    <View style={styles.categoryGrid}>
                      {categories.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.categoryCard,
                            { backgroundColor: colors.card, borderColor: colors.borderLight },
                            selectedCategory === category.id && {
                              borderColor: colors.merchant,
                              backgroundColor: colors.merchant + "12",
                            },
                          ]}
                          onPress={() => setSelectedCategory(category.id)}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.categoryIconContainer,
                              { backgroundColor: colors.borderLight },
                              selectedCategory === category.id && { backgroundColor: colors.merchant + "20" },
                            ]}
                          >
                            <Ionicons
                              name={category.icon as any}
                              size={36}
                              color={selectedCategory === category.id ? colors.merchant : colors.textSecondary}
                            />
                          </View>
                          <Text
                            style={[
                              styles.categoryName,
                              { color: colors.textSecondary },
                              selectedCategory === category.id && { color: colors.merchant, fontWeight: "700" as const },
                            ]}
                          >
                            {category.name}
                          </Text>
                          {selectedCategory === category.id && (
                            <View style={styles.checkmark}>
                              <Ionicons name="checkmark-circle" size={26} color={colors.merchant} />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>

                    {selectedCategory && (
                      <View
                        style={[
                          styles.selectedInfo,
                          { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" },
                        ]}
                      >
                        <View style={styles.selectedInfoIconContainer}>
                          <Ionicons name="information-circle" size={22} color={colors.primary} />
                        </View>
                        <View style={styles.selectedInfoTextContainer}>
                          <Text style={[styles.selectedInfoText, { color: colors.text }]}>
                            Merchant Name:{" "}
                            <Text style={[styles.selectedInfoBold, { color: colors.merchant }]}>
                              {MERCHANT_CATEGORIES[selectedCategory]}
                            </Text>
                            {"\n"}
                            Merchant ID: <Text style={[styles.selectedInfoBold, { color: colors.merchant }]}>{selectedCategory}</Text>
                          </Text>
                        </View>
                      </View>
                    )}
                  </>
                )}

                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                  <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + "10" }]}>
                    <Ionicons name="person-outline" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={colors.textLight}
                    autoCorrect={false}
                    autoComplete="name"
                    textContentType="name"
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                  <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + "10" }]}>
                    <Ionicons name="mail-outline" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.textLight}
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                  />
                </View>

                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                  <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + "10" }]}>
                    <Ionicons name="lock-closed-outline" size={22} color={colors.primary} />
                  </View>
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Password (min. 6 characters)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={colors.textLight}
                    autoCorrect={false}
                    autoComplete="password-new"
                    textContentType="newPassword"
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} activeOpacity={0.7}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {role === "student" && (
                  <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.borderLight }]}>
                    <View style={[styles.inputIconContainer, { backgroundColor: colors.primary + "10" }]}>
                      <Ionicons name="card-outline" size={22} color={colors.primary} />
                    </View>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="Student ID (e.g., STU001)"
                      value={studentId}
                      onChangeText={setStudentId}
                      placeholderTextColor={colors.textLight}
                      autoCorrect={false}
                      autoCapitalize="characters"
                    />
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Register</Text>
                      <Ionicons name="arrow-forward" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.back()} style={styles.loginLink} activeOpacity={0.7}>
                  <Text style={[styles.link, { color: colors.textSecondary }]}>
                    Already have an account? <Text style={[styles.linkBold, { color: colors.primary }]}>Login</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  darkModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  darkModeLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  content: {
    padding: 24,
    paddingTop: 8,
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  titleUnderline: {
    width: 50,
    height: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
    fontWeight: '500',
  },
  roleButtons: {
    gap: 20,
  },
  roleCard: {
    padding: 40,
    borderRadius: 24,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  roleIconContainer: {
    marginBottom: 16,
  },
  roleTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginTop: 12,
    letterSpacing: -0.5,
  },
  roleDesc: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    marginTop: 6,
    fontWeight: '500',
  },
  form: {
    gap: 20,
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputIconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    padding: 16,
    paddingLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 12,
    marginRight: 4,
  },
  categoryLabelContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  categoryLabelUnderline: {
    width: 40,
    height: 3,
    borderRadius: 2,
    opacity: 0.6,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 16,
  },
  categoryCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    position: "relative",
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  categoryCardSelected: {
    ...Platform.select({
      ios: {
        shadowColor: colors.merchant,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  checkmark: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectedInfoIconContainer: {
    marginTop: 2,
  },
  selectedInfoTextContainer: {
    flex: 1,
  },
  selectedInfoText: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
  selectedInfoBold: {
    fontWeight: "700",
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 8,
    gap: 10,
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  loginLink: {
    marginTop: 12,
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  link: {
    fontSize: 15,
    fontWeight: '500',
  },
  linkBold: {
    fontWeight: "700",
  },
});
