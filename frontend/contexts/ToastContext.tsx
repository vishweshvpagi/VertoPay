import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Text, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


export type ToastType = 'success' | 'error' | 'info';


export interface ToastData {
  type: ToastType;
  text1: string;
  text2?: string;
}


interface ToastContextType {
  show: (opts: ToastData) => void;
  success: (text1: string, text2?: string) => void;
  error: (text1: string, text2?: string) => void;
  info: (text1: string, text2?: string) => void;
}


const ToastContext = createContext<ToastContextType | null>(null);


const TOAST_DURATION = 3500;


export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();


  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setToast(null));
  }, [opacity, translateY]);


  const show = useCallback(
    (opts: ToastData) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast(opts);
      opacity.setValue(0);
      translateY.setValue(-100);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
      timeoutRef.current = setTimeout(hide, TOAST_DURATION);
    },
    [opacity, translateY, hide]
  );


  // Helper methods for convenience
  const success = useCallback(
    (text1: string, text2?: string) => {
      show({ type: 'success', text1, text2 });
    },
    [show]
  );


  const error = useCallback(
    (text1: string, text2?: string) => {
      show({ type: 'error', text1, text2 });
    },
    [show]
  );


  const info = useCallback(
    (text1: string, text2?: string) => {
      show({ type: 'info', text1, text2 });
    },
    [show]
  );


  const colors = {
    success: '#10B981',
    error: '#EF4444',
    info: '#6366F1',
  };


  return (
    <ToastContext.Provider value={{ show, success, error, info }}>
      {children}
      {toast && (
        <Animated.View
          style={[
            styles.toast,
            {
              backgroundColor: colors[toast.type],
              opacity,
              transform: [{ translateY }],
              top: Platform.select({
                ios: insets.top + 10,
                android: insets.top + 10,
                web: 60,
                default: 60,
              }),
            },
          ]}
          pointerEvents="box-none"
        >
          <Text style={styles.text1} numberOfLines={1}>
            {toast.text1}
          </Text>
          {toast.text2 ? (
            <Text style={styles.text2} numberOfLines={2}>
              {toast.text2}
            </Text>
          ) : null}
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}


export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}


const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
      web: {
        position: 'fixed' as any,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      },
    }),
  },
  text1: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  text2: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.95)',
    marginTop: 4,
    lineHeight: 18,
  },
});
