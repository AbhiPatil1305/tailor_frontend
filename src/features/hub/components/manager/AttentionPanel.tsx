import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export interface AttentionItem {
  id: string;
  icon: string;
  label: string;
  count: number;
  severity: 'critical' | 'warning' | 'info';
  onPress?: () => void;
}

interface Props {
  items: AttentionItem[];
}

const SEVERITY_COLORS = {
  critical: { bg: '#fef2f2', border: '#fca5a5', icon: '#dc2626', text: '#7f1d1d' },
  warning:  { bg: '#fff7ed', border: '#fdba74', icon: '#ea580c', text: '#7c2d12' },
  info:     { bg: '#fffbeb', border: '#fcd34d', icon: '#d97706', text: '#78350f' },
};

export const AttentionPanel = ({ items }: Props) => {
  const activeItems = items.filter(i => i.count > 0);

  if (activeItems.length === 0) {
    return (
      <View style={styles.allGood}>
        <Text style={styles.allGoodIcon}>✅</Text>
        <Text style={styles.allGoodText}>All caught up! No items need attention.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>⚡ ATTENTION REQUIRED</Text>
      {activeItems.map(item => {
        const colors = SEVERITY_COLORS[item.severity];
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.item, { backgroundColor: colors.bg, borderColor: colors.border }]}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <Text style={[styles.itemIcon, { color: colors.icon }]}>{item.icon}</Text>
            <Text style={[styles.itemLabel, { color: colors.text }]}>
              <Text style={styles.itemCount}>{item.count} </Text>
              {item.label}
            </Text>
            <Text style={[styles.chevron, { color: colors.icon }]}>›</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 14 },
  item: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 8, gap: 10 },
  itemIcon: { fontSize: 18, width: 24 },
  itemLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  itemCount: { fontWeight: '800' },
  chevron: { fontSize: 20, fontWeight: '300' },
  allGood: { backgroundColor: '#f0fdf4', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, flexDirection: 'row', gap: 12 },
  allGoodIcon: { fontSize: 24 },
  allGoodText: { flex: 1, color: '#16a34a', fontWeight: '600', fontSize: 14 },
});
