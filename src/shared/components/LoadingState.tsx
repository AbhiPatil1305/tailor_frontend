import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface Props { message?: string; }

export const LoadingState = ({ message = 'Loading...' }: Props) => (
  <View style={s.container}>
    <ActivityIndicator size="large" color="#1e293b" />
    <Text style={s.text}>{message}</Text>
  </View>
);

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  text: { fontSize: 15, color: '#64748b', fontWeight: '500' },
});
