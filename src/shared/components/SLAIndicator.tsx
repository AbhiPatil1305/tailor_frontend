import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ApiClient as MockApi } from '../../infrastructure/api/ApiClient';

interface Props { slaDeadline?: string; compact?: boolean; }

export const SLAIndicator = ({ slaDeadline, compact = false }: Props) => {
  if (!slaDeadline) return null;
  const sla = MockApi.getSlaStatus(slaDeadline);
  return (
    <View style={[s.container, { backgroundColor: sla.color + '18' }, compact && s.compact]}>
      <Text style={s.icon}>⏱</Text>
      <Text style={[s.label, { color: sla.color }]}>{sla.label}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4, alignSelf: 'flex-start' },
  compact: { paddingHorizontal: 8, paddingVertical: 4 },
  icon: { fontSize: 12 },
  label: { fontSize: 12, fontWeight: '700' },
});
