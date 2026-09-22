import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OfflineBannerProps {
  visible: boolean;
  pendingCount?: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ visible, pendingCount = 0 }) => {
  if (!visible) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚠</Text>
      <Text style={styles.text}>
        Offline{pendingCount > 0 ? ` — ${pendingCount} action${pendingCount !== 1 ? 's' : ''} pending sync` : ' — changes will sync when connected'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: { fontSize: 14, marginRight: 8 },
  text: { fontSize: 13, color: '#92400e', fontWeight: '600', flex: 1 },
});
