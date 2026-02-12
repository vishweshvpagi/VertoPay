import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const getApiBaseUrl = (): string => {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    return Platform.OS === "android"
      ? "http://10.0.2.2:5000"
      : "http://localhost:5000";
  }
  return (process as any).env?.EXPO_PUBLIC_API_URL || "http://localhost:5000";
};

export const API_BASE_URL = getApiBaseUrl();

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
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (!skipAuth) {
    try {
      const tokenDataStr = await AsyncStorage.getItem("AUTH_TOKEN");
      if (tokenDataStr) {
        const tokenData = JSON.parse(tokenDataStr);
        const token =
          typeof tokenData === "string" ? tokenData : tokenData?.token;
        if (token && token.startsWith("eyJ")) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
    } catch (_) {
      // ignore
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const signal = fetchOptions.signal ?? controller.signal;
  const finalOptions = { ...fetchOptions, headers, signal };

  let res: Response;
  try {
    res = await fetch(url, finalOptions);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError") {
      throw new Error(
        `Request timed out. Is the backend running at ${API_BASE_URL}?`
      );
    }
    const msg =
      err?.message || err?.toString?.() || "Network error. Check backend and connection.";
    throw new Error(msg);
  }
  clearTimeout(timeoutId);

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = data?.message || res.statusText || "Request failed";
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return data as T;
}
