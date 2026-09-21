import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';

interface Props {
  label: string;
  variant?: StatusVariant;
  size?: 'sm' | 'md';
}

const COLORS: Record<StatusVariant, { bg: string; text: string }> = {
  success: { bg: '#dcfce7', text: '#16a34a' },
  warning: { bg: '#fef3c7', text: '#d97706' },
  danger:  { bg: '#fee2e2', text: '#dc2626' },
  info:    { bg: '#dbeafe', text: '#2563eb' },
  neutral: { bg: '#f1f5f9', text: '#475569' },
  purple:  { bg: '#ede9fe', text: '#7c3aed' },
};

export const StatusBadge = ({ label, variant = 'neutral', size = 'sm' }: Props) => {
  const c = COLORS[variant];
  return (
    <View style={[s.badge, { backgroundColor: c.bg }, size === 'md' && s.badgeMd]}>
      <Text style={[s.text, { color: c.text }, size === 'md' && s.textMd]}>{label}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeMd: { paddingHorizontal: 14, paddingVertical: 6 },
  text: { fontSize: 11, fontWeight: '700' },
  textMd: { fontSize: 13 },
});
