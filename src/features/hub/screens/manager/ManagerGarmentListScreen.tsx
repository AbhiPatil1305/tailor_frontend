import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { Garment, GarmentStage, GenderCategory } from '../../../../domain/models/types';
import { FilterBar } from '../../components/manager/FilterBar';
import { SLABadge } from '../../components/manager/SLABadge';

type GenderFilter = 'all' | GenderCategory;
type StageFilter = 'all' | GarmentStage;

const GENDER_OPTIONS = [
  { key: 'all' as GenderFilter,    label: 'All' },
  { key: 'ladies' as GenderFilter, label: 'Ladies' },
  { key: 'gents' as GenderFilter,  label: 'Gents' },
  { key: 'kids' as GenderFilter,   label: 'Kids' },
  { key: 'unisex' as GenderFilter, label: 'Unisex' },
];

const STAGE_OPTIONS = [
  { key: 'all' as StageFilter,       label: 'All Stages' },
  { key: 'intake' as StageFilter,    label: 'Intake' },
  { key: 'cutting' as StageFilter,   label: 'Cutting' },
  { key: 'stitching' as StageFilter, label: 'Stitching' },
  { key: 'qc' as StageFilter,        label: 'QC' },
  { key: 'rework' as StageFilter,    label: 'Rework' },
  { key: 'ironing' as StageFilter,   label: 'Ironing' },
  { key: 'packed' as StageFilter,    label: 'Packed' },
  { key: 'dispatched' as StageFilter, label: 'Dispatch' },
];

const STAGE_COLORS: Record<string, string> = {
  intake: '#6366f1', cutting: '#8b5cf6', stitching: '#a855f7', qc: '#ec4899',
  rework: '#dc2626', ironing: '#f97316', packed: '#10b981', dispatched: '#0ea5e9',
  out_for_delivery: '#0284c7', delivered: '#16a34a',
};

function getSlaUrgency(g: Garment): 'overdue' | 'at_risk' | 'normal' {
  if (!g.slaDeadline) return 'normal';
  const h = (new Date(g.slaDeadline).getTime() - Date.now()) / 3_600_000;
  if (h < 0) return 'overdue';
  if (h < 2) return 'at_risk';
  return 'normal';
}

const GarmentRow = ({ garment, onPress }: { garment: Garment; onPress: () => void }) => {
  const urgency = getSlaUrgency(garment);
  const stageColor = STAGE_COLORS[garment.stage] ?? '#64748b';
  return (
    <TouchableOpacity
      style={[
        rowStyles.row,
        urgency === 'overdue' && rowStyles.rowOverdue,
        urgency === 'at_risk' && rowStyles.rowAtRisk,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={rowStyles.main}>
        <View style={rowStyles.topLine}>
          <Text style={rowStyles.garmentId} numberOfLines={1}>{garment.qrCode}</Text>
          <View style={[rowStyles.stageBadge, { backgroundColor: stageColor + '20', borderColor: stageColor }]}>
            <Text style={[rowStyles.stageText, { color: stageColor }]}>{garment.stage.toUpperCase()}</Text>
          </View>
        </View>
        <View style={rowStyles.bottomLine}>
          <Text style={rowStyles.type}>{garment.type} · {garment.gender}</Text>
          {garment.assignedTailorId
            ? <Text style={rowStyles.tailor}>🧵 Assigned</Text>
            : <Text style={rowStyles.unassigned}>⚠️ Unassigned</Text>
          }
        </View>
      </View>
      <SLABadge garment={garment} compact />
    </TouchableOpacity>
  );
};

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  rowOverdue: { borderLeftWidth: 4, borderLeftColor: '#dc2626', backgroundColor: '#fef2f2' },
  rowAtRisk:  { borderLeftWidth: 4, borderLeftColor: '#ea580c', backgroundColor: '#fff7ed' },
  main: { flex: 1, marginRight: 12 },
  topLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  garmentId: { flex: 1, fontSize: 14, fontWeight: '700', color: '#1e293b', fontFamily: 'Courier New' },
  stageBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  stageText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  bottomLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  type: { fontSize: 12, color: '#64748b', textTransform: 'capitalize' },
  tailor: { fontSize: 12, color: '#64748b' },
  unassigned: { fontSize: 12, color: '#ea580c', fontWeight: '600' },
});

export const ManagerGarmentListScreen = () => {
  const { hubId } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [search, setSearch] = useState('');

  const loadGarments = useCallback(async () => {
    try {
      setError(null);
      const data = await ApiClient.getGarments({
        hubId: hubId || undefined,
        stage: stageFilter !== 'all' ? stageFilter : undefined,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
      });
      setGarments(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hubId, stageFilter, genderFilter]);

  useEffect(() => { loadGarments(); }, [loadGarments]);
  const onRefresh = () => { setRefreshing(true); loadGarments(); };

  const filtered = search
    ? garments.filter(g =>
        g.qrCode.toLowerCase().includes(search.toLowerCase()) ||
        g.orderId.toLowerCase().includes(search.toLowerCase()) ||
        g.type.toLowerCase().includes(search.toLowerCase())
      )
    : garments;

  // Sort: overdue first, then at-risk, then normal
  const sorted = [...filtered].sort((a, b) => {
    const urgencyOrder = { overdue: 0, at_risk: 1, normal: 2 };
    return urgencyOrder[getSlaUrgency(a)] - urgencyOrder[getSlaUrgency(b)];
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Garments</Text>
        <Text style={styles.count}>{sorted.length} items</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by garment ID, order, type..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Gender filter */}
      <View style={styles.filterWrap}>
        <FilterBar options={GENDER_OPTIONS} selected={genderFilter} onSelect={setGenderFilter} />
      </View>

      {/* Stage filter */}
      <View style={styles.filterWrap}>
        <FilterBar options={STAGE_OPTIONS} selected={stageFilter} onSelect={setStageFilter} accentColor="#6366f1" />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#7c3aed" /></View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadGarments}>
            <Text style={styles.retryText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={g => g.id}
          renderItem={({ item }) => (
            <GarmentRow
              garment={item}
              onPress={() => navigation.navigate('MGRGarmentDetail', { garmentId: item.id })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>👕</Text>
              <Text style={styles.emptyText}>No garments found</Text>
              <Text style={styles.emptySub}>Try adjusting your filters</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  count: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 20, marginBottom: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1e293b', paddingVertical: 12 },
  clearBtn: { fontSize: 14, color: '#94a3b8', padding: 4 },
  filterWrap: { paddingHorizontal: 20, marginBottom: 8 },
  list: { padding: 20, paddingTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { color: '#dc2626', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 24 },
  retryText: { color: '#fff', fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b' },
});
