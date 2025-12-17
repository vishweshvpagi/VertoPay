export const COLORS = {
  primary: "#6C63FF",
  secondary: "#4CAF50",
  danger: "#FF5252",
  warning: "#FFC107",
  background: "#F5F5F5",
  card: "#FFFFFF",
  text: "#212121",
  textLight: "#757575",
  border: "#E0E0E0",
  success: "#4CAF50",
  merchant: "#FF6B6B",
  student: "#4ECDC4",
  admin: "#9B59B6",
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
