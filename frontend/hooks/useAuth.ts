import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useContext, useRef } from "react";
import { Platform } from "react-native";
import { AuthContext } from "../contexts/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const isLoggingOutRef = useRef(false);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  useFocusEffect(
    useCallback(() => {
      if (
        context.user &&
        context.updateLastActivity &&
        !context.loading &&
        !isLoggingOutRef.current
      ) {
        context.updateLastActivity();
      }
    }, [context.user, context.loading]),
  );

  const enhancedLogout = async () => {
    try {
      console.log("🚪 Logout started");
      isLoggingOutRef.current = true;

      // 1. Wipe storage
      await AsyncStorage.multiRemove(["AUTH_TOKEN", "CURRENT_USER"]);

      // 2. Null user in context
      await context.logout();

      console.log("✅ Logout complete");

      // 3. Navigate — hard reload on web, router on native
      if (Platform.OS === "web") {
        window.location.href = "/";
      } else {
        router.replace("/(auth)/login");
      }
    } catch (error) {
      console.error("❌ Logout error:", error);
      isLoggingOutRef.current = false;
      await AsyncStorage.multiRemove(["AUTH_TOKEN", "CURRENT_USER"]);
      if (Platform.OS === "web") {
        window.location.href = "/";
      } else {
        router.replace("/(auth)/login");
      }
    }
  };

  return {
    ...context,
    logout: enhancedLogout,
  };
};
