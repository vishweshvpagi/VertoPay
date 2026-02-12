import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';


export const useAuth = () => {
  const context = useContext(AuthContext);


  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }


  // Track activity when screen is focused - with safety checks
  useFocusEffect(
    useCallback(() => {
      // Only update activity if user is logged in and not loading
      if (context.user && context.updateLastActivity && !context.loading) {
        console.log('📍 Screen focused - Updating activity for:', context.user.email);
        context.updateLastActivity();
      }
    }, [context.user, context.loading])
  );


  // Enhanced logout function
  const enhancedLogout = async () => {
    try {
      console.log('🚪 Enhanced logout called');
      // Call the original logout from context
      await context.logout();
      
      // Clear AsyncStorage auth token
      await AsyncStorage.removeItem('AUTH_TOKEN');
      await AsyncStorage.removeItem('CURRENT_USER');
      
      console.log('✅ Logout complete, redirecting to login');
      
      // Force navigation to login
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };


  return {
    ...context,
    logout: enhancedLogout,
  };
};
