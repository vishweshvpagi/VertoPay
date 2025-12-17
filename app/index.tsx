import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/Config';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: COLORS.background 
      }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  // Role-based redirect
  if (user.role === 'student') {
    return <Redirect href="/(student)" />;
  }

  if (user.role === 'merchant') {
    return <Redirect href="/(merchant)" />;
  }

  if (user.role === 'admin') {
    return <Redirect href="/(admin)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
