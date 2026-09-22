import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { Garment, GarmentStage } from '../../../../domain/models/types';
import { FilterBar } from '../../components/manager/FilterBar';
import { SLABadge } from '../../components/manager/SLABadge';

type QueueStage = 'cutting' | 'stitching' | 'qc' | 'ironing' | 'dispatched';

const QUEUE_TABS: { key: QueueStage; label: string; color: string }[] = [
  { key: 'cutting',   label: 'Cutting',   color: '#8b5cf6' },
  { key: 'stitching', label: 'Stitching', color: '#a855f7' },
  { key: 'qc',        label: 'QC',        color: '#ec4899' },
  { key: 'ironing',   label: 'Ironing',   color: '#f97316' },
  { key: 'dispatched',label: 'Dispatch',  color: '#0ea5e9' },
];

function waitingTime(g: Garment): string {
  const ref = g.intakeTime || g.createdAt;
  if (!ref) return '—';
  const hrs = (Date.now() - new Date(ref).getTime()) / 3_600_000;
  if (hrs < 1) return `${Math.round(hrs * 60)}m`;
  return `${hrs.toFixed(1)}h`;
}

export const ManagerQueueScreen = () => {
  const { hubId } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const defaultStage = (route.params?.defaultStage as QueueStage) ?? 'cutting';
  const [activeStage, setActiveStage] = useState<QueueStage>(defaultStage);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ApiClient.getGarments({ hubId: hubId || undefined, stage: activeStage });
      setGarments(data);
    } catch { setGarments([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [hubId, activeStage]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const stageInfo = QUEUE_TABS.find(t => t.key === activeStage)!;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Station Queue</Text>
        <View style={[styles.countBadge, { backgroundColor: stageInfo.color + '20' }]}>
          <Text style={[styles.countText, { color: stageInfo.color }]}>{garments.length}</Text>
        </View>
      </View>

      <View style={styles.filterWrap}>
        <FilterBar
          options={QUEUE_TABS.map(t => ({ key: t.key, label: t.label, count: undefined }))}
          selected={activeStage}
          onSelect={setActiveStage}
          accentColor={stageInfo.color}
        />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#7c3aed" /></View>
      ) : (
        <FlatList
          data={garments}
          keyExtractor={g => g.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7c3aed" />}
          contentContainerStyle={styles.list}
          renderItem={({ item: g }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('MGRGarmentDetail', { garmentId: g.id })}
              activeOpacity={0.8}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.garmentId}>{g.qrCode}</Text>
                <Text style={styles.meta}>{g.type} · {g.gender}</Text>
                <Text style={styles.waiting}>⏱ {waitingTime(g)} waiting</Text>
                {g.assignedTailorId
                  ? <Text style={styles.tailor}>🧵 Assigned</Text>
                  : <Text style={styles.unassigned}>⚠️ Not assigned</Text>
                }
              </View>
              <SLABadge garment={g} compact />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>Queue is empty</Text>
              <Text style={styles.emptySub}>No garments in {activeStage}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { flex: 1, fontSize: 26, fontWeight: '900', color: '#1e293b' },
  countBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  countText: { fontSize: 16, fontWeight: '800' },
  filterWrap: { paddingHorizontal: 20, marginBottom: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingTop: 4 },
  row: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  rowLeft: { flex: 1, marginRight: 12 },
  garmentId: { fontSize: 14, fontWeight: '700', color: '#1e293b', fontFamily: 'Courier New', marginBottom: 3 },
  meta: { fontSize: 12, color: '#64748b', textTransform: 'capitalize', marginBottom: 3 },
  waiting: { fontSize: 12, color: '#f97316', fontWeight: '600' },
  tailor: { fontSize: 12, color: '#64748b', marginTop: 2 },
  unassigned: { fontSize: 12, color: '#ea580c', fontWeight: '600', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textTransform: 'capitalize' },
});
