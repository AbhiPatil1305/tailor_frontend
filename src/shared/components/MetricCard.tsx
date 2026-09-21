import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  value: string | number;
  color?: string;
  icon?: string;
}

export const MetricCard = ({ label, value, color = '#1e293b', icon }: Props) => (
  <View style={[s.card, { borderTopColor: color }]}>
    {icon && <Text style={s.icon}>{icon}</Text>}
    <Text style={[s.value, { color }]}>{value}</Text>
    <Text style={s.label}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  card: { flex: 1, minWidth: 100, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderTopWidth: 3, elevation: 2 },
  icon: { fontSize: 20, marginBottom: 8 },
  value: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  label: { fontSize: 12, color: '#64748b', fontWeight: '600' },
});
