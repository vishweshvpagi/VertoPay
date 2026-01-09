export const COLORS = {
  // Premium color palette
  primary: "#6366F1", // Indigo - more premium
  primaryDark: "#4F46E5",
  primaryLight: "#818CF8",
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
  student: "#06B6D4", // Cyan - more vibrant
  studentGradient: ["#06B6D4", "#0891B2"], // Gradient colors
  admin: "#8B5CF6", // Purple
  // Premium gradients (for simulation)
  gradientStart: "#06B6D4",
  gradientEnd: "#0891B2",
  // Shadows
  shadow: "rgba(0, 0, 0, 0.08)",
  shadowDark: "rgba(0, 0, 0, 0.12)",
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
