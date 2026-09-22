import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../core/auth/AuthContext';
import { ApiClient as MockApi } from '../../../infrastructure/api/ApiClient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export const HubStaffDashboardScreen = () => {
  const { userName, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    const m = await MockApi.getDashboardMetrics('h1'); // Hardcoded to h1 for demo
    setMetrics(m);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  const STATIONS = [
    { id: 'cutting', name: '✂ CUTTING', receives: 'intake' },
    { id: 'stitching', name: '🪡 STITCHING', receives: 'cutting' },
    { id: 'qc', name: '🔍 QC', receives: 'stitching' },
    { id: 'ironing', name: '📦 IRONING & PACKING', receives: 'qc' },
    { id: 'dispatch', name: '🚚 DISPATCH', receives: 'packed' },
  ];

  if (loading || !metrics) return (
    <SafeAreaView style={s.safe}><ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} /></SafeAreaView>
  );

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.header}>
          <View>
            <Text style={s.title}>TAILOR24</Text>
            <Text style={s.subtitle}>Hub: Bidar Central Hub</Text>
          </View>
          <View style={s.headerRight}>
            <View style={s.statusDot} />
            <Text style={s.staffName}>{userName}</Text>
          </View>
        </View>

        {/* Global Scan Button */}
        <TouchableOpacity style={s.scanBtn} onPress={() => navigation.navigate('ScanRoot')}>
          <Text style={s.scanIcon}>📷</Text>
          <Text style={s.scanText}>SCAN GARMENT QR</Text>
        </TouchableOpacity>

        <Text style={s.sectionTitle}>TODAY'S OVERVIEW</Text>
        <View style={s.metricsGrid}>
          <View style={s.metricCard}>
            <Text style={s.metricValue}>{metrics.inProduction}</Text>
            <Text style={s.metricLabel}>Garments in production</Text>
          </View>
          <View style={s.metricCard}>
            <Text style={s.metricValue}>{metrics.deliveredToday}</Text>
            <Text style={s.metricLabel}>Completed today</Text>
          </View>
          <View style={[s.metricCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
            <Text style={[s.metricValue, { color: '#b45309' }]}>--</Text>
            <Text style={[s.metricLabel, { color: '#b45309' }]}>Awaiting action</Text>
          </View>
          <View style={[s.metricCard, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Text style={[s.metricValue, { color: '#b91c1c' }]}>{metrics.atRisk}</Text>
            <Text style={[s.metricLabel, { color: '#b91c1c' }]}>At risk</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>STATION QUEUES</Text>
        {STATIONS.map((st) => (
          <View key={st.id} style={s.stationCard}>
            <View style={s.stationTop}>
              <Text style={s.stationName}>{st.name}</Text>
              <Text style={s.stationCount}>{metrics.stageQueues[st.receives] || 0} garments waiting</Text>
            </View>
            <TouchableOpacity
              style={s.openQueueBtn}
              onPress={() => {
                // Navigate to Queue tab, specifically to this station's filter
                navigation.navigate('QueueRoot', { stationId: st.id });
              }}
            >
              <Text style={s.openQueueText}>OPEN {st.id.toUpperCase()} QUEUE</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '900', color: '#1e293b', letterSpacing: 1 },
  subtitle: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6 },
  staffName: { fontSize: 13, fontWeight: '700', color: '#334155' },
  
  scanBtn: { backgroundColor: '#3b82f6', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 24, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  scanIcon: { fontSize: 28, marginRight: 12 },
  scanText: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 1 },

  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 12, marginLeft: 4 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 30 },
  metricCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  metricValue: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  metricLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 4 },

  stationCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', borderLeftWidth: 6, borderLeftColor: '#334155' },
  stationTop: { marginBottom: 16 },
  stationName: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  stationCount: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  openQueueBtn: { backgroundColor: '#f1f5f9', padding: 14, borderRadius: 8, alignItems: 'center' },
  openQueueText: { fontSize: 13, fontWeight: '800', color: '#334155', letterSpacing: 1 },
});
