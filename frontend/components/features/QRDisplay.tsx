import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/Config";

interface QRDisplayProps {
  qrData: string;
  amount: number;
  merchantName: string;
  expirySeconds?: number;
  onExpire?: () => void;
  onCancel?: () => void;
}

export default function QRDisplay({
  qrData,
  amount,
  merchantName,
  expirySeconds = 60,
  onExpire,
  onCancel,
}: QRDisplayProps) {
  const [countdown, setCountdown] = useState(expirySeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onExpire]);

  const getCountdownColor = () => {
    if (countdown > 30) return COLORS.success;
    if (countdown > 10) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <QRCode value={qrData} size={250} />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.row}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>₹{amount}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Merchant:</Text>
          <Text style={styles.merchantValue} numberOfLines={1}>
            {merchantName}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.countdownContainer,
          { backgroundColor: getCountdownColor() },
        ]}
      >
        <Ionicons name="time" size={20} color="#fff" />
        <Text style={styles.countdown}>Expires in {countdown}s</Text>
      </View>

      <Text style={styles.instruction}>
        Show this QR code to the merchant for scanning
      </Text>

      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel Payment</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    padding: 24,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
  },
  infoContainer: {
    width: "100%",
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  merchantValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
    textAlign: "right",
    marginLeft: 8,
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 12,
  },
  countdown: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  instruction: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: "600",
  },
});
