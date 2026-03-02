import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { router } from 'expo-router';

// ✅ Change to your machine's LAN IP when testing on physical device
const LAPTOP_IP = '192.168.29.188';
const PORT      = '5001';

const getBaseUrl = (): string => {
  if (Platform.OS === 'web') return 'http://localhost:5001';
  return `http://${LAPTOP_IP}:${PORT}`;
};

export const API_BASE_URL = getBaseUrl();

console.log(`🌐 API: ${API_BASE_URL} | Platform: ${Platform.OS}`);

const TIMEOUT_MS = 15000;

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

// ── Token helper ──────────────────────────────────────────────────────────────
export const getStoredToken = async (): Promise<string | null> => {
  try {
    const raw = await AsyncStorage.getItem('AUTH_TOKEN');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const token  = typeof parsed === 'string' ? parsed : parsed?.token;
    return token?.startsWith('eyJ') ? token : null;
  } catch {
    return null;
  }
};

// ── Auto logout helper ────────────────────────────────────────────────────────
const handleUnauthorized = async () => {
  try {
    await AsyncStorage.multiRemove(['AUTH_TOKEN', 'user', 'role']);
  } catch {}
  // Small delay so the remove completes before navigation
  setTimeout(() => {
    try {
      router.replace('/login');
    } catch {}
  }, 100);
};

// ── Core request ──────────────────────────────────────────────────────────────
export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (!skipAuth) {
    const token = await getStoredToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const controller = new AbortController();
  const timer      = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw new Error(`Request timed out. Is the backend running at ${API_BASE_URL}?`);
    }
    throw new Error(err?.message || `Network error — check backend at ${API_BASE_URL}`);
  }

  clearTimeout(timer);

  // ✅ Handle 401 — token expired or invalid → auto logout
  if (res.status === 401) {
    await handleUnauthorized();
    throw new Error('Session expired. Please login again.');
  }

  // ✅ Handle 403 — deactivated account
  if (res.status === 403) {
    await handleUnauthorized();
    throw new Error('Account deactivated. Contact admin.');
  }

  let data: any = {};
  try {
    data = await res.json();
  } catch {
    // non-JSON response — ignore
  }

  if (!res.ok) {
    const err    = new Error(data?.message || res.statusText || 'Request failed') as any;
    err.status   = res.status;
    err.data     = data;
    throw err;
  }

  return data as T;
}

// ── CSV Export (raw fetch — needs blob, not JSON) ─────────────────────────────
export async function apiDownloadCSV(path: string): Promise<Blob> {
  const token = await getStoredToken();
  const url   = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    method:  'GET',
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type':  'application/json',
    },
  });

  if (res.status === 401) {
    await handleUnauthorized();
    throw new Error('Session expired. Please login again.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Export failed' }));
    throw new Error(err.message);
  }

  return res.blob();
}

// ── Health check ──────────────────────────────────────────────────────────────
export async function testConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}
