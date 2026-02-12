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
  
  let normalized = { ...backendUser };
  
  if (role === 'merchant') {
    normalized = {
      ...normalized,
      name: backendUser.ownerName ?? backendUser.name,
      merchantName: backendUser.shopName ?? backendUser.merchantName,
    };
  }
  
  // Ensure user always has a name
  if (!normalized.name && !normalized.fullName) {
    normalized.name = normalized.email?.split('@')[0] || 'User';
  }
  
  return normalized;
}


export const AuthContext = createContext<any>(null);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isValidatingRef = useRef(false);
  const loadUserCalledRef = useRef(false);


  useEffect(() => {
    if (!loadUserCalledRef.current) {
      loadUserCalledRef.current = true;
      loadUser();
    }
    
    // Setup app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, []);


  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    console.log('📱 App state changed:', appStateRef.current, '->', nextAppState);
    
    if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('⚠️ App foregrounded - Session validation DISABLED to prevent logout issues');
      // CRITICAL: Session validation disabled to prevent logout on tab switch
      // validateSession();
    }
    appStateRef.current = nextAppState;
  };


  const validateToken = async (): Promise<boolean> => {
    try {
      const tokenDataStr = await AsyncStorage.getItem('AUTH_TOKEN');
      if (!tokenDataStr) {
        console.log('❌ validateToken: No token found');
        return false;
      }

      const tokenData: TokenData = JSON.parse(tokenDataStr);
      const token = typeof tokenData === 'string' ? tokenData : tokenData?.token;
      if (!token) {
        console.log('❌ validateToken: Token is empty');
        return false;
      }

      console.log('✅ validateToken: Token exists, type:', token.startsWith('eyJ') ? 'JWT' : 'Legacy');

      // Update last activity
      tokenData.lastActivity = Date.now();
      await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));
      return true;
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return false;
    }
  };


  const refreshToken = async (): Promise<boolean> => {
    try {
      const tokenDataStr = await AsyncStorage.getItem('AUTH_TOKEN');
      const exists = !!tokenDataStr;
      console.log('🔄 refreshToken:', exists ? 'Token exists' : 'No token');
      return exists;
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      return false;
    }
  };


  const clearSession = async () => {
    try {
      console.log('🧹 Clearing session...');
      await AsyncStorage.removeItem('AUTH_TOKEN');
      await AsyncStorage.removeItem('CURRENT_USER');
      setUser(null);
      console.log('✅ Session cleared');
    } catch (error) {
      console.error('❌ Clear session error:', error);
    }
  };


  const updateLastActivity = async () => {
    try {
      const tokenDataStr = await AsyncStorage.getItem('AUTH_TOKEN');
      if (tokenDataStr) {
        const tokenData: TokenData = JSON.parse(tokenDataStr);
        tokenData.lastActivity = Date.now();
        await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));
        // Removed log to reduce noise
      }
    } catch (error) {
      console.error('❌ Update activity error:', error);
    }
  };


  const validateSession = async () => {
    if (isValidatingRef.current) {
      console.log('⚠️ Validation already in progress, skipping...');
      return;
    }

    isValidatingRef.current = true;
    console.log('🔍 Validating session...');

    try {
      const tokenDataStr = await AsyncStorage.getItem('AUTH_TOKEN');
      if (!tokenDataStr) {
        console.log('❌ No token found in validateSession');
        if (user) {
          console.log('⚠️ User exists but no token - clearing user');
          setUser(null);
        }
        return;
      }

      const tokenData = JSON.parse(tokenDataStr);
      const token = typeof tokenData === 'string' ? tokenData : tokenData?.token;
      
      console.log('Token type:', token?.startsWith('eyJ') ? 'JWT (Backend)' : 'Legacy');

      if (token?.startsWith('eyJ')) {
        try {
          console.log('🔐 Validating JWT with backend...');
          const data = await apiRequest<{ user: any }>('/api/auth/me');
          const role = data.user?.role || 'student';
          const normalized = normalizeUser(data.user, role);
          console.log('✅ Session valid for:', normalized.email, '| Role:', role);
          setUser(normalized);
        } catch (err: any) {
          console.error('❌ Session validation failed:', err);
          if (err?.status === 401) {
            console.log('🚪 401 Unauthorized - clearing session');
            await clearSession();
          }
        }
      } else {
        console.log('🔐 Validating legacy token...');
        const isValid = await validateToken();
        if (!isValid && user) {
          console.log('❌ Legacy token invalid - clearing user');
          setUser(null);
        } else {
          console.log('✅ Legacy token valid');
        }
      }
    } catch (error) {
      console.error('❌ validateSession error:', error);
    } finally {
      isValidatingRef.current = false;
    }
  };


  const loadUser = async () => {
    console.log('📂 ========== LOADING USER ==========');
    
    try {
      // Test AsyncStorage
      try {
        await AsyncStorage.setItem('TEST_KEY', 'test');
        await AsyncStorage.getItem('TEST_KEY');
        await AsyncStorage.removeItem('TEST_KEY');
        console.log('✅ AsyncStorage is working');
      } catch (storageError) {
        console.error('❌ AsyncStorage is NOT working:', storageError);
        setLoading(false);
        return;
      }

      const tokenDataStr = await AsyncStorage.getItem('AUTH_TOKEN');
      console.log('🔑 AUTH_TOKEN exists:', !!tokenDataStr);
      
      if (!tokenDataStr) {
        console.log('❌ No AUTH_TOKEN found, user is logged out');
        setLoading(false);
        return;
      }

      let tokenData: TokenData;
      try {
        tokenData = JSON.parse(tokenDataStr);
        console.log('✅ Token parsed successfully');
      } catch (parseError) {
        console.error('❌ Token parse error:', parseError);
        await clearSession();
        setLoading(false);
        return;
      }

      const token = typeof tokenData === 'string' ? tokenData : tokenData?.token;

      if (!token) {
        console.log('❌ Token is empty');
        await clearSession();
        setLoading(false);
        return;
      }

      console.log('✅ Token found, type:', token?.startsWith('eyJ') ? 'JWT (Backend)' : 'Legacy');

      if (token?.startsWith('eyJ')) {
        // Backend JWT - validate with API
        try {
          console.log('🔐 Fetching user from backend...');
          const data = await apiRequest<{ user: any }>('/api/auth/me');
          const role = data.user?.role || 'student';
          const normalized = normalizeUser(data.user, role);
          
          console.log('✅ User fetched from backend:', normalized.email, '| Role:', role, '| Name:', normalized.name);
          
          // Save to cache
          await AsyncStorage.setItem('CURRENT_USER', JSON.stringify(normalized));
          console.log('💾 User cached to CURRENT_USER');
          
          setUser(normalized);
        } catch (err: any) {
          console.error('❌ Failed to fetch user from backend:', err);
          
          // CRITICAL: Don't logout on network error, use cached user
          if (err?.status === 401) {
            console.log('🚪 401 Unauthorized - clearing session');
            await clearSession();
          } else {
            // Network error or other issue - try cached user
            console.log('⚠️ Backend error (not 401), trying cached user...');
            const userData = await AsyncStorage.getItem('CURRENT_USER');
            if (userData) {
              try {
                const parsedUser = JSON.parse(userData);
                const normalized = normalizeUser(parsedUser, parsedUser.role);
                setUser(normalized);
                console.log('✅ Using cached user:', normalized.email, '| Role:', normalized.role);
              } catch (cacheError) {
                console.error('❌ Cache parse error:', cacheError);
                await clearSession();
              }
            } else {
              console.log('❌ No cached user available');
              await clearSession();
            }
          }
        }
        setLoading(false);
        return;
      }

      // Legacy: load from CURRENT_USER
      console.log('📂 Loading legacy user from CURRENT_USER...');
      const userData = await AsyncStorage.getItem('CURRENT_USER');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          const normalized = normalizeUser(parsedUser, parsedUser.role);
          setUser(normalized);
          console.log('✅ Legacy user loaded:', normalized.email, '| Role:', normalized.role, '| Name:', normalized.name);
        } catch (parseError) {
          console.error('❌ User parse error:', parseError);
          await clearSession();
        }
      } else {
        console.log('❌ No CURRENT_USER found');
      }
    } catch (error) {
      console.error('❌ Load user error:', error);
      
      // Last resort: try to recover from cache
      try {
        const userData = await AsyncStorage.getItem('CURRENT_USER');
        if (userData) {
          const parsedUser = JSON.parse(userData);
          const normalized = normalizeUser(parsedUser, parsedUser.role);
          setUser(normalized);
          console.log('✅ Recovered from cached user:', normalized.email);
        } else {
          await clearSession();
        }
      } catch {
        await clearSession();
      }
    } finally {
      setLoading(false);
      console.log('✅ loadUser complete, loading: false');
      console.log('========================================\n');
    }
  };


  const login = async (email: string, password: string) => {
    console.log('🔐 ========== LOGIN ATTEMPT ==========');
    console.log('📧 Email:', email);
    
    try {
      const data = await apiRequest<{ token: string; user: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
        skipAuth: true,
      });

      const role = data.user?.role || 'student';
      const normalized = normalizeUser(data.user, role);

      console.log('✅ Login successful');
      console.log('👤 User:', normalized.email);
      console.log('🎭 Role:', role);
      console.log('📛 Name:', normalized.name);

      const now = Date.now();
      const tokenData: TokenData = {
        token: data.token,
        email: normalized.email,
        expiresAt: now + 30 * 24 * 60 * 60 * 1000,
        lastActivity: now,
      };

      console.log('💾 Saving to AsyncStorage...');
      
      await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));
      console.log('✅ AUTH_TOKEN saved');
      
      await AsyncStorage.setItem('CURRENT_USER', JSON.stringify(normalized));
      console.log('✅ CURRENT_USER saved');
      
      // Verify storage
      const verifyToken = await AsyncStorage.getItem('AUTH_TOKEN');
      const verifyUser = await AsyncStorage.getItem('CURRENT_USER');
      console.log('🔍 Verification - Token exists:', !!verifyToken, '| User exists:', !!verifyUser);
      
      if (!verifyToken || !verifyUser) {
        console.error('❌ STORAGE VERIFICATION FAILED!');
        throw new Error('Failed to save login data');
      }

      setUser(normalized);
      console.log('✅ User state set');
      console.log('=====================================\n');

      return normalized;
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      console.log('=====================================\n');
      throw new Error(error?.message || 'Invalid credentials');
    }
  };


  const register = async (email: string, password: string, role: string, details: any) => {
    console.log('📝 ========== REGISTRATION ATTEMPT ==========');
    console.log('📧 Email:', email);
    console.log('🎭 Role:', role);
    
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
        const tokenData = {
          token: data.token,
          email: normalized.email,
          expiresAt: now + 30 * 24 * 60 * 60 * 1000,
          lastActivity: now,
        };
        
        await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));
        await AsyncStorage.setItem('CURRENT_USER', JSON.stringify(normalized));
        setUser(normalized);
        
        console.log('✅ Student registered:', normalized.email);
        console.log('=======================================\n');
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
        const tokenData = {
          token: data.token,
          email: normalized.email,
          expiresAt: now + 30 * 24 * 60 * 60 * 1000,
          lastActivity: now,
        };
        
        await AsyncStorage.setItem('AUTH_TOKEN', JSON.stringify(tokenData));
        await AsyncStorage.setItem('CURRENT_USER', JSON.stringify(normalized));
        setUser(normalized);
        
        console.log('✅ Merchant registered:', normalized.email);
        console.log('=======================================\n');
        return normalized;
      }

      throw new Error('Invalid role');
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      console.log('=======================================\n');
      throw new Error(error?.message || 'Registration failed');
    }
  };


  const logout = async () => {
    console.log('🚪 ========== LOGOUT ==========');
    try {
      await clearSession();
      console.log('✅ Logout complete');
      console.log('================================\n');
    } catch (error) {
      console.error('❌ Logout error:', error);
      console.log('================================\n');
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
