import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export default function StudentLayout() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  if (!user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role !== 'student') {
    if (user.role === 'admin') {
      return <Redirect href="/(admin)" />;
    }
    if (user.role === 'merchant') {
      return <Redirect href="/(merchant)" />;
    }
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.student,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Wallet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: 'Pay',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name="qr-code-outline"
              size={28}
              color={focused ? '#fff' : color}
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={{
                color: focused ? '#fff' : color,
                fontSize: 12,
                fontWeight: '600',
                marginTop: 2,
              }}
            >
              Pay
            </Text>
          ),
          tabBarButton: (props) => {
            const focused = props.accessibilityState?.selected ?? false;
            return (
              <TouchableOpacity
                {...props}
                activeOpacity={0.85}
                style={[
                  props.style,
                  {
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginHorizontal: 16,
                    marginTop: -14,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    borderRadius: 28,
                    backgroundColor: focused ? colors.student : (colors.borderLight || colors.border),
                    minHeight: 52,
                    ...Platform.select({
                      ios: {
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: focused ? 0.25 : 0.08,
                        shadowRadius: 8,
                      },
                      android: {
                        elevation: focused ? 6 : 2,
                      },
                    }),
                  },
                ]}
              >
                {props.children}
              </TouchableOpacity>
            );
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
