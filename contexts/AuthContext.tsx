import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('CURRENT_USER');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Load user error:', error);
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

      await AsyncStorage.setItem('AUTH_TOKEN', `token_${email}`);
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
    if (role === 'student') {
      await AsyncStorage.setItem(`WALLET_${email}`, JSON.stringify({ balance: 0, transactions: [] }));
    } else if (role === 'merchant') {
      await AsyncStorage.setItem(`MERCHANT_WALLET_${email}`, JSON.stringify({ balance: 0, transactions: [] }));
    }

    await AsyncStorage.setItem('AUTH_TOKEN', `token_${email}`);
    await AsyncStorage.setItem('CURRENT_USER', JSON.stringify(newUser));
    setUser(newUser);

    return newUser;
  } catch (error) {
    throw error;
  }
};


  const logout = async () => {
    try {
      await AsyncStorage.removeItem('AUTH_TOKEN');
      await AsyncStorage.removeItem('CURRENT_USER');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
