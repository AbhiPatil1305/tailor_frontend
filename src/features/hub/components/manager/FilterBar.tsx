import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export interface FilterOption<T extends string> {
  key: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  options: FilterOption<T>[];
  selected: T;
  onSelect: (key: T) => void;
  accentColor?: string;
}

export function FilterBar<T extends string>({ options, selected, onSelect, accentColor = '#7c3aed' }: Props<T>) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {options.map(opt => {
        const active = opt.key === selected;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, active && { backgroundColor: accentColor, borderColor: accentColor }]}
            onPress={() => onSelect(opt.key)}
            activeOpacity={0.8}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{opt.label}</Text>
            {opt.count !== undefined && (
              <View style={[styles.badge, active ? styles.badgeActive : {}]}>
                <Text style={[styles.badgeText, active && styles.badgeTextActive]}>{opt.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 8, paddingVertical: 4, paddingHorizontal: 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff' },
  label: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  labelActive: { color: '#fff' },
  badge: { backgroundColor: '#f1f5f9', borderRadius: 10, minWidth: 20, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center' },
  badgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  badgeTextActive: { color: '#fff' },
});
