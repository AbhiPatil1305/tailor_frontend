import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator,
  Alert, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';

// ── Stage display config ──────────────────────────────────────────────────────
const STAGE_MAP: Record<string, { label: string; color: string; next?: string }> = {
  INTAKE:               { label: 'Intake',     color: '#6366f1', next: 'CUTTING_STARTED' },
  CUTTING_STARTED:      { label: 'Cutting',    color: '#8b5cf6', next: 'STITCHING_STARTED' },
  CUTTING_COMPLETED:    { label: 'Cutting ✓',  color: '#7c3aed', next: 'STITCHING_STARTED' },
  STITCHING_ASSIGNED:   { label: 'Assigned',   color: '#a855f7', next: 'STITCHING_STARTED' },
  STITCHING_STARTED:    { label: 'Stitching',  color: '#a855f7', next: 'QC_STARTED' },
  STITCHING_COMPLETED:  { label: 'Stitching ✓',color: '#9333ea', next: 'QC_STARTED' },
  QC_STARTED:           { label: 'QC',         color: '#ec4899', next: 'QC_PASSED' },
  QC_PASSED:            { label: 'QC ✓',       color: '#db2777', next: 'IRONING_STARTED' },
  QC_REWORK:            { label: 'Rework',     color: '#dc2626', next: 'STITCHING_STARTED' },
  IRONING_STARTED:      { label: 'Ironing',    color: '#f97316', next: 'PACKED' },
  IRONING_COMPLETED:    { label: 'Ironing ✓',  color: '#ea580c', next: 'PACKED' },
  PACKED:               { label: 'Packed',     color: '#10b981', next: 'DISPATCHED' },
  DISPATCHED:           { label: 'Dispatched', color: '#0ea5e9', next: 'OUT_FOR_DELIVERY' },
  OUT_FOR_DELIVERY:     { label: 'On the Way', color: '#0284c7', next: 'DELIVERED' },
  DELIVERED:            { label: 'Delivered',  color: '#16a34a' },
};

const PIPELINE_STEPS = [
  'CUTTING_STARTED', 'STITCHING_STARTED', 'QC_STARTED', 'IRONING_STARTED', 'PACKED', 'DISPATCHED',
];

function stageIndex(stage: string): number {
  return PIPELINE_STEPS.findIndex(s => (stage || '').includes(s.split('_')[0]));
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Garment row ───────────────────────────────────────────────────────────────
const GarmentRow = ({
  garment,
  onAdvance,
  advancing,
}: {
  garment: any;
  onAdvance: (garment: any, next: string) => void;
  advancing: boolean;
}) => {
  const stage = garment.currentStage || 'CUTTING_STARTED';
  const info = STAGE_MAP[stage] || { label: stage, color: '#64748b' };
  const nextStage = info.next;

  return (
    <View style={grmStyles.row}>
      <View style={grmStyles.left}>
        <Text style={grmStyles.qr}>{garment.qrCode || garment.garmentNumber || 'N/A'}</Text>
        <Text style={grmStyles.meta}>{garment.type} · {garment.gender}</Text>
      </View>
      <View style={[grmStyles.stagePill, { backgroundColor: info.color + '18', borderColor: info.color + '40' }]}>
        <Text style={[grmStyles.stageText, { color: info.color }]}>{info.label}</Text>
      </View>
      {nextStage && (
        <TouchableOpacity
          style={[grmStyles.advBtn, advancing && { opacity: 0.5 }]}
          onPress={() => onAdvance(garment, nextStage)}
          disabled={advancing}
          activeOpacity={0.75}
        >
          {advancing
            ? <ActivityIndicator size="small" color="#7c3aed" />
            : <Text style={grmStyles.advText}>→</Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );
};

const grmStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4, gap: 8 },
  left: { flex: 1 },
  qr: { fontSize: 12, fontWeight: '700', color: '#1e293b', fontFamily: 'Courier New' },
  meta: { fontSize: 11, color: '#64748b', textTransform: 'capitalize', marginTop: 1 },
  stagePill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  stageText: { fontSize: 11, fontWeight: '700' },
  advBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#7c3aed18', justifyContent: 'center', alignItems: 'center' },
  advText: { fontSize: 16, color: '#7c3aed', fontWeight: '900' },
});

// ── Order card ────────────────────────────────────────────────────────────────
const OrderCard = ({
  order,
  onAdvanceGarment,
  advancingId,
}: {
  order: any;
  onAdvanceGarment: (garment: any, next: string) => void;
  advancingId: string | null;
}) => {
  const [expanded, setExpanded] = useState(false);
  const garments: any[] = order.garments || [];

  const minIdx = garments.reduce((min, g) => {
    const idx = stageIndex(g.currentStage || '');
    return idx >= 0 && idx < min ? idx : min;
  }, PIPELINE_STEPS.length);

  const overallStage = minIdx >= 0 && minIdx < PIPELINE_STEPS.length
    ? PIPELINE_STEPS[minIdx]
    : garments[0]?.currentStage || 'CUTTING_STARTED';
  const overallInfo = STAGE_MAP[overallStage] || { label: overallStage, color: '#64748b' };
  const progress = Math.max((minIdx + 1) / PIPELINE_STEPS.length, 0.05);

  return (
    <View style={cardStyles.card}>
      <TouchableOpacity style={cardStyles.header} onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
        <View style={cardStyles.headerLeft}>
          <Text style={cardStyles.orderNum}>{order.orderNumber || ('…' + (order._id || '').slice(-6))}</Text>
          <Text style={cardStyles.customer}>👤 {order.customerName || 'Customer'}</Text>
          <Text style={cardStyles.date}>{formatDate(order.createdAt)}</Text>
        </View>
        <View style={cardStyles.headerRight}>
          <View style={[cardStyles.badge, { backgroundColor: overallInfo.color + '18' }]}>
            <Text style={[cardStyles.badgeText, { color: overallInfo.color }]}>{overallInfo.label}</Text>
          </View>
          <Text style={cardStyles.garmentCount}>{garments.length} garment{garments.length !== 1 ? 's' : ''}</Text>
          <Text style={cardStyles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={cardStyles.progressBg}>
        <View style={[cardStyles.progressFill, { width: `${progress * 100}%` as any, backgroundColor: overallInfo.color }]} />
      </View>

      {expanded && (
        <View style={cardStyles.garmentList}>
          <View style={cardStyles.divider} />
          {garments.length === 0 ? (
            <Text style={cardStyles.noGarments}>No garments found</Text>
          ) : (
            garments.map((g: any, i: number) => (
              <View key={g._id || g.id || String(i)}>
                {i > 0 && <View style={cardStyles.garmentDivider} />}
                <GarmentRow
                  garment={g}
                  onAdvance={onAdvanceGarment}
                  advancing={advancingId === (g._id || g.id)}
                />
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 16, paddingBottom: 10 },
  headerLeft: { flex: 1, marginRight: 12 },
  orderNum: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 3 },
  customer: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  date: { fontSize: 11, color: '#94a3b8' },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  garmentCount: { fontSize: 11, color: '#94a3b8' },
  chevron: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  progressBg: { height: 3, backgroundColor: '#f1f5f9', marginHorizontal: 16 },
  progressFill: { height: 3, borderRadius: 2 },
  garmentList: { paddingHorizontal: 16, paddingBottom: 12 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 8, marginTop: 4 },
  garmentDivider: { height: 1, backgroundColor: '#f8fafc', marginVertical: 2 },
  noGarments: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 16 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export const ManagerOrdersScreen = () => {
  const { hubId, userName } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState('ALL');

  const STAGE_FILTERS = [
    { key: 'ALL',        label: 'All' },
    { key: 'CUTTING',    label: 'Cutting' },
    { key: 'STITCHING',  label: 'Stitching' },
    { key: 'QC',         label: 'QC' },
    { key: 'IRONING',    label: 'Ironing' },
    { key: 'PACKED',     label: 'Packed' },
    { key: 'DISPATCHED', label: 'Dispatch' },
  ];

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await ApiClient.getOrders(hubId || undefined);
      setOrders(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hubId]);

  useEffect(() => { load(); }, [load]);

  const handleAdvanceGarment = async (garment: any, nextStage: string) => {
    const garmentId = garment._id || garment.id;
    const qrCode = garment.qrCode || garmentId;
    try {
      setAdvancingId(garmentId);
      await ApiClient.advanceGarmentStage(qrCode, nextStage, userName || 'Hub Manager', 'hub_manager');
      await load();
    } catch (e: any) {
      const msg = e.message || 'Failed to advance garment';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Update Failed', msg);
      }
    } finally {
      setAdvancingId(null);
    }
  };

  const filteredOrders = stageFilter === 'ALL'
    ? orders
    : orders.filter(o =>
        (o.garments || []).some((g: any) =>
          (g.currentStage || '').toUpperCase().includes(stageFilter),
        ),
      );

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={s.loadingText}>Loading orders…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <Text style={s.errorIcon}>⚠️</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={load}>
            <Text style={s.retryText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.filterStrip}>
        <FlatList
          data={STAGE_FILTERS}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={f => f.key}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.filterChip, stageFilter === item.key && s.filterChipActive]}
              onPress={() => setStageFilter(item.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.filterChipText, stageFilter === item.key && s.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={s.summaryRow}>
        <Text style={s.summaryText}>
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
          {stageFilter !== 'ALL' ? ` with garments in ${stageFilter.toLowerCase()}` : ' total'}
        </Text>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={o => o._id || o.id || o.orderNumber || String(Math.random())}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7c3aed" />}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onAdvanceGarment={handleAdvanceGarment}
            advancingId={advancingId}
          />
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📦</Text>
            <Text style={s.emptyTitle}>No orders found</Text>
            <Text style={s.emptySub}>
              {stageFilter !== 'ALL'
                ? `No garments currently in ${stageFilter.toLowerCase()}`
                : 'No orders have been placed for this hub yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { color: '#7c3aed', fontSize: 14, fontWeight: '600', marginTop: 16 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorText: { color: '#dc2626', fontSize: 15, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  retryText: { color: '#fff', fontWeight: '700' },
  filterStrip: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  filterChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  filterChipText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  filterChipTextActive: { color: '#fff' },
  summaryRow: { paddingHorizontal: 20, paddingVertical: 8 },
  summaryText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  list: { padding: 16, paddingTop: 4, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', maxWidth: 280 },
});
