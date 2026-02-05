import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { SPACING, RADIUS } from '../../constants/DesignTokens';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
  margin?: number;
  elevation?: number;
}

export default function Card({
  children,
  style,
  padding = SPACING.md,
  margin = 0,
  elevation = 2,
}: CardProps) {
  const { colors } = useTheme();
  const shadowElevation = Math.min(Math.max(elevation, 1), 6);
  const styles = getStyles(colors, shadowElevation);
  return (
    <View
      style={[
        styles.card,
        { padding, margin },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const getStyles = (colors: any, elevation: number) => StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: colors.borderLight || colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: elevation * 0.06,
        shadowRadius: elevation * 3,
      },
      android: {
        elevation: Math.min(elevation + 1, 8),
      },
    }),
  },
});
