import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Force redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else {
        // Redirect based on role
        const path = user.role === 'student' ? '/pay' : '/scan';
        if (typeof window !== 'undefined') {
          window.location.href = path;
        }
      }
    }
  }, [user, loading]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' }}>
      <ActivityIndicator size="large" color="#6C63FF" />
    </View>
  );
}
