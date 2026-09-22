import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Availability = 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';

interface AvailabilityBadgeProps {
  status: Availability;
  large?: boolean;
}

export const AvailabilityBadge: React.FC<AvailabilityBadgeProps> = ({ status, large = false }) => {
  const config = {
    AVAILABLE: { dot: '#10b981', label: 'Available',  bg: '#dcfce7', text: '#15803d' },
    BUSY:      { dot: '#f59e0b', label: 'Busy',       bg: '#fef3c7', text: '#b45309' },
    ON_LEAVE:  { dot: '#94a3b8', label: 'On Leave',   bg: '#f1f5f9', text: '#475569' },
  }[status] || { dot: '#94a3b8', label: status, bg: '#f1f5f9', text: '#475569' };

  return (
    <View style={[styles.row, { backgroundColor: config.bg }, large && styles.rowLarge]}>
      <View style={[styles.dot, { backgroundColor: config.dot }, large && styles.dotLarge]} />
      <Text style={[styles.label, { color: config.text }, large && styles.labelLarge]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  rowLarge: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  dotLarge: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
  label: { fontSize: 12, fontWeight: '700' },
  labelLarge: { fontSize: 15, fontWeight: '800' },
});
