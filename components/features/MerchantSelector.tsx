import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, MERCHANT_CATEGORIES } from '../../constants/Config';

interface MerchantSelectorProps {
  selectedMerchant: string;
  onSelect: (merchantId: string) => void;
}

export default function MerchantSelector({
  selectedMerchant,
  onSelect,
}: MerchantSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Merchant</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {Object.entries(MERCHANT_CATEGORIES).map(([key, name]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.chip,
              selectedMerchant === key && styles.chipSelected,
            ]}
            onPress={() => onSelect(key)}
          >
            <Text
              style={[
                styles.chipText,
                selectedMerchant === key && styles.chipTextSelected,
              ]}
            >
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  scrollContent: {
    paddingRight: 20,
  },
  chip: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
