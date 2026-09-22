import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UserStatusBadgeProps {
  status: string;
  type?: 'account' | 'operational';
}

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status, type = 'account' }) => {
  const norm = (status || '').toUpperCase();

  let bg = '#e2e8f0';
  let text = '#475569';

  if (norm === 'ACTIVE') {
    bg = '#dcfce7';
    text = '#15803d';
  } else if (norm === 'PENDING_ACTIVATION') {
    bg = '#fef3c7';
    text = '#b45309';
  } else if (norm === 'INACTIVE') {
    bg = '#fee2e2';
    text = '#b91c1c';
  } else if (norm === 'AVAILABLE') {
    bg = '#dbeafe';
    text = '#1d4ed8';
  } else if (norm === 'DELIVERING' || norm === 'BUSY') {
    bg = '#f3e8ff';
    text = '#6b21a8';
  } else if (norm === 'ON_LEAVE') {
    bg = '#ffedd5';
    text = '#c2410c';
  }

  const label = norm.replace('_', ' ');

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
