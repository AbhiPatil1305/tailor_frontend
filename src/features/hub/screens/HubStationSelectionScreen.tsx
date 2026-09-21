import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const STATIONS = [
  { id: 'cutting', name: 'Cutting', icon: '✂️', receives: 'intake', description: 'Receive intake garments and cut them.' },
  { id: 'stitching', name: 'Stitching', icon: '🪡', receives: 'cutting', description: 'Handoff to tailor for stitching.' },
  { id: 'qc', name: 'QC', icon: '🔍', receives: 'stitching', description: 'Quality control (Pass/Rework).' },
  { id: 'ironing', name: 'Ironing & Packing', icon: '📦', receives: 'qc', description: 'Iron and pack QC passed garments.' },
  { id: 'dispatch', name: 'Dispatch', icon: '🚚', receives: 'packed', description: 'Dispatch packed garments to rider.' },
];

export const HubStationSelectionScreen = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <Text style={s.title}>Hub Stations</Text>
          <Text style={s.subtitle}>Select your active station</Text>
        </View>

        <View style={s.grid}>
          {STATIONS.map((station) => (
            <TouchableOpacity
              key={station.id}
              style={s.card}
              onPress={() => navigation.navigate('StationDetail', { station })}
            >
              <Text style={s.icon}>{station.icon}</Text>
              <Text style={s.cardTitle}>{station.name}</Text>
              <Text style={s.cardDesc}>{station.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 20 },
  header: { marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 4 },
  grid: { gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  icon: { fontSize: 40, marginBottom: 12 },
  cardTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#64748b', lineHeight: 20 },
});
