import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { SPACING, RADIUS, FONT_SIZE } from "../../constants/DesignTokens";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error ? styles.inputError : undefined]}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            ...(icon ? [styles.inputWithIcon] : []),
            ...(style ? [style] : []),
          ]}
          placeholderTextColor={colors.textLight}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZE.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZE.bodyLarge,
    color: colors.text,
  },
  inputWithIcon: {
    paddingLeft: SPACING.xs,
  },
  iconContainer: {
    paddingLeft: SPACING.md,
  },
  errorText: {
    color: colors.danger,
    fontSize: FONT_SIZE.caption,
    marginTop: SPACING.xxs,
    marginLeft: SPACING.xxs,
  },
});
