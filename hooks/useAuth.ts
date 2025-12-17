import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  // Enhanced logout function
  const enhancedLogout = async () => {
    try {
      // Call the original logout from context
      await context.logout();
      
      // Clear AsyncStorage auth token
      await AsyncStorage.removeItem('AUTH_TOKEN');
      await AsyncStorage.removeItem('CURRENT_USER');
      
      // Force navigation to login
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return {
    ...context,
    logout: enhancedLogout,
  };
};
