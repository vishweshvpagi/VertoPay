import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../constants/Config';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
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
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="wallet" size={48} color="#fff" />
          </View>
          <Text style={styles.title}>VertoPay</Text>
          <Text style={styles.subtitle}>Campus Digital Payment System</Text>
        </View>

        {/* Input Fields */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
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
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.textLight} style={styles.inputIcon} />
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
                name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                size={20} 
                color={COLORS.textLight} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Login</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
            <Text style={styles.link}>
              Don't have an account? <Text style={styles.linkBold}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Quick Test Login */}
        <View style={styles.quickLogin}>
          <Text style={styles.quickLoginTitle}>Quick Test Login</Text>
          <View style={styles.quickLoginButtons}>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: COLORS.student }]}
              onPress={() => quickLogin('student')}
              disabled={loading}
            >
              <Ionicons name="school" size={20} color="#fff" />
              <Text style={styles.quickBtnText}>Student</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: COLORS.merchant }]}
              onPress={() => quickLogin('merchant')}
              disabled={loading}
            >
              <Ionicons name="storefront" size={20} color="#fff" />
              <Text style={styles.quickBtnText}>Merchant</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: COLORS.admin }]}
              onPress={() => quickLogin('admin')}
              disabled={loading}
            >
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.quickBtnText}>Admin</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 18,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  registerLink: {
    marginTop: 8,
    alignItems: 'center',
  },
  link: {
    fontSize: 15,
    color: COLORS.textLight,
  },
  linkBold: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  quickLogin: {
    marginTop: 32,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  quickLoginTitle: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: 16,
  },
  quickLoginButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'column',
    gap: 6,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  quickBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});
