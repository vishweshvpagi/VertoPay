import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';

export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('🏠 Index mounted');
    setMounted(true);
  }, []);

  console.log('🏠 Index Render - Loading:', loading, '| User:', user?.email, '| Mounted:', mounted);

  // Wait for both auth loading and component mount
  if (loading || !mounted) {
    console.log('⏳ Index - Waiting... Loading:', loading, '| Mounted:', mounted);
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: colors.background 
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          marginTop: 16, 
          fontSize: 14, 
          color: colors.textSecondary,
          fontWeight: '500'
        }}>
          Loading VertoPay...
        </Text>
      </View>
    );
  }

  // No user - go to login
  if (!user) {
    console.log('❌ Index - No user, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }

  // Redirect based on role
  console.log('✅ Index - User found, redirecting to:', user.role);
  
  if (user.role === 'student') {
    return <Redirect href="/(student)" />;
  }
  
  if (user.role === 'merchant') {
    return <Redirect href="/(merchant)" />;
  }
  
  if (user.role === 'admin') {
    return <Redirect href="/(admin)" />;
  }

  // Unknown role - go to login
  console.log('❌ Index - Unknown role:', user.role, '- redirecting to login');
  return <Redirect href="/(auth)/login" />;
}
