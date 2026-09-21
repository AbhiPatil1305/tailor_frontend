import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ApiClient as MockApi } from '../../../infrastructure/api/ApiClient';
import { GarmentEvent } from '../../../domain/models/types';

export const EventHistoryScreen = () => {
  const [events, setEvents] = useState<GarmentEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    const evs = await MockApi.getAllEvents('h1');
    setEvents(evs.slice(0, 50)); // Last 50 events
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>EVENT LOG</Text>
      </View>
      <ScrollView contentContainerStyle={s.list}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : events.length === 0 ? (
          <Text style={s.empty}>No recent events.</Text>
        ) : (
          events.map(ev => (
            <View key={ev.id} style={s.card}>
              <View style={s.row}>
                <Text style={s.time}>{new Date(ev.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                <Text style={s.event}>{ev.eventType.replace(/_/g, ' ')}</Text>
              </View>
              <Text style={s.grmId}>Garment: {ev.garmentId}</Text>
              <Text style={s.user}>By: {ev.performedByRole}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 18, fontWeight: '900', color: '#1e293b', letterSpacing: 1 },
  list: { padding: 16, paddingBottom: 60 },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 40 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  time: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  event: { fontSize: 14, fontWeight: '900', color: '#10b981' },
  grmId: { fontSize: 13, fontFamily: 'Courier', color: '#334155', marginBottom: 4 },
  user: { fontSize: 12, color: '#94a3b8' },
});
