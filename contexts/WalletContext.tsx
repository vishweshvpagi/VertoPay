import React, { createContext, ReactNode, useCallback, useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { decryptPaymentData } from "../utils/encryption";

interface Transaction {
  transaction_id: string;
  student_id: string;
  merchant_id: string;
  amount: number;
  timestamp: string;
  status: string;
}

interface WalletContextType {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  fetchTransactions: () => Promise<void>;
  merchantBalance: number;
  merchantTransactions: Transaction[];
  processPayment: (encryptedQR: string) => Promise<{ success: boolean; message: string }>;
}

export const WalletContext = createContext<WalletContextType>({
  balance: 0,
  transactions: [],
  loading: false,
  fetchTransactions: async () => {},
  merchantBalance: 0,
  merchantTransactions: [],
  processPayment: async () => ({ success: false, message: "" }),
});

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [balance, setBalance] = useState(1000);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchantBalance, setMerchantBalance] = useState(0);
  const [merchantTransactions, setMerchantTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadWalletData = useCallback(() => {
    if (!user) return;

    try {
      setLoading(true);

      if (user.role === "student") {
        const walletKey = `@vertopay_wallet_${user.uid}`;
        const walletData = localStorage.getItem(walletKey);
        if (walletData) {
          const parsed = JSON.parse(walletData);
          setBalance(parsed.balance || 1000);
          setTransactions(parsed.transactions || []);
        }
      } else if (user.role === "merchant") {
        const merchantKey = `@vertopay_merchant_${user.uid}`;
        const merchantData = localStorage.getItem(merchantKey);
        if (merchantData) {
          const parsed = JSON.parse(merchantData);
          setMerchantBalance(parsed.balance || 0);
          setMerchantTransactions(parsed.transactions || []);
        }
      }
    } catch (error) {
      console.error("Load wallet error:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user, loadWalletData]);

  const saveMerchantData = (newBalance: number, newTransactions: Transaction[]) => {
    try {
      const merchantKey = `@vertopay_merchant_${user?.uid}`;
      localStorage.setItem(merchantKey, JSON.stringify({ balance: newBalance, transactions: newTransactions }));
    } catch (error) {
      console.error("Save merchant error:", error);
    }
  };

  const fetchTransactions = async () => {
    loadWalletData();
  };

  const processPayment = async (encryptedQR: string): Promise<{ success: boolean; message: string }> => {
    if (!user || user.role !== "merchant") {
      return { success: false, message: "Only merchants can process payments" };
    }

    try {
      const decrypted = await decryptPaymentData(encryptedQR);
      const paymentData = JSON.parse(decrypted);
      const { amount, studentId } = paymentData;

      const newMerchantBalance = merchantBalance + amount * 0.98;
      const newTransaction: Transaction = {
        transaction_id: Date.now().toString(),
        student_id: studentId,
        merchant_id: user.email,
        amount,
        timestamp: new Date().toISOString(),
        status: "completed",
      };
      const newMerchantTransactions = [newTransaction, ...merchantTransactions];
      
      setMerchantBalance(newMerchantBalance);
      setMerchantTransactions(newMerchantTransactions);
      saveMerchantData(newMerchantBalance, newMerchantTransactions);

      return { success: true, message: `Payment of ₹${amount} processed successfully` };
    } catch (error) {
      return { success: false, message: "Invalid QR code" };
    }
  };

  return (
    <WalletContext.Provider value={{ balance, transactions, loading, fetchTransactions, merchantBalance, merchantTransactions, processPayment }}>
      {children}
    </WalletContext.Provider>
  );
};
