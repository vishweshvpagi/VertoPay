import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useEffect, useRef, useState } from "react";
import { apiRequest } from "../utils/api";

interface User {
  _id: string;
  email: string;
  name: string;
  role: "student" | "merchant" | "admin";
  balance?: number;
  studentId?: string;
  merchantId?: string;
  shopName?: string;
  ownerName?: string;
  isActive?: boolean;
  [key: string]: any;
}

interface TokenStore {
  token: string;
  email: string;
  expiresAt: number;
  lastActivity: number;
}

// Normalize backend user so frontend always gets consistent shape
function normalizeUser(raw: any): User {
  if (!raw) return raw;
  const u = { ...raw };

  if (u.role === "merchant") {
    u.name = u.ownerName ?? u.name ?? u.email?.split("@")[0] ?? "Merchant";
    u.merchantName = u.shopName ?? u.merchantName;
  }

  u.name = u.name || u.fullName || u.email?.split("@")[0] || "User";
  return u;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    email: string,
    password: string,
    role: string,
    details: any,
  ) => Promise<User>;
  logout: () => Promise<void>;
  updateLastActivity: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadUser();
    }
  }, []);

  // ── Load user on app start ──────────────────────────────────────────────────
  const loadUser = async () => {
    console.log("📂 loadUser start");
    try {
      const raw = await AsyncStorage.getItem("AUTH_TOKEN");
      if (!raw) {
        console.log("❌ No AUTH_TOKEN");
        return;
      }

      let tokenStore: TokenStore;
      try {
        tokenStore = JSON.parse(raw);
      } catch {
        await clearSession();
        return;
      }

      const token =
        typeof tokenStore === "string" ? tokenStore : tokenStore?.token;
      if (!token?.startsWith("eyJ")) {
        console.log("❌ Invalid token format");
        await clearSession();
        return;
      }

      // ✅ Always validate with backend — fall back to cache on network error
      try {
        const data = await apiRequest<{ user: any }>("/api/auth/me");
        const normalized = normalizeUser(data.user);
        await AsyncStorage.setItem("CURRENT_USER", JSON.stringify(normalized));
        setUser(normalized);
        console.log(
          `✅ User loaded from backend: [${normalized.role}] ${normalized.email}`,
        );
      } catch (err: any) {
        if (err?.status === 401) {
          console.log("🚪 401 — clearing session");
          await clearSession();
        } else {
          // Network error — use cache
          const cached = await AsyncStorage.getItem("CURRENT_USER");
          if (cached) {
            const parsed = normalizeUser(JSON.parse(cached));
            setUser(parsed);
            console.log(
              `⚠️ Using cached user: [${parsed.role}] ${parsed.email}`,
            );
          } else {
            await clearSession();
          }
        }
      }
    } catch (err) {
      console.error("❌ loadUser error:", err);
      await clearSession();
    } finally {
      setLoading(false);
      console.log("✅ loadUser complete");
    }
  };

  const clearSession = async () => {
    try {
      await AsyncStorage.multiRemove(["AUTH_TOKEN", "CURRENT_USER"]);
    } catch {
      /* ignore */
    }
    setUser(null);
  };

  const updateLastActivity = async () => {
    try {
      const raw = await AsyncStorage.getItem("AUTH_TOKEN");
      if (!raw) return;
      const tokenStore: TokenStore = JSON.parse(raw);
      tokenStore.lastActivity = Date.now();
      await AsyncStorage.setItem("AUTH_TOKEN", JSON.stringify(tokenStore));
    } catch {
      /* ignore */
    }
  };

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiRequest<{ token: string; user: any }>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
        skipAuth: true,
      },
    );

    const normalized = normalizeUser(data.user);
    const now = Date.now();

    const tokenStore: TokenStore = {
      token: data.token,
      email: normalized.email,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
      lastActivity: now,
    };

    await AsyncStorage.setItem("AUTH_TOKEN", JSON.stringify(tokenStore));
    await AsyncStorage.setItem("CURRENT_USER", JSON.stringify(normalized));

    setUser(normalized);
    console.log(`✅ Logged in: [${normalized.role}] ${normalized.email}`);
    return normalized;
  };

  // ── Register ────────────────────────────────────────────────────────────────
  const register = async (
    email: string,
    password: string,
    role: string,
    details: any,
  ): Promise<User> => {
    const emailLower = email.toLowerCase().trim();
    let endpoint = "";
    let body: any = {};

    if (role === "student") {
      endpoint = "/api/auth/register/student";
      body = {
        name: details.name?.trim() || "",
        email: emailLower,
        password,
        phone: details.phone?.trim() || "0000000000",
      };
    } else if (role === "merchant") {
      endpoint = "/api/auth/register/merchant";
      body = {
        shopName: (details.merchantName ?? details.name ?? "Shop").trim(),
        ownerName: (details.name ?? "").trim(),
        email: emailLower,
        password,
        phone: details.phone?.trim() || "0000000000",
        merchantId: details.merchantId || details.category,
        category: details.merchantId || details.category,
      };
    } else {
      throw new Error("Invalid role");
    }

    const data = await apiRequest<{ token: string; user: any }>(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      skipAuth: true,
    });

    const normalized = normalizeUser(data.user);
    const now = Date.now();

    const tokenStore: TokenStore = {
      token: data.token,
      email: normalized.email,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
      lastActivity: now,
    };

    await AsyncStorage.setItem("AUTH_TOKEN", JSON.stringify(tokenStore));
    await AsyncStorage.setItem("CURRENT_USER", JSON.stringify(normalized));

    setUser(normalized);
    console.log(`✅ Registered: [${normalized.role}] ${normalized.email}`);
    return normalized;
  };

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    console.log("🚪 Logging out...");
    await clearSession();
    console.log("✅ Logged out");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateLastActivity }}
    >
      {children}
    </AuthContext.Provider>
  );
}
