import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { CameraView, Camera } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../contexts/ToastContext";
import { MERCHANT_CATEGORIES } from "../../constants/Config";
import { apiRequest } from "../../utils/api";

export default function ScanScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const styles = getStyles(colors);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    getCameraPermission();
  }, []);

  const getCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === "granted");
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    try {
      const qrData = JSON.parse(data);

      if (qrData.type !== "payment" || !qrData.transactionId) {
        toast.show({
          type: "error",
          text1: "Invalid QR",
          text2: "Not a valid payment QR code.",
        });
        setScanned(false);
        return;
      }

      if (qrData.merchantId !== user?.merchantId) {
        toast.show({
          type: "error",
          text1: "Wrong Merchant",
          text2: `QR is for ${MERCHANT_CATEGORIES[qrData.merchantId] || qrData.merchantId}, but you are ${user?.merchantName}.`,
        });
        setScanned(false);
        return;
      }

      setPaymentData(qrData);
      setConfirmModalVisible(true);
    } catch {
      toast.show({
        type: "error",
        text1: "Invalid QR Code",
        text2: "Could not read QR data.",
      });
      setScanned(false);
    }
  };

  const handleConfirmPayment = async () => {
    setProcessing(true);
    try {
      const result = await apiRequest<any>("/api/transactions/verify-qr", {
        method: "POST",
        body: JSON.stringify({ qrData: paymentData }),
      });

      setPaymentResult({
        transactionId: result.transactionId,
        amount: result.amount,
        studentName: paymentData.studentName,
      });
      setConfirmModalVisible(false);
      setScanned(false);

      Alert.alert(
        "Payment Successful",
        `₹${result.amount.toFixed(2)} received from ${paymentData.studentName}`,
      );
    } catch (error: any) {
      Alert.alert(
        "Transaction Failed",
        error?.message || "Failed to process payment.",
      );
      resetState();
    } finally {
      setProcessing(false);
    }
  };

  const resetState = () => {
    setConfirmModalVisible(false);
    setScanned(false);
    setPaymentData(null);
    setPaymentResult(null);
    setProcessing(false);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.merchant} />
        <Text style={styles.permissionText}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Ionicons name="ban" size={64} color={colors.danger} />
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={getCameraPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan Student QR</Text>
        <Text style={styles.merchantInfoText}>
          {user?.merchantName} · {user?.merchantId}
        </Text>
      </View>

      {paymentResult ? (
        <View style={styles.successScreen}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
          <Text style={styles.successTitle}>Payment Completed</Text>
          <Text style={styles.successAmount}>
            ₹{paymentResult.amount.toFixed(2)}
          </Text>
          <Text style={styles.successText}>
            Transaction ID: {paymentResult.transactionId}
          </Text>
          <Text style={styles.successText}>
            From: {paymentResult.studentName}
          </Text>

          <TouchableOpacity style={styles.resetButton} onPress={resetState}>
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.resetButtonText}>Scan Another QR</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
            </View>
            <View style={styles.instructions}>
              <Ionicons name="qr-code" size={32} color="#fff" />
              <Text style={styles.instructionText}>
                Scan student's payment QR
              </Text>
              <Text style={styles.instructionSubtext}>
                Must be for: {user?.merchantName}
              </Text>
            </View>
          </View>

          {scanned && !confirmModalVisible && (
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setScanned(false);
                setPaymentData(null);
              }}
            >
              <Ionicons name="refresh" size={24} color="#fff" />
              <Text style={styles.resetButtonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="slide"
        onRequestClose={resetState}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Payment</Text>
              <TouchableOpacity onPress={resetState} disabled={processing}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {paymentData && (
              <>
                <View style={styles.verificationBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.success}
                  />
                  <Text style={styles.verificationText}>
                    ✓ Payment verified for {user?.merchantName}
                  </Text>
                </View>

                <View style={styles.amountSection}>
                  <Text style={styles.amountLabel}>Amount to Receive</Text>
                  <Text style={styles.amountValue}>
                    ₹{paymentData.amount.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.infoIcon}>
                    <Ionicons name="person" size={24} color={colors.student} />
                  </View>
                  <View style={styles.infoDetails}>
                    <Text style={styles.infoLabel}>Student</Text>
                    <Text style={styles.infoValue}>
                      {paymentData.studentName}
                    </Text>
                    <Text style={styles.infoSubvalue}>
                      ID: {paymentData.studentId}
                    </Text>
                    <Text style={styles.infoSubvalue}>
                      {paymentData.studentEmail}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailsSection}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {paymentData.transactionId}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Merchant</Text>
                    <Text style={styles.detailValue}>
                      {paymentData.merchantName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Merchant ID</Text>
                    <Text style={styles.detailValue}>
                      {paymentData.merchantId}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>
                      {new Date(paymentData.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.confirmButton, processing && { opacity: 0.6 }]}
                  onPress={handleConfirmPayment}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#fff"
                      />
                      <Text style={styles.confirmButtonText}>
                        Confirm Payment
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.background,
    },
    header: { padding: 20, paddingTop: 60, backgroundColor: colors.merchant },
    title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
    merchantInfoText: {
      fontSize: 14,
      color: "rgba(255,255,255,0.8)",
      marginTop: 4,
    },
    cameraContainer: { flex: 1, width: "100%", position: "relative" },
    camera: { flex: 1 },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    scanFrame: { width: 280, height: 280, position: "relative" },
    corner: {
      position: "absolute",
      width: 40,
      height: 40,
      borderColor: colors.merchant,
    },
    topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
    topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
    bottomLeft: {
      bottom: 0,
      left: 0,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
    },
    bottomRight: {
      bottom: 0,
      right: 0,
      borderBottomWidth: 4,
      borderRightWidth: 4,
    },
    instructions: {
      position: "absolute",
      bottom: 60,
      alignItems: "center",
      gap: 12,
    },
    instructionText: {
      fontSize: 16,
      color: "#fff",
      fontWeight: "600",
      textAlign: "center",
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
    },
    instructionSubtext: {
      fontSize: 14,
      color: "#fff",
      textAlign: "center",
      backgroundColor: "rgba(0,0,0,0.6)",
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 12,
    },
    resetButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.merchant,
      margin: 20,
      padding: 16,
      borderRadius: 12,
      gap: 8,
    },
    resetButtonText: { fontSize: 18, fontWeight: "bold", color: "#fff" },
    permissionText: {
      fontSize: 18,
      color: colors.text,
      marginTop: 20,
      textAlign: "center",
    },
    permissionButton: {
      backgroundColor: colors.merchant,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 20,
    },
    permissionButtonText: { fontSize: 16, fontWeight: "bold", color: "#fff" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    modalTitle: { fontSize: 24, fontWeight: "bold", color: colors.text },
    verificationBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.success + "15",
      padding: 12,
      borderRadius: 12,
      marginBottom: 20,
      gap: 8,
    },
    verificationText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.success,
    },
    amountSection: {
      alignItems: "center",
      backgroundColor: colors.merchant + "15",
      padding: 24,
      borderRadius: 16,
      marginBottom: 20,
    },
    amountLabel: { fontSize: 14, color: colors.textLight, marginBottom: 8 },
    amountValue: { fontSize: 48, fontWeight: "bold", color: colors.merchant },
    infoCard: {
      flexDirection: "row",
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
      gap: 12,
    },
    infoIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.student + "20",
      alignItems: "center",
      justifyContent: "center",
    },
    infoDetails: { flex: 1 },
    infoLabel: { fontSize: 12, color: colors.textLight },
    infoValue: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 2,
    },
    infoSubvalue: { fontSize: 12, color: colors.textLight, marginTop: 2 },
    detailsSection: {
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    detailLabel: { fontSize: 13, color: colors.textLight },
    detailValue: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      maxWidth: "60%",
      textAlign: "right",
    },
    confirmButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.merchant,
      padding: 18,
      borderRadius: 12,
      gap: 10,
    },
    confirmButtonText: { fontSize: 20, fontWeight: "bold", color: "#fff" },
    successScreen: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      margin: 20,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.success,
      marginTop: 16,
    },
    successAmount: {
      fontSize: 44,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 12,
    },
    successText: {
      fontSize: 14,
      color: colors.textLight,
      marginTop: 8,
      textAlign: "center",
    },
  });
