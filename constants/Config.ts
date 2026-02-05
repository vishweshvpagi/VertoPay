// Light theme colors
export const COLORS = {
  // Premium color palette (softer blue contrast)
  primary: "#7C7FEB", // Softer indigo
  primaryDark: "#6B63C7",
  primaryLight: "#9CA0F5",
  secondary: "#10B981", // Emerald green
  danger: "#EF4444",
  warning: "#F59E0B",
  background: "#F8FAFC", // Softer background
  backgroundDark: "#0F172A",
  card: "#FFFFFF",
  cardElevated: "#FFFFFF",
  text: "#1E293B", // Darker, richer text
  textSecondary: "#475569",
  textLight: "#94A3B8",
  border: "#E2E8F0", // Softer borders
  borderLight: "#F1F5F9",
  success: "#10B981",
  merchant: "#F43F5E", // Rose
  student: "#2BA3BD", // Softer cyan (reduced contrast)
  studentGradient: ["#2BA3BD", "#0E9BB8"], // Softer gradient
  admin: "#8B5CF6", // Purple
  // Premium gradients (for simulation)
  gradientStart: "#2BA3BD",
  gradientEnd: "#0E9BB8",
  // Shadows
  shadow: "rgba(0, 0, 0, 0.08)",
  shadowDark: "rgba(0, 0, 0, 0.12)",
};

// Dark theme colors
export const DARK_COLORS = {
  // Premium color palette (softer blue contrast)
  primary: "#9CA0F5", // Softer indigo for dark mode
  primaryDark: "#7C7FEB",
  primaryLight: "#B8BBF7",
  secondary: "#34D399", // Lighter emerald
  danger: "#F87171", // Softer red
  warning: "#FBBF24", // Lighter amber
  background: "#0F172A", // Dark slate
  backgroundDark: "#020617", // Even darker
  card: "#1E293B", // Dark card
  cardElevated: "#334155", // Elevated dark card
  text: "#F1F5F9", // Light text
  textSecondary: "#CBD5E1",
  textLight: "#94A3B8",
  border: "#334155", // Dark borders
  borderLight: "#475569",
  success: "#34D399",
  merchant: "#FB7185", // Lighter rose
  student: "#4DB8D0", // Softer cyan (reduced contrast)
  studentGradient: ["#4DB8D0", "#2BA3BD"], // Softer gradient
  admin: "#A78BFA", // Lighter purple
  // Premium gradients (for simulation)
  gradientStart: "#4DB8D0",
  gradientEnd: "#2BA3BD",
  // Shadows
  shadow: "rgba(0, 0, 0, 0.3)",
  shadowDark: "rgba(0, 0, 0, 0.5)",
};

export const MERCHANT_CATEGORIES: Record<string, string> = {
  CAFE_01: "Main Campus Cafeteria",
  CAFE_02: "Block A Canteen",
  LIBRARY_01: "Central Library",
  STATIONARY_01: "Campus Store",
};

export const USER_ROLES = {
  STUDENT: "student",
  MERCHANT: "merchant",
  ADMIN: "admin",
};

export const QR_EXPIRY_TIME = 60000;

// Session Management Configuration
export const SESSION_CONFIG = {
  TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes of inactivity
  REFRESH_THRESHOLD: 24 * 60 * 60 * 1000, // Refresh token if less than 24 hours remaining
};

export const FRAUD_RULES = {
  HIGH_AMOUNT_THRESHOLD: 1000,
  BURST_COUNT: 5,
  BURST_TIME_WINDOW: 300000, // 5 minutes
  NEW_ACCOUNT_DAYS: 7,
  SUSPICIOUS_SCORE_THRESHOLD: 60,
};

export const TRANSACTION_STATUS = {
  COMPLETED: "completed",
  PENDING: "pending",
  REVERSED: "reversed",
  FAILED: "failed",
};

export const REVIEW_STATUS = {
  CLEAN: "clean",
  SUSPICIOUS: "suspicious",
  FRAUD: "fraud",
};

export const USER_STATUS = {
  ACTIVE: "active",
  BLOCKED: "blocked",
  SUSPENDED: "suspended",
};

export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];
export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];
export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
