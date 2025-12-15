import React, { createContext, useState, useEffect, ReactNode } from 'react';

interface User {
  uid: string;
  email: string;
  role: 'student' | 'merchant';
  studentId?: string;
  merchantId?: string;
  merchantName?: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  register: (email: string, password: string, role: 'student' | 'merchant', extraData: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const currentUser = localStorage.getItem('@vertopay_current_user');
      if (currentUser) {
        setUser(JSON.parse(currentUser));
      }
    } catch (error) {
      console.error('Check auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, role: 'student' | 'merchant', extraData: any) => {
    try {
      const allUsersData = localStorage.getItem('@vertopay_all_users');
      const allUsers = allUsersData ? JSON.parse(allUsersData) : [];

      const existingUser = allUsers.find((u: any) => u.email === email);
      if (existingUser) {
        alert('Email already registered');
        return;
      }

      const newUser: User = {
        uid: Date.now().toString(),
        email,
        role,
        name: extraData.name,
        ...(role === 'student' ? { studentId: extraData.studentId } : {}),
        ...(role === 'merchant' ? { merchantId: extraData.merchantId, merchantName: extraData.merchantName } : {}),
      };

      allUsers.push({ ...newUser, password });
      localStorage.setItem('@vertopay_all_users', JSON.stringify(allUsers));
      localStorage.setItem('@vertopay_current_user', JSON.stringify(newUser));
      setUser(newUser);
      
      window.location.href = role === 'student' ? '/pay' : '/scan';
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed');
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const allUsersData = localStorage.getItem('@vertopay_all_users');
      const allUsers = allUsersData ? JSON.parse(allUsersData) : [];

      const foundUser = allUsers.find((u: any) => u.email === email && u.password === password);

      if (!foundUser) {
        alert('Invalid email or password');
        return;
      }

      const { password: _, ...userWithoutPassword } = foundUser;
      localStorage.setItem('@vertopay_current_user', JSON.stringify(userWithoutPassword));
      setUser(userWithoutPassword);
      
      window.location.href = userWithoutPassword.role === 'student' ? '/pay' : '/scan';
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('@vertopay_current_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
