import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { apiRequest } from '../utils/api';

interface TokenData {
  token: string;
  email: string;
  expiresAt: number;
  lastActivity: number;
}

// Map frontend category IDs to backend enum
const MERCHANT_CATEGORY_MAP: Record<string, string> = {
  CAFE_01: 'canteen',
  CAFE_02: 'canteen',
  LIBRARY_01: 'bookstore',
  STATIONARY_01: 'stationery',
};

function normalizeUser(backendUser: any, role: string): any {
  if (!backendUser) return backendUser;
  if (role === 'merchant') {
    return {
      ...backendUser,
      name: backendUser.ownerName ?? backendUser.name,
      merchantName: backendUser.shopName ?? backendUser.merchantName,
    };
  }
  return backendUser;
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

  const validateToken = async (): Promise<boolean> => {
    try {
      const tokenDataStr = await AsyncStorage.getItem('AUTH_TOKEN');
      if (!tokenDataStr) return false;

      const tokenData: TokenData = JSON.parse(tokenDataStr);
      const token = typeof tokenData === 'string' ? tokenData : tokenData?.token;
      if (!token) return false;

      // JWT from backend – validity is checked via /me
      if (token.startsWith('eyJ')) {
        tokenData.lastActivity = Date.now();
        await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));
        return true;
      }

      // Legacy mock token
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
    const tokenDataStr = await AsyncStorage.getItem('AUTH_TOKEN');
    if (!tokenDataStr) {
      if (user) setUser(null);
      return;
    }
    const tokenData = JSON.parse(tokenDataStr);
    const token = typeof tokenData === 'string' ? tokenData : tokenData?.token;
    if (token?.startsWith('eyJ')) {
      try {
        const data = await apiRequest<{ user: any }>('/api/auth/me');
        const role = data.user?.role || 'student';
        setUser(normalizeUser(data.user, role));
      } catch (err: any) {
        if (err?.status === 401) {
          await clearSession();
        }
      }
    } else if (!(await validateToken()) && user) {
      setUser(null);
    }
  };

  const loadUser = async () => {
    try {
      const tokenDataStr = await AsyncStorage.getItem('AUTH_TOKEN');
      if (!tokenDataStr) {
        setLoading(false);
        return;
      }

      const tokenData: TokenData = JSON.parse(tokenDataStr);
      const token = typeof tokenData === 'string' ? tokenData : tokenData?.token;

      if (token?.startsWith('eyJ')) {
        try {
          const data = await apiRequest<{ user: any }>('/api/auth/me');
          const role = data.user?.role || 'student';
          const normalized = normalizeUser(data.user, role);
          await AsyncStorage.setItem('CURRENT_USER', JSON.stringify(normalized));
          setUser(normalized);
        } catch (err: any) {
          if (err?.status === 401) {
            await clearSession();
          }
        }
        setLoading(false);
        return;
      }

      // Legacy: load from CURRENT_USER
      const userData = await AsyncStorage.getItem('CURRENT_USER');
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
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
      const data = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
        skipAuth: true,
      });

      const role = data.user?.role || 'student';
      const normalized = normalizeUser(data.user, role);

      const now = Date.now();
      const tokenData: TokenData = {
        token: data.token,
        email: normalized.email,
        expiresAt: now + 30 * 24 * 60 * 60 * 1000,
        lastActivity: now,
      };
      await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));
      await AsyncStorage.setItem('CURRENT_USER', JSON.stringify(normalized));
      setUser(normalized);

      return normalized;
    } catch (error: any) {
      throw new Error(error?.message || 'Invalid credentials');
    }
  };

  const register = async (email: string, password: string, role: string, details: any) => {
    try {
      const emailLower = email.toLowerCase().trim();

      if (role === 'student') {
        const data = await apiRequest<{ token: string; user: any }>(
          '/api/auth/register/student',
          {
            method: 'POST',
            body: JSON.stringify({
              name: details.name?.trim() || '',
              email: emailLower,
              password,
              phone: details.phone || '0000000000',
            }),
            skipAuth: true,
          }
        );
        const normalized = normalizeUser(data.user, 'student');
        const now = Date.now();
        await AsyncStorage.setItem(
          'AUTH_TOKEN',
          JSON.stringify({
            token: data.token,
            email: normalized.email,
            expiresAt: now + 30 * 24 * 60 * 60 * 1000,
            lastActivity: now,
          })
        );
        await AsyncStorage.setItem('CURRENT_USER', JSON.stringify(normalized));
        setUser(normalized);
        return normalized;
      }

      if (role === 'merchant') {
        const category =
          MERCHANT_CATEGORY_MAP[details.category] ||
          (details.category || 'other').toLowerCase();
        const data = await apiRequest<{ token: string; user: any }>(
          '/api/auth/register/merchant',
          {
            method: 'POST',
            body: JSON.stringify({
              shopName: details.merchantName?.trim() || details.name?.trim() || 'Shop',
              ownerName: details.name?.trim() || '',
              email: emailLower,
              password,
              phone: details.phone || '0000000000',
              category: ['canteen', 'bookstore', 'stationery', 'laundry', 'other'].includes(category)
                ? category
                : 'other',
            }),
            skipAuth: true,
          }
        );
        const normalized = normalizeUser(data.user, 'merchant');
        const now = Date.now();
        await AsyncStorage.setItem(
          'AUTH_TOKEN',
          JSON.stringify({
            token: data.token,
            email: normalized.email,
            expiresAt: now + 30 * 24 * 60 * 60 * 1000,
            lastActivity: now,
          })
        );
        await AsyncStorage.setItem('CURRENT_USER', JSON.stringify(normalized));
        setUser(normalized);
        return normalized;
      }

      throw new Error('Invalid role');
    } catch (error: any) {
      throw new Error(error?.message || 'Registration failed');
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
