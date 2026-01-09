import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../constants/Config';

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
  padding = 16,
  margin = 0,
  elevation = 2,
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          padding,
          margin,
          elevation,
          shadowOpacity: elevation * 0.1,
          shadowRadius: elevation * 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});
