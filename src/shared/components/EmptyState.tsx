import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  icon?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState = ({ icon = '📭', title, subtitle, actionLabel, onAction }: Props) => (
  <View style={s.container}>
    <Text style={s.icon}>{icon}</Text>
    <Text style={s.title}>{title}</Text>
    {subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
    {actionLabel && onAction && (
      <TouchableOpacity style={s.btn} onPress={onAction}>
        <Text style={s.btnText}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  icon: { fontSize: 52, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btn: { backgroundColor: '#1e293b', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
