import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Your laptop's IP address
const LAPTOP_IP = "192.168.0.101";
const PORT = "5000";

const getApiBaseUrl = (): string => {
  // Development mode
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    if (Platform.OS === "web") {
      // Web version (localhost:8081) - use localhost
      return "http://localhost:5000";
    } else if (Platform.OS === "android") {
      // Android device/emulator - use laptop IP
      return `http://${LAPTOP_IP}:${PORT}`;
    } else if (Platform.OS === "ios") {
      // iOS device/simulator - use laptop IP
      return `http://${LAPTOP_IP}:${PORT}`;
    }
  }
  
  // Production mode
  return (process as any).env?.EXPO_PUBLIC_API_URL || `http://${LAPTOP_IP}:${PORT}`;
};

export const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging
console.log("🌐 API Base URL:", API_BASE_URL);
console.log("📱 Platform:", Platform.OS);
console.log("🔧 Dev Mode:", typeof __DEV__ !== "undefined" && __DEV__);

const REQUEST_TIMEOUT_MS = 15000;

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Make an authenticated request to the backend.
 * Automatically adds base URL and Bearer token from AsyncStorage when available.
 * Uses a timeout so the app doesn't hang if the backend is down.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  
  console.log("📡 API Request:", url);
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  // Add authentication token if not skipping auth
  if (!skipAuth) {
    try {
      const tokenDataStr = await AsyncStorage.getItem("AUTH_TOKEN");
      if (tokenDataStr) {
        const tokenData = JSON.parse(tokenDataStr);
        const token =
          typeof tokenData === "string" ? tokenData : tokenData?.token;
        if (token && token.startsWith("eyJ")) {
          headers["Authorization"] = `Bearer ${token}`;
          console.log("🔐 Auth token added to request");
        }
      }
    } catch (err) {
      console.error("❌ Failed to get auth token:", err);
    }
  }

  // Setup request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.error("⏰ Request timeout after", REQUEST_TIMEOUT_MS, "ms");
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  
  const signal = fetchOptions.signal ?? controller.signal;
  const finalOptions = { ...fetchOptions, headers, signal };

  let res: Response;
  try {
    res = await fetch(url, finalOptions);
  } catch (err: any) {
    clearTimeout(timeoutId);
    
    if (err?.name === "AbortError") {
      const errorMsg = `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Is the backend running at ${API_BASE_URL}?`;
      console.error("❌", errorMsg);
      throw new Error(errorMsg);
    }
    
    const msg =
      err?.message || 
      err?.toString?.() || 
      `Network error. Check if backend is running at ${API_BASE_URL}`;
    
    console.error("❌ Network error:", msg);
    throw new Error(msg);
  }
  
  clearTimeout(timeoutId);

  console.log("📡 Response status:", res.status);

  // Parse response
  let data: any;
  try {
    data = await res.json();
  } catch (parseErr) {
    console.error("❌ Failed to parse JSON response");
    data = {};
  }

  // Handle non-ok responses
  if (!res.ok) {
    const message = data?.message || res.statusText || "Request failed";
    console.error("❌ API Error:", res.status, message);
    
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  console.log("✅ API Request successful");
  return data as T;
}

// Helper function to test API connection
export async function testConnection(): Promise<boolean> {
  try {
    console.log("🔍 Testing connection to backend...");
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Backend connection successful:", data);
      return true;
    } else {
      console.error("❌ Backend returned status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Cannot connect to backend:", error);
    return false;
  }
}
