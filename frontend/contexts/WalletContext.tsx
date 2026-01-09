import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  FRAUD_RULES,
  REVIEW_STATUS,
  ReviewStatus,
  TRANSACTION_STATUS,
  TransactionStatus,
} from "../constants/Config";
import { AuthContext } from "./AuthContext";

export interface Transaction {
  transaction_id: string;
  student_id: string;
  merchant_id: string;
  amount: number;
  timestamp: string;
  status: TransactionStatus;
  type: "payment" | "recharge" | "reversal";
  student_name?: string;
  riskScore?: number;
  riskFlags?: string[];
  reviewStatus?: ReviewStatus;
  parentTransactionId?: string;
  reversalReason?: string;
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  refreshWallet: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  addTransaction: (merchantId: string, amount: number) => Promise<void>;
  rechargeWallet: (amount: number) => Promise<void>;
  merchantBalance: number;
  merchantTransactions: Transaction[];
  processPayment: (
    encryptedQR: string
  ) => Promise<{ success: boolean; message: string }>;
}

export const WalletContext = createContext<WalletContextType>({
  balance: 0,
  transactions: [],
  loading: false,
  refreshWallet: async () => {},
  fetchTransactions: async () => {},
  addTransaction: async () => {},
  rechargeWallet: async () => {},
  merchantBalance: 0,
  merchantTransactions: [],
  processPayment: async () => ({ success: false, message: "" }),
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useContext(AuthContext);
  const [balance, setBalance] = useState(500);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchantBalance, setMerchantBalance] = useState(0);
  const [merchantTransactions, setMerchantTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadWalletData();
    } else {
      setBalance(500);
      setTransactions([]);
      setMerchantBalance(0);
      setMerchantTransactions([]);
    }
  }, [user?.email]);

  const loadWalletData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      if (user.role === "student") {
        const walletData = await AsyncStorage.getItem(`WALLET_${user.email}`);
        if (walletData) {
          const { balance: savedBalance, transactions: savedTransactions } =
            JSON.parse(walletData);
          setBalance(savedBalance || 500);
          setTransactions(savedTransactions || []);
        }
      } else if (user.role === "merchant") {
        const merchantData = await AsyncStorage.getItem(
          `MERCHANT_WALLET_${user.email}`
        );
        if (merchantData) {
          const { balance: savedBalance, transactions: savedTransactions } =
            JSON.parse(merchantData);
          setMerchantBalance(savedBalance || 0);
          setMerchantTransactions(savedTransactions || []);
        }
      }
    } catch (error) {
      console.error("Load wallet error:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskScore = async (
    studentEmail: string,
    amount: number
  ): Promise<{ score: number; flags: string[] }> => {
    let score = 0;
    const flags: string[] = [];

    // Rule 1: High amount
    if (amount > FRAUD_RULES.HIGH_AMOUNT_THRESHOLD) {
      score += 30;
      flags.push("HIGH_AMOUNT");
    }

    // Rule 2: Burst activity
    const walletData = await AsyncStorage.getItem(`WALLET_${studentEmail}`);
    if (walletData) {
      const { transactions: studentTxns } = JSON.parse(walletData);
      const now = Date.now();
      const recentTxns = studentTxns.filter(
        (t: Transaction) =>
          now - new Date(t.timestamp).getTime() < FRAUD_RULES.BURST_TIME_WINDOW
      );

      if (recentTxns.length >= FRAUD_RULES.BURST_COUNT) {
        score += 40;
        flags.push("BURST_ACTIVITY");
      }
    }

    // Rule 3: New account
    const usersStr = await AsyncStorage.getItem("ALL_USERS");
    if (usersStr) {
      const users = JSON.parse(usersStr);
      const userData = users[studentEmail];
      if (userData) {
        const accountAge = Date.now() - new Date(userData.createdAt).getTime();
        const accountAgeDays = accountAge / (1000 * 60 * 60 * 24);

        if (accountAgeDays < FRAUD_RULES.NEW_ACCOUNT_DAYS && amount > 500) {
          score += 25;
          flags.push("NEW_ACCOUNT_HIGH_AMOUNT");
        }
      }
    }

    return { score, flags };
  };

  const fetchTransactions = async () => {
    await loadWalletData();
  };

  const refreshWallet = async () => {
    await loadWalletData();
  };

  const addTransaction = async (merchantId: string, amount: number) => {
    if (!user) return;

    if (amount > balance) {
      throw new Error("Insufficient balance");
    }

    const { score: riskScore, flags: riskFlags } = await calculateRiskScore(
      user.email,
      amount
    );

    const newTransaction: Transaction = {
      transaction_id: `TXN${Date.now()}`,
      student_id: user.studentId || "UNKNOWN",
      merchant_id: merchantId,
      amount: amount,
      timestamp: new Date().toISOString(),
      status: TRANSACTION_STATUS.COMPLETED,
      type: "payment",
      riskScore,
      riskFlags,
      reviewStatus:
        riskScore >= FRAUD_RULES.SUSPICIOUS_SCORE_THRESHOLD
          ? REVIEW_STATUS.SUSPICIOUS
          : REVIEW_STATUS.CLEAN,
    };

    const newBalance = balance - amount;
    const updatedTransactions = [newTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(updatedTransactions);

    await AsyncStorage.setItem(
      `WALLET_${user.email}`,
      JSON.stringify({ balance: newBalance, transactions: updatedTransactions })
    );

    // Store in global transactions for admin
    await storeGlobalTransaction(newTransaction);
  };

  const rechargeWallet = async (amount: number) => {
    if (!user) return;

    const newBalance = balance + amount;

    const rechargeTransaction: Transaction = {
      transaction_id: `RECH${Date.now()}`,
      student_id: user.studentId || "UNKNOWN",
      merchant_id: "WALLET_RECHARGE",
      amount: amount,
      timestamp: new Date().toISOString(),
      status: TRANSACTION_STATUS.COMPLETED,
      type: "recharge",
      riskScore: 0,
      riskFlags: [],
      reviewStatus: REVIEW_STATUS.CLEAN,
    };

    const updatedTransactions = [rechargeTransaction, ...transactions];

    setBalance(newBalance);
    setTransactions(updatedTransactions);

    await AsyncStorage.setItem(
      `WALLET_${user.email}`,
      JSON.stringify({ balance: newBalance, transactions: updatedTransactions })
    );

    await storeGlobalTransaction(rechargeTransaction);
  };

  const storeGlobalTransaction = async (transaction: Transaction) => {
    try {
      const globalTxnsStr = await AsyncStorage.getItem("GLOBAL_TRANSACTIONS");
      const globalTxns = globalTxnsStr ? JSON.parse(globalTxnsStr) : [];
      globalTxns.unshift(transaction);
      await AsyncStorage.setItem(
        "GLOBAL_TRANSACTIONS",
        JSON.stringify(globalTxns)
      );
    } catch (error) {
      console.error("Store global transaction error:", error);
    }
  };

  const decryptQR = (encrypted: string): any => {
    try {
      const step1 = atob(encrypted);
      const step2 = step1.split("").reverse().join("");
      const step3 = atob(step2);
      const decrypted = atob(step3);
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error("Invalid QR code");
    }
  };

  const processPayment = async (
    encryptedQR: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const qrData = decryptQR(encryptedQR);
      const { sid, amt, mid, ts } = qrData;

      if (mid !== user?.merchantId) {
        return { success: false, message: "QR code not for this merchant" };
      }

      const now = Date.now();
      if (now - ts > 60000) {
        return { success: false, message: "QR code expired" };
      }

      const usersStr = await AsyncStorage.getItem("ALL_USERS");
      if (!usersStr) {
        return { success: false, message: "User not found" };
      }

      const users = JSON.parse(usersStr);
      const studentEmail = Object.keys(users).find(
        (email) => users[email].studentId === sid
      );

      if (!studentEmail) {
        return { success: false, message: "Student not found" };
      }

      const studentWallet = await AsyncStorage.getItem(
        `WALLET_${studentEmail}`
      );
      if (!studentWallet) {
        return { success: false, message: "Student wallet not found" };
      }

      const { balance: studentBalance, transactions: studentTransactions } =
        JSON.parse(studentWallet);

      if (studentBalance < amt) {
        return { success: false, message: "Insufficient balance" };
      }

      const { score: riskScore, flags: riskFlags } = await calculateRiskScore(
        studentEmail,
        amt
      );

      const transaction: Transaction = {
        transaction_id: `TXN${Date.now()}`,
        student_id: sid,
        merchant_id: user?.merchantId || "",
        amount: amt,
        timestamp: new Date().toISOString(),
        status: TRANSACTION_STATUS.COMPLETED,
        type: "payment",
        student_name: users[studentEmail].name,
        riskScore,
        riskFlags,
        reviewStatus:
          riskScore >= FRAUD_RULES.SUSPICIOUS_SCORE_THRESHOLD
            ? REVIEW_STATUS.SUSPICIOUS
            : REVIEW_STATUS.CLEAN,
      };

      const newStudentBalance = studentBalance - amt;
      await AsyncStorage.setItem(
        `WALLET_${studentEmail}`,
        JSON.stringify({
          balance: newStudentBalance,
          transactions: [transaction, ...studentTransactions],
        })
      );

      const merchantAmount = amt * 0.98;
      const newMerchantBalance = merchantBalance + merchantAmount;
      const updatedMerchantTransactions = [
        transaction,
        ...merchantTransactions,
      ];

      setMerchantBalance(newMerchantBalance);
      setMerchantTransactions(updatedMerchantTransactions);

      await AsyncStorage.setItem(
        `MERCHANT_WALLET_${user?.email}`,
        JSON.stringify({
          balance: newMerchantBalance,
          transactions: updatedMerchantTransactions,
        })
      );

      await storeGlobalTransaction(transaction);

      return {
        success: true,
        message: `₹${amt} received from ${users[studentEmail].name}`,
      };
    } catch (error: any) {
      console.error("Payment processing error:", error);
      return { success: false, message: error.message || "Payment failed" };
    }
  };

  return (
    <WalletContext.Provider
      value={{
        balance,
        transactions,
        loading,
        refreshWallet,
        fetchTransactions,
        addTransaction,
        rechargeWallet,
        merchantBalance,
        merchantTransactions,
        processPayment,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
