import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode } from "react";
import {
  REVIEW_STATUS,
  TRANSACTION_STATUS,
  USER_STATUS,
} from "../constants/Config";
import { Transaction } from "./WalletContext";

interface AdminAction {
  id: string;
  adminId: string;
  adminEmail: string;
  actionType:
    | "BLOCK_USER"
    | "UNBLOCK_USER"
    | "REVERSE_TRANSACTION"
    | "MARK_FRAUD"
    | "CLEAR_FRAUD";
  targetUserId?: string;
  targetEmail?: string;
  targetTransactionId?: string;
  reason: string;
  createdAt: string;
}

export type { AdminAction };

interface AdminContextType {
  getAllUsers: () => Promise<any[]>;
  getAllTransactions: () => Promise<Transaction[]>;
  getSuspiciousTransactions: () => Promise<Transaction[]>;
  blockUser: (
    email: string,
    reason: string,
    adminEmail: string
  ) => Promise<void>;
  unblockUser: (email: string, adminEmail: string) => Promise<void>;
  reverseTransaction: (
    transactionId: string,
    reason: string,
    adminEmail: string
  ) => Promise<void>;
  markTransactionFraud: (
    transactionId: string,
    adminEmail: string
  ) => Promise<void>;
  clearTransactionFraud: (
    transactionId: string,
    adminEmail: string
  ) => Promise<void>;
  getAdminActions: () => Promise<AdminAction[]>;
  deleteUser: (email: string, adminEmail: string) => Promise<void>;
}

export const AdminContext = createContext<AdminContextType>({
  getAllUsers: async () => [],
  getAllTransactions: async () => [],
  getSuspiciousTransactions: async () => [],
  blockUser: async () => {},
  unblockUser: async () => {},
  reverseTransaction: async () => {},
  markTransactionFraud: async () => {},
  clearTransactionFraud: async () => {},
  getAdminActions: async () => [],
  deleteUser: async () => {},
});

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const logAdminAction = async (
    action: Omit<AdminAction, "id" | "createdAt">
  ) => {
    try {
      const actionsStr = await AsyncStorage.getItem("ADMIN_ACTIONS");
      const actions = actionsStr ? JSON.parse(actionsStr) : [];

      const newAction: AdminAction = {
        ...action,
        id: `ACT${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      actions.unshift(newAction);
      await AsyncStorage.setItem("ADMIN_ACTIONS", JSON.stringify(actions));
    } catch (error) {
      console.error("Log admin action error:", error);
    }
  };

  const getAllUsers = async (): Promise<any[]> => {
    try {
      const usersStr = await AsyncStorage.getItem("ALL_USERS");
      if (!usersStr) return [];

      const users = JSON.parse(usersStr);
      return Object.keys(users).map((email) => {
        const { password, ...userWithoutPassword } = users[email];
        return userWithoutPassword;
      });
    } catch (error) {
      console.error("Get all users error:", error);
      return [];
    }
  };

  const getAllTransactions = async (): Promise<Transaction[]> => {
    try {
      const txnsStr = await AsyncStorage.getItem("GLOBAL_TRANSACTIONS");
      return txnsStr ? JSON.parse(txnsStr) : [];
    } catch (error) {
      console.error("Get all transactions error:", error);
      return [];
    }
  };

  const getSuspiciousTransactions = async (): Promise<Transaction[]> => {
    try {
      const allTxns = await getAllTransactions();
      return allTxns.filter(
        (t) =>
          t.reviewStatus === REVIEW_STATUS.SUSPICIOUS ||
          t.reviewStatus === REVIEW_STATUS.FRAUD
      );
    } catch (error) {
      console.error("Get suspicious transactions error:", error);
      return [];
    }
  };

  const blockUser = async (
    email: string,
    reason: string,
    adminEmail: string
  ) => {
    try {
      const usersStr = await AsyncStorage.getItem("ALL_USERS");
      if (!usersStr) throw new Error("No users found");

      const users = JSON.parse(usersStr);
      if (!users[email]) throw new Error("User not found");

      users[email].status = USER_STATUS.BLOCKED;
      users[email].blockReason = reason;
      users[email].blockUntil = null;
      users[email].updatedAt = new Date().toISOString();

      await AsyncStorage.setItem("ALL_USERS", JSON.stringify(users));

      await logAdminAction({
        adminId: "admin",
        adminEmail,
        actionType: "BLOCK_USER",
        targetEmail: email,
        targetUserId: users[email].uid,
        reason,
      });
    } catch (error: any) {
      throw error;
    }
  };

  const unblockUser = async (email: string, adminEmail: string) => {
    try {
      const usersStr = await AsyncStorage.getItem("ALL_USERS");
      if (!usersStr) throw new Error("No users found");

      const users = JSON.parse(usersStr);
      if (!users[email]) throw new Error("User not found");

      users[email].status = USER_STATUS.ACTIVE;
      users[email].blockReason = undefined;
      users[email].blockUntil = undefined;
      users[email].updatedAt = new Date().toISOString();

      await AsyncStorage.setItem("ALL_USERS", JSON.stringify(users));

      await logAdminAction({
        adminId: "admin",
        adminEmail,
        actionType: "UNBLOCK_USER",
        targetEmail: email,
        targetUserId: users[email].uid,
        reason: "Unblocked by admin",
      });
    } catch (error: any) {
      throw error;
    }
  };

  const reverseTransaction = async (
    transactionId: string,
    reason: string,
    adminEmail: string
  ) => {
    try {
      const globalTxnsStr = await AsyncStorage.getItem("GLOBAL_TRANSACTIONS");
      if (!globalTxnsStr) throw new Error("No transactions found");

      const globalTxns: Transaction[] = JSON.parse(globalTxnsStr);
      const transaction = globalTxns.find(
        (t) => t.transaction_id === transactionId
      );

      if (!transaction) throw new Error("Transaction not found");
      if (transaction.status === TRANSACTION_STATUS.REVERSED)
        throw new Error("Already reversed");
      if (transaction.type !== "payment")
        throw new Error("Can only reverse payments");

      // Get student and merchant emails
      const usersStr = await AsyncStorage.getItem("ALL_USERS");
      if (!usersStr) throw new Error("Users not found");

      const users = JSON.parse(usersStr);
      const studentEmail = Object.keys(users).find(
        (email) => users[email].studentId === transaction.student_id
      );
      const merchantEmail = Object.keys(users).find(
        (email) => users[email].merchantId === transaction.merchant_id
      );

      if (!studentEmail || !merchantEmail)
        throw new Error("User accounts not found");

      // Update student wallet (refund)
      const studentWalletStr = await AsyncStorage.getItem(
        `WALLET_${studentEmail}`
      );
      if (studentWalletStr) {
        const studentWallet = JSON.parse(studentWalletStr);
        studentWallet.balance += transaction.amount;

        const reversalTxn: Transaction = {
          transaction_id: `REV${Date.now()}`,
          student_id: transaction.student_id,
          merchant_id: transaction.merchant_id,
          amount: transaction.amount,
          timestamp: new Date().toISOString(),
          status: TRANSACTION_STATUS.COMPLETED,
          type: "reversal",
          parentTransactionId: transactionId,
          reversalReason: reason,
          riskScore: 0,
          riskFlags: [],
          reviewStatus: REVIEW_STATUS.CLEAN,
        };

        studentWallet.transactions = studentWallet.transactions.map(
          (t: Transaction) =>
            t.transaction_id === transactionId
              ? { ...t, status: TRANSACTION_STATUS.REVERSED }
              : t
        );
        studentWallet.transactions.unshift(reversalTxn);

        await AsyncStorage.setItem(
          `WALLET_${studentEmail}`,
          JSON.stringify(studentWallet)
        );
      }

      // Update merchant wallet (deduct)
      const merchantWalletStr = await AsyncStorage.getItem(
        `MERCHANT_WALLET_${merchantEmail}`
      );
      if (merchantWalletStr) {
        const merchantWallet = JSON.parse(merchantWalletStr);
        const merchantAmount = transaction.amount * 0.98;

        if (merchantWallet.balance < merchantAmount) {
          throw new Error("Merchant has insufficient balance for reversal");
        }

        merchantWallet.balance -= merchantAmount;
        merchantWallet.transactions = merchantWallet.transactions.map(
          (t: Transaction) =>
            t.transaction_id === transactionId
              ? { ...t, status: TRANSACTION_STATUS.REVERSED }
              : t
        );

        await AsyncStorage.setItem(
          `MERCHANT_WALLET_${merchantEmail}`,
          JSON.stringify(merchantWallet)
        );
      }

      // Update global transactions
      const updatedGlobalTxns = globalTxns.map((t) =>
        t.transaction_id === transactionId
          ? { ...t, status: TRANSACTION_STATUS.REVERSED }
          : t
      );
      await AsyncStorage.setItem(
        "GLOBAL_TRANSACTIONS",
        JSON.stringify(updatedGlobalTxns)
      );

      await logAdminAction({
        adminId: "admin",
        adminEmail,
        actionType: "REVERSE_TRANSACTION",
        targetTransactionId: transactionId,
        reason,
      });
    } catch (error: any) {
      throw error;
    }
  };

  const markTransactionFraud = async (
    transactionId: string,
    adminEmail: string
  ) => {
    try {
      const globalTxnsStr = await AsyncStorage.getItem("GLOBAL_TRANSACTIONS");
      if (!globalTxnsStr) throw new Error("No transactions found");

      const globalTxns: Transaction[] = JSON.parse(globalTxnsStr);
      const updatedTxns = globalTxns.map((t) =>
        t.transaction_id === transactionId
          ? { ...t, reviewStatus: REVIEW_STATUS.FRAUD }
          : t
      );

      await AsyncStorage.setItem(
        "GLOBAL_TRANSACTIONS",
        JSON.stringify(updatedTxns)
      );

      await logAdminAction({
        adminId: "admin",
        adminEmail,
        actionType: "MARK_FRAUD",
        targetTransactionId: transactionId,
        reason: "Marked as fraud by admin",
      });
    } catch (error: any) {
      throw error;
    }
  };

  const clearTransactionFraud = async (
    transactionId: string,
    adminEmail: string
  ) => {
    try {
      const globalTxnsStr = await AsyncStorage.getItem("GLOBAL_TRANSACTIONS");
      if (!globalTxnsStr) throw new Error("No transactions found");

      const globalTxns: Transaction[] = JSON.parse(globalTxnsStr);
      const updatedTxns = globalTxns.map((t) =>
        t.transaction_id === transactionId
          ? { ...t, reviewStatus: REVIEW_STATUS.CLEAN }
          : t
      );

      await AsyncStorage.setItem(
        "GLOBAL_TRANSACTIONS",
        JSON.stringify(updatedTxns)
      );

      await logAdminAction({
        adminId: "admin",
        adminEmail,
        actionType: "CLEAR_FRAUD",
        targetTransactionId: transactionId,
        reason: "Cleared fraud flag",
      });
    } catch (error: any) {
      throw error;
    }
  };

  const getAdminActions = async (): Promise<AdminAction[]> => {
    try {
      const actionsStr = await AsyncStorage.getItem("ADMIN_ACTIONS");
      return actionsStr ? JSON.parse(actionsStr) : [];
    } catch (error) {
      console.error("Get admin actions error:", error);
      return [];
    }
  };

  const deleteUser = async (email: string, adminEmail: string) => {
    try {
      const usersStr = await AsyncStorage.getItem("ALL_USERS");
      if (!usersStr) throw new Error("No users found");

      const users = JSON.parse(usersStr);
      if (!users[email]) throw new Error("User not found");

      const userToDelete = users[email];
      delete users[email];

      await AsyncStorage.setItem("ALL_USERS", JSON.stringify(users));
      await AsyncStorage.removeItem(`WALLET_${email}`);
      await AsyncStorage.removeItem(`MERCHANT_WALLET_${email}`);

      await logAdminAction({
        adminId: "admin",
        adminEmail,
        actionType: "BLOCK_USER",
        targetEmail: email,
        targetUserId: userToDelete.uid,
        reason: "User deleted",
      });
    } catch (error: any) {
      throw error;
    }
  };

  return (
    <AdminContext.Provider
      value={{
        getAllUsers,
        getAllTransactions,
        getSuspiciousTransactions,
        blockUser,
        unblockUser,
        reverseTransaction,
        markTransactionFraud,
        clearTransactionFraud,
        getAdminActions,
        deleteUser,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};
