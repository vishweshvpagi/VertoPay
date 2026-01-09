import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
} from 'react-native';
import { COLORS } from '../../constants/Config';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const userData = await login(email.toLowerCase().trim(), password);

      // Wait a bit for state to update
      setTimeout(() => {
        if (userData.role === 'student') {
          router.replace('/(student)');
        } else if (userData.role === 'merchant') {
          router.replace('/(merchant)');
        } else if (userData.role === 'admin') {
          router.replace('/(admin)');
        }
      }, 100);

    } catch (error: any) {
      setLoading(false);
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    }
  };

  // Quick test logins
  const quickLogin = async (role: 'student' | 'merchant' | 'admin') => {
    const credentials = {
      student: { email: 'student@test.com', password: 'password' },
      merchant: { email: 'merchant@cmr.com', password: 'password' },
      admin: { email: 'admin@cmr.com', password: 'password' },
    };

    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
    
    setTimeout(() => {
      handleLogin();
    }, 100);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Premium Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoGradient}>
              <View style={styles.logo}>
                <Ionicons name="wallet" size={52} color="#fff" />
              </View>
            </View>
            <Text style={styles.title}>VertoPay</Text>
            <Text style={styles.subtitle}>Campus Digital Payment System</Text>
          </View>

          {/* Premium Input Fields */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="mail-outline" size={22} color={COLORS.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={COLORS.textLight}
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Ionicons name="lock-closed-outline" size={22} color={COLORS.primary} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={COLORS.textLight}
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                  size={22} 
                  color={COLORS.textSecondary} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => router.push('/(auth)/register')} 
              style={styles.registerLink}
              activeOpacity={0.7}
            >
              <Text style={styles.link}>
                Don't have an account? <Text style={styles.linkBold}>Register</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Test Login */}
          <View style={styles.quickLogin}>
            <View style={styles.quickLoginDivider}>
              <View style={styles.dividerLine} />
              <Text style={styles.quickLoginTitle}>Quick Test Login</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.quickLoginButtons}>
              <TouchableOpacity
                style={[styles.quickBtn, styles.quickBtnStudent]}
                onPress={() => quickLogin('student')}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={styles.quickBtnIconContainer}>
                  <Ionicons name="school" size={22} color="#fff" />
                </View>
                <Text style={styles.quickBtnText}>Student</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickBtn, styles.quickBtnMerchant]}
                onPress={() => quickLogin('merchant')}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={styles.quickBtnIconContainer}>
                  <Ionicons name="storefront" size={22} color="#fff" />
                </View>
                <Text style={styles.quickBtnText}>Merchant</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickBtn, styles.quickBtnAdmin]}
                onPress={() => quickLogin('admin')}
                disabled={loading}
                activeOpacity={0.7}
              >
                <View style={styles.quickBtnIconContainer}>
                  <Ionicons name="shield-checkmark" size={22} color="#fff" />
                </View>
                <Text style={styles.quickBtnText}>Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  form: {
    gap: 20,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.shadow,
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
    backgroundColor: COLORS.primary + '10',
  },
  input: {
    flex: 1,
    padding: 16,
    paddingLeft: 12,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  eyeIcon: {
    padding: 12,
    marginRight: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 8,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
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
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  registerLink: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  link: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  linkBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  quickLogin: {
    marginTop: 32,
    paddingTop: 32,
  },
  quickLoginDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
  quickLoginTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginHorizontal: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  quickLoginButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  quickBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quickBtnStudent: {
    backgroundColor: COLORS.student,
  },
  quickBtnMerchant: {
    backgroundColor: COLORS.merchant,
  },
  quickBtnAdmin: {
    backgroundColor: COLORS.admin,
  },
  quickBtnIconContainer: {
    marginBottom: 4,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
});
