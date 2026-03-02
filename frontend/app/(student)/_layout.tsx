import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";

export default function StudentLayout() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  console.log(
    "🎓 StudentLayout - Loading:",
    loading,
    "| User:",
    user?.email,
    "| Role:",
    user?.role,
  );

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.student} />
        <Text
          style={{
            marginTop: 16,
            fontSize: 14,
            color: colors.textSecondary,
            fontWeight: "500",
          }}
        >
          Loading...
        </Text>
      </View>
    );
  }

  if (!user) {
    console.log("❌ StudentLayout - No user, redirecting to login");
    return <Redirect href="/(auth)/login" />;
  }

  if (user.role !== "student") {
    console.log("❌ StudentLayout - Wrong role:", user.role);
    if (user.role === "admin") return <Redirect href="/(admin)" />;
    if (user.role === "merchant") return <Redirect href="/(merchant)" />;
    return <Redirect href="/(auth)/login" />;
  }

  console.log("✅ StudentLayout - Rendering tabs for:", user.email);

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
          fontWeight: "600",
        },
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Wallet",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="pay"
        options={{
          title: "Pay",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name="qr-code-outline"
              size={28}
              color={focused ? "#fff" : color}
            />
          ),
          tabBarLabel: ({ focused, color }) => (
            <Text
              style={{
                color: focused ? "#fff" : color,
                fontSize: 12,
                fontWeight: "600",
                marginTop: 2,
              }}
            >
              Pay
            </Text>
          ),
          // ✅ FIX: destructure props instead of spreading into TouchableOpacity
          tabBarButton: (props) => {
            const { onPress, onLongPress, children, accessibilityState } =
              props;

            const focused = accessibilityState?.selected ?? false;

            return (
              <TouchableOpacity
                onPress={onPress ?? undefined}
                onLongPress={onLongPress ?? undefined}
                accessibilityState={accessibilityState}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  marginHorizontal: 16,
                  marginTop: -14,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  borderRadius: 28,
                  minHeight: 52,
                  backgroundColor: focused
                    ? colors.student
                    : colors.borderLight || colors.border,
                  ...Platform.select({
                    ios: {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: focused ? 0.25 : 0.08,
                      shadowRadius: 8,
                    },
                    android: {
                      elevation: focused ? 6 : 2,
                    },
                  }),
                }}
              >
                {children}
              </TouchableOpacity>
            );
          },
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
