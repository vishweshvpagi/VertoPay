import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface TokenData {
  token: string;
  email: string;
  expiresAt: number;
  lastActivity: number;
}

export const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    loadUser();
    
    // Setup app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);

  // Removed inactivity timer - users stay logged in until explicit logout

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      // App came to foreground - check session validity
      validateSession();
    }
    appStateRef.current = nextAppState;
  };

  const createToken = (email: string): TokenData => {
    const now = Date.now();
    // Set expiration to far future (effectively never expires)
    // Users stay logged in until explicit logout
    return {
      token: `token_${email}_${now}`,
      email: email.toLowerCase(),
      expiresAt: now + 100 * 365 * 24 * 60 * 60 * 1000, // 100 years (effectively never)
      lastActivity: now,
    };
  };

  const validateToken = async (): Promise<boolean> => {
    try {
      const tokenDataStr = await AsyncStorage.getItem('AUTH_TOKEN');
      if (!tokenDataStr) return false;

      // Token exists - user stays logged in (no expiration check)
      // Only validate that token structure is valid
      const tokenData: TokenData = JSON.parse(tokenDataStr);
      
      // Update last activity for tracking purposes only
      tokenData.lastActivity = Date.now();
      await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      // No need to refresh - tokens don't expire
      // Just ensure token exists
      const tokenDataStr = await AsyncStorage.getItem('AUTH_TOKEN');
      return !!tokenDataStr;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem('AUTH_TOKEN');
      await AsyncStorage.removeItem('CURRENT_USER');
      setUser(null);
    } catch (error) {
      console.error('Clear session error:', error);
    }
  };

  // Removed inactivity timer - users stay logged in until explicit logout

  const updateLastActivity = async () => {
    try {
      // Update activity timestamp for tracking (no automatic logout)
      const tokenDataStr = await AsyncStorage.getItem('AUTH_TOKEN');
      if (tokenDataStr) {
        const tokenData: TokenData = JSON.parse(tokenDataStr);
        tokenData.lastActivity = Date.now();
        await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));
      }
    } catch (error) {
      console.error('Update activity error:', error);
    }
  };

  const validateSession = async () => {
    // Just check if token exists - no expiration validation
    const isValid = await validateToken();
    if (!isValid && user) {
      // Token missing but user still in state - clear it
      setUser(null);
    }
  };

  const loadUser = async () => {
    try {
      const isValid = await validateToken();
      if (!isValid) {
        setLoading(false);
        return;
      }

      const userData = await AsyncStorage.getItem('CURRENT_USER');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // Ensure token exists (create if missing for backward compatibility)
        const tokenExists = await refreshToken();
        if (!tokenExists) {
          // Create token if missing (for users who logged in before session management)
          const tokenData = createToken(parsedUser.email);
          await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));
        }
      }
    } catch (error) {
      console.error('Load user error:', error);
      await clearSession();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const usersData = await AsyncStorage.getItem('ALL_USERS');
      const users = usersData ? JSON.parse(usersData) : {};

      const userData = users[email.toLowerCase()];

      if (!userData) {
        throw new Error('User not found');
      }

      if (userData.password !== password) {
        throw new Error('Invalid password');
      }

      // Create persistent token (no expiration)
      const tokenData = createToken(email.toLowerCase());
      await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));
      await AsyncStorage.setItem('CURRENT_USER', JSON.stringify(userData));
      setUser(userData);

      return userData;
    } catch (error) {
      throw error;
    }
  };

const register = async (email: string, password: string, role: string, details: any) => {
  try {
    const usersData = await AsyncStorage.getItem('ALL_USERS');
    const users = usersData ? JSON.parse(usersData) : {};

    if (users[email.toLowerCase()]) {
      throw new Error('User already exists');
    }

    // For merchants, auto-generate merchant ID from category
    let merchantId = details.merchantId;
    if (role === 'merchant' && details.category) {
      merchantId = `${details.category.toUpperCase()}_01`;
    }

    const newUser = {
      email: email.toLowerCase(),
      password,
      role,
      name: details.name,
      studentId: details.studentId,
      merchantId: merchantId,
      merchantName: details.merchantName,
      category: details.category,
      createdAt: new Date().toISOString(),
    };

    users[email.toLowerCase()] = newUser;
    await AsyncStorage.setItem('ALL_USERS', JSON.stringify(users));

    // Initialize wallet
    const emailLower = email.toLowerCase();
    if (role === 'student') {
      await AsyncStorage.setItem(`WALLET_${emailLower}`, JSON.stringify({ balance: 0, transactions: [] }));
    } else if (role === 'merchant') {
      await AsyncStorage.setItem(`MERCHANT_WALLET_${emailLower}`, JSON.stringify({ balance: 0, transactions: [] }));
    }

      // Create persistent token (no expiration)
      const tokenData = createToken(email.toLowerCase());
      await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));
      await AsyncStorage.setItem('CURRENT_USER', JSON.stringify(newUser));
      setUser(newUser);

      return newUser;
  } catch (error) {
    throw error;
  }
};


  const logout = async () => {
    try {
      // Clear session - user explicitly logging out
      await clearSession();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        validateSession,
        updateLastActivity,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
