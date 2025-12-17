import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(student)" />
        <Stack.Screen name="(merchant)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="index" />
      </Stack>
    </AuthProvider>
  );
}
