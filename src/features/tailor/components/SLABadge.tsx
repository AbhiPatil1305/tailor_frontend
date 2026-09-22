import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type SLAStatus = 'ON_TIME' | 'AT_RISK' | 'OVERDUE';

interface SLABadgeProps {
  status: SLAStatus;
  dueAt?: string;
  compact?: boolean;
}

export const SLABadge: React.FC<SLABadgeProps> = ({ status, dueAt, compact = false }) => {
  const config = {
    ON_TIME:  { bg: '#dcfce7', text: '#15803d', label: '● On Time' },
    AT_RISK:  { bg: '#fef3c7', text: '#b45309', label: '⚠ At Risk' },
    OVERDUE:  { bg: '#fee2e2', text: '#b91c1c', label: '🔴 Overdue' },
  }[status] || { bg: '#f1f5f9', text: '#64748b', label: status };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, compact && styles.compact]}>
      <Text style={[styles.text, { color: config.text }, compact && styles.compactText]}>
        {config.label}
      </Text>
      {dueAt && !compact && (
        <Text style={[styles.sub, { color: config.text }]}>Due: {dueAt}</Text>
      )}
    </View>
  );
};

export const getSLAStatus = (dueAtISO?: string): SLAStatus => {
  if (!dueAtISO) return 'ON_TIME';
  const due = new Date(dueAtISO);
  const now = new Date();
  const remainingHours = (due.getTime() - now.getTime()) / 3600000;
  if (remainingHours < 0) return 'OVERDUE';
  if (remainingHours < 4) return 'AT_RISK';
  return 'ON_TIME';
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  compact: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginBottom: 0,
  },
  text: { fontSize: 13, fontWeight: '700' },
  compactText: { fontSize: 11 },
  sub: { fontSize: 11, marginTop: 2 },
});
