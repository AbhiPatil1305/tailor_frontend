import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { Tailor } from '../../../../domain/models/types';
import { FilterBar } from '../../components/manager/FilterBar';

type StatusFilter = 'all' | 'available' | 'busy' | 'on-leave';

const STATUS_COLORS = {
  available: { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  busy:      { bg: '#fffbeb', text: '#d97706', border: '#fcd34d' },
  'on-leave':{ bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
};

const SummaryCard = ({ label, value, color }: { label: string; value: string | number; color: string }) => (
  <View style={[sumStyles.card, { borderTopColor: color }]}>
    <Text style={[sumStyles.value, { color }]}>{value}</Text>
    <Text style={sumStyles.label}>{label}</Text>
  </View>
);

const sumStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderTopWidth: 3, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  value: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  label: { fontSize: 10, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' },
});

export const ManagerTailorListScreen = () => {
  const { hubId } = useAuth();
  const navigation = useNavigation<any>();

  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const load = useCallback(async () => {
    try {
      const data = await ApiClient.getTailors(hubId || undefined);
      setTailors(data);
    } catch { setTailors([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [hubId]);

  useEffect(() => { load(); }, [load]);

  const filtered = statusFilter === 'all' ? tailors : tailors.filter(t => t.status === statusFilter);
  const available = tailors.filter(t => t.status === 'available').length;
  const busy      = tailors.filter(t => t.status === 'busy').length;
  const onLeave   = tailors.filter(t => t.status === 'on-leave').length;
  const totalCap  = tailors.reduce((s, t) => s + t.capacityPerDay, 0);
  const assignedToday = tailors.reduce((s, t) => s + t.assignedToday, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7c3aed" />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Tailors</Text>
          <Text style={styles.count}>{tailors.length} registered</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.sumRow}>
          <SummaryCard label="Available"      value={available}     color="#16a34a" />
          <SummaryCard label="Busy"           value={busy}          color="#d97706" />
          <SummaryCard label="On Leave"       value={onLeave}       color="#dc2626" />
          <SummaryCard label="Capacity"       value={`${assignedToday}/${totalCap}`} color="#7c3aed" />
        </View>

        {/* Filter */}
        <View style={styles.filterWrap}>
          <FilterBar
            options={[
              { key: 'all' as StatusFilter,      label: 'All' },
              { key: 'available' as StatusFilter, label: 'Available' },
              { key: 'busy' as StatusFilter,      label: 'Busy' },
              { key: 'on-leave' as StatusFilter,  label: 'On Leave' },
            ]}
            selected={statusFilter}
            onSelect={setStatusFilter}
          />
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color="#7c3aed" /></View>
        ) : (
          <View style={styles.list}>
            {filtered.map(t => {
              const sc = STATUS_COLORS[t.status] ?? STATUS_COLORS.busy;
              const remaining = t.capacityPerDay - t.assignedToday;
              const utilPct = Math.min(100, (t.assignedToday / t.capacityPerDay) * 100);
              return (
                <TouchableOpacity
                  key={t.id}
                  style={styles.card}
                  onPress={() => navigation.navigate('MGRTailorDetail', { tailorId: t.id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{t.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.name}>{t.name}</Text>
                      <Text style={styles.spec}>{t.specialisations.join(', ')}</Text>
                      <Text style={styles.gender}>{t.gender} specialist</Text>
                    </View>
                    <View>
                      <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                        <Text style={[styles.statusText, { color: sc.text }]}>{t.status.toUpperCase()}</Text>
                      </View>
                      <Text style={styles.rating}>{'★'.repeat(Math.round(t.rating))} {t.rating.toFixed(1)}</Text>
                    </View>
                  </View>

                  {/* Capacity bar */}
                  <View style={styles.capacityRow}>
                    <Text style={styles.capacityLabel}>Capacity: {t.assignedToday}/{t.capacityPerDay}</Text>
                    <Text style={styles.remaining}>{remaining} remaining</Text>
                  </View>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, {
                      width: `${utilPct}%` as any,
                      backgroundColor: utilPct > 80 ? '#dc2626' : utilPct > 60 ? '#f97316' : '#16a34a',
                    }]} />
                  </View>
                </TouchableOpacity>
              );
            })}

            {filtered.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🧵</Text>
                <Text style={styles.emptyText}>No tailors found</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  count: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  sumRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  filterWrap: { paddingHorizontal: 20, marginBottom: 12 },
  centered: { padding: 60, alignItems: 'center' },
  list: { padding: 20, paddingTop: 4, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 14 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 22, fontWeight: '900', color: '#7c3aed' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  spec: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  gender: { fontSize: 11, color: '#8b5cf6', fontWeight: '600', textTransform: 'capitalize' },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-end', marginBottom: 4 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  rating: { fontSize: 12, color: '#f59e0b', fontWeight: '700', textAlign: 'right' },
  capacityRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  capacityLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  remaining: { fontSize: 12, color: '#16a34a', fontWeight: '700' },
  barBg: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#64748b' },
});
