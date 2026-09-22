import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator,
  Alert, Platform, Modal, ScrollView, TextInput,
} from 'react-native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';

// ── Stage config ──────────────────────────────────────────────────────────────
const STAGE_META: Record<string, { label: string; color: string }> = {
  INTAKE:               { label: 'Intake',      color: '#6366f1' },
  CUTTING_STARTED:      { label: 'Cutting',     color: '#8b5cf6' },
  CUTTING_COMPLETED:    { label: 'Cutting ✓',   color: '#7c3aed' },
  STITCHING_ASSIGNED:   { label: 'Assigned',    color: '#a855f7' },
  STITCHING_STARTED:    { label: 'Stitching',   color: '#a855f7' },
  STITCHING_COMPLETED:  { label: 'Stitching ✓', color: '#9333ea' },
  QC_STARTED:           { label: 'QC',          color: '#ec4899' },
  QC_PASSED:            { label: 'QC ✓',        color: '#db2777' },
  QC_REWORK:            { label: 'Rework',      color: '#dc2626' },
  IRONING_STARTED:      { label: 'Ironing',     color: '#f97316' },
  IRONING_COMPLETED:    { label: 'Ironing ✓',   color: '#ea580c' },
  PACKED:               { label: 'Packed',      color: '#10b981' },
  DISPATCHED:           { label: 'Dispatched',  color: '#0ea5e9' },
};

function fmtDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Worker Picker Modal ───────────────────────────────────────────────────────
const WorkerPicker = ({
  visible,
  garment,
  workers,
  onAssign,
  onClose,
  assigning,
}: {
  visible: boolean;
  garment: any | null;
  workers: any[];
  onAssign: (worker: any) => void;
  onClose: () => void;
  assigning: boolean;
}) => {
  const [search, setSearch] = useState('');
  const filtered = workers.filter(w =>
    !search || (w.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <TouchableOpacity style={pickerStyles.backdrop} onPress={onClose} activeOpacity={1} />
        <View style={pickerStyles.sheet}>
          <View style={pickerStyles.handle} />

          {/* Header */}
          <View style={pickerStyles.header}>
            <View style={{ flex: 1 }}>
              <Text style={pickerStyles.title}>Assign Worker</Text>
              {garment && (
                <Text style={pickerStyles.sub}>
                  {garment.qrCode || garment.garmentNumber} · {garment.type} · {garment.gender}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={pickerStyles.closeBtn}>
              <Text style={pickerStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={pickerStyles.searchWrap}>
            <TextInput
              style={pickerStyles.searchInput}
              placeholder="Search workers…"
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#94a3b8"
            />
          </View>

          {/* Workers list */}
          {workers.length === 0 ? (
            <View style={pickerStyles.empty}>
              <Text style={pickerStyles.emptyIcon}>👷</Text>
              <Text style={pickerStyles.emptyText}>No workers registered</Text>
              <Text style={pickerStyles.emptySub}>Add workers from the Workers section first</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={pickerStyles.list} showsVerticalScrollIndicator={false}>
              {filtered.map(worker => {
                const isCurrentWorker = garment?.assignedWorkerName === worker.name
                  || garment?.assignedWorkerId === (worker.userId || worker.id || worker._id);
                return (
                  <TouchableOpacity
                    key={worker.userId || worker.id || worker._id}
                    style={[pickerStyles.workerRow, isCurrentWorker && pickerStyles.workerRowCurrent]}
                    onPress={() => onAssign(worker)}
                    disabled={assigning}
                    activeOpacity={0.75}
                  >
                    {/* Avatar */}
                    <View style={[pickerStyles.avatar, { backgroundColor: isCurrentWorker ? '#7c3aed' : '#e0e7ff' }]}>
                      <Text style={[pickerStyles.avatarText, { color: isCurrentWorker ? '#fff' : '#6366f1' }]}>
                        {(worker.name || 'W').charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={[pickerStyles.workerName, isCurrentWorker && { color: '#7c3aed' }]}>
                        {worker.name || 'Worker'}
                        {isCurrentWorker && <Text style={pickerStyles.currentTag}> (current)</Text>}
                      </Text>
                      <Text style={pickerStyles.workerMeta}>
                        {worker.phone || worker.email || 'Hub Staff'}
                      </Text>
                    </View>

                    {assigning ? (
                      <ActivityIndicator size="small" color="#7c3aed" />
                    ) : (
                      <View style={[pickerStyles.assignChip, isCurrentWorker && { backgroundColor: '#7c3aed' }]}>
                        <Text style={[pickerStyles.assignChipText, isCurrentWorker && { color: '#fff' }]}>
                          {isCurrentWorker ? '✓' : 'Assign'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
              {filtered.length === 0 && (
                <Text style={pickerStyles.noResults}>No workers match "{search}"</Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '80%', minHeight: 320, paddingBottom: 32,
  },
  handle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  sub: { fontSize: 13, color: '#64748b', marginTop: 3, fontFamily: 'Courier New' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 14, color: '#64748b', fontWeight: '700' },
  searchWrap: { paddingHorizontal: 20, marginBottom: 8 },
  searchInput: {
    backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 14, color: '#1e293b',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  list: { paddingHorizontal: 20, paddingBottom: 16 },
  workerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 14, marginBottom: 8,
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9',
  },
  workerRowCurrent: { backgroundColor: '#f3f0ff', borderColor: '#c4b5fd' },
  avatar: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  workerName: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  currentTag: { fontSize: 12, color: '#7c3aed', fontWeight: '600' },
  workerMeta: { fontSize: 12, color: '#64748b', marginTop: 1 },
  assignChip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, backgroundColor: '#e0e7ff' },
  assignChipText: { fontSize: 12, fontWeight: '700', color: '#6366f1' },
  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#64748b', textAlign: 'center' },
  noResults: { textAlign: 'center', color: '#94a3b8', fontSize: 13, paddingVertical: 24 },
});

// ── Garment row inside order card ─────────────────────────────────────────────
const GarmentItem = ({
  garment,
  onAssignPress,
}: {
  garment: any;
  onAssignPress: (garment: any) => void;
}) => {
  const stage = garment.currentStage || 'CUTTING_STARTED';
  const meta = STAGE_META[stage] || { label: stage, color: '#64748b' };
  const hasWorker = !!(garment.assignedWorkerName || garment.assignedWorkerId);

  return (
    <View style={grmStyles.row}>
      <View style={grmStyles.left}>
        <Text style={grmStyles.qr}>{garment.qrCode || garment.garmentNumber || '—'}</Text>
        <Text style={grmStyles.meta}>{garment.type} · {garment.gender}</Text>
        {hasWorker ? (
          <Text style={grmStyles.worker}>👷 {garment.assignedWorkerName || 'Worker assigned'}</Text>
        ) : (
          <Text style={grmStyles.unassigned}>⚠️ No worker assigned</Text>
        )}
      </View>

      <View style={grmStyles.right}>
        <View style={[grmStyles.stagePill, { backgroundColor: meta.color + '18' }]}>
          <Text style={[grmStyles.stageText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <TouchableOpacity
          style={[grmStyles.assignBtn, hasWorker && grmStyles.reassignBtn]}
          onPress={() => onAssignPress(garment)}
          activeOpacity={0.8}
        >
          <Text style={[grmStyles.assignBtnText, hasWorker && grmStyles.reassignBtnText]}>
            {hasWorker ? '↺ Reassign' : '+ Assign'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const grmStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  left: { flex: 1 },
  qr: { fontSize: 13, fontWeight: '700', color: '#1e293b', fontFamily: 'Courier New' },
  meta: { fontSize: 11, color: '#64748b', textTransform: 'capitalize', marginTop: 2 },
  worker: { fontSize: 11, color: '#7c3aed', fontWeight: '600', marginTop: 3 },
  unassigned: { fontSize: 11, color: '#f97316', fontWeight: '600', marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 6 },
  stagePill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  stageText: { fontSize: 10, fontWeight: '700' },
  assignBtn: {
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: '#7c3aed',
  },
  assignBtnText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  reassignBtn: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  reassignBtnText: { color: '#64748b' },
});

// ── Order card ────────────────────────────────────────────────────────────────
const OrderCard = ({
  order,
  expanded,
  onToggle,
  onAssignGarment,
}: {
  order: any;
  expanded: boolean;
  onToggle: () => void;
  onAssignGarment: (garment: any) => void;
}) => {
  const garments: any[] = order.garments || [];
  const assignedCount = garments.filter(g => g.assignedWorkerName || g.assignedWorkerId).length;
  const isFullyAssigned = assignedCount === garments.length && garments.length > 0;

  return (
    <View style={cardStyles.card}>
      {/* Order header */}
      <TouchableOpacity style={cardStyles.header} onPress={onToggle} activeOpacity={0.8}>
        <View style={cardStyles.statusDot}>
          <View style={[cardStyles.dot, { backgroundColor: isFullyAssigned ? '#10b981' : assignedCount > 0 ? '#f59e0b' : '#dc2626' }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.orderNum}>{order.orderNumber || ('…' + (order._id || '').slice(-6))}</Text>
          <Text style={cardStyles.customer}>👤 {order.customerName || 'Customer'} · {fmtDate(order.createdAt)}</Text>
        </View>
        <View style={cardStyles.headerRight}>
          <View style={[cardStyles.progressChip, {
            backgroundColor: isFullyAssigned ? '#d1fae5' : assignedCount > 0 ? '#fef3c7' : '#fee2e2',
          }]}>
            <Text style={[cardStyles.progressText, {
              color: isFullyAssigned ? '#065f46' : assignedCount > 0 ? '#92400e' : '#991b1b',
            }]}>
              {assignedCount}/{garments.length} assigned
            </Text>
          </View>
          <Text style={cardStyles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {/* Garments (expanded) */}
      {expanded && (
        <View style={cardStyles.body}>
          <View style={cardStyles.divider} />
          {garments.length === 0 ? (
            <Text style={cardStyles.noGarments}>No garments in this order</Text>
          ) : (
            garments.map((g: any, i: number) => (
              <View key={g._id || g.id || String(i)}>
                {i > 0 && <View style={cardStyles.garmentDivider} />}
                <GarmentItem garment={g} onAssignPress={onAssignGarment} />
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
};

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 18, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2, overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, gap: 10,
  },
  statusDot: { justifyContent: 'center', paddingTop: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  orderNum: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  customer: { fontSize: 12, color: '#64748b', marginTop: 2 },
  headerRight: { alignItems: 'flex-end', gap: 4 },
  progressChip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  progressText: { fontSize: 11, fontWeight: '700' },
  chevron: { fontSize: 11, color: '#94a3b8' },
  body: { paddingHorizontal: 16, paddingBottom: 12 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 6 },
  garmentDivider: { height: 1, backgroundColor: '#f8fafc', marginVertical: 2 },
  noGarments: { fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingVertical: 16 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export const ManagerAssignmentScreen = () => {
  const { hubId, userName } = useAuth();

  const [orders, setOrders] = useState<any[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerGarment, setPickerGarment] = useState<any | null>(null);
  const [assigning, setAssigning] = useState(false);

  // Expand state (by order id)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filter: 'all' | 'unassigned' | 'assigned'
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'assigned'>('unassigned');

  const load = useCallback(async () => {
    try {
      setError(null);
      const [ordersData, workersData] = await Promise.all([
        ApiClient.getOrders(hubId || undefined),
        ApiClient.getWorkers(),
      ]);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setWorkers(Array.isArray(workersData) ? workersData : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hubId]);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (orderId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(orderId) ? next.delete(orderId) : next.add(orderId);
      return next;
    });
  };

  const openPicker = (garment: any) => {
    setPickerGarment(garment);
    setPickerVisible(true);
  };

  const handleAssign = async (worker: any) => {
    if (!pickerGarment) return;
    const garmentId = pickerGarment._id || pickerGarment.id;
    const workerId = worker.userId || worker.id || worker._id;
    const workerName = worker.name || 'Hub Worker';

    try {
      setAssigning(true);
      await ApiClient.assignWorkerToGarment(garmentId, workerId, workerName);
      setPickerVisible(false);
      setPickerGarment(null);
      await load();
    } catch (e: any) {
      const msg = e.message || 'Assignment failed';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Assignment Failed', msg);
      }
    } finally {
      setAssigning(false);
    }
  };

  // Summary counts
  const allGarments = orders.flatMap(o => o.garments || []);
  const unassignedCount = allGarments.filter(g => !g.assignedWorkerName && !g.assignedWorkerId).length;
  const assignedCount = allGarments.length - unassignedCount;

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const garments: any[] = order.garments || [];
    if (filter === 'unassigned') return garments.some(g => !g.assignedWorkerName && !g.assignedWorkerId);
    if (filter === 'assigned') return garments.some(g => g.assignedWorkerName || g.assignedWorkerId);
    return true;
  });

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.centered}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={s.loadingText}>Loading assignments…</Text>
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
      {/* Summary bar */}
      <View style={s.summaryBar}>
        <View style={s.summaryCard}>
          <Text style={s.summaryNum}>{allGarments.length}</Text>
          <Text style={s.summaryLabel}>Total Garments</Text>
        </View>
        <View style={[s.summaryCard, { borderColor: '#dc2626' }]}>
          <Text style={[s.summaryNum, { color: '#dc2626' }]}>{unassignedCount}</Text>
          <Text style={s.summaryLabel}>Unassigned</Text>
        </View>
        <View style={[s.summaryCard, { borderColor: '#10b981' }]}>
          <Text style={[s.summaryNum, { color: '#10b981' }]}>{assignedCount}</Text>
          <Text style={s.summaryLabel}>Assigned</Text>
        </View>
        <View style={[s.summaryCard, { borderColor: '#7c3aed' }]}>
          <Text style={[s.summaryNum, { color: '#7c3aed' }]}>{workers.length}</Text>
          <Text style={s.summaryLabel}>Workers</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={s.tabs}>
        {([
          { key: 'unassigned', label: '⚠️ Unassigned', count: unassignedCount },
          { key: 'all',        label: '📋 All Orders',  count: orders.length },
          { key: 'assigned',   label: '✅ Assigned',    count: assignedCount },
        ] as const).map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[s.tab, filter === tab.key && s.tabActive]}
            onPress={() => setFilter(tab.key)}
            activeOpacity={0.8}
          >
            <Text style={[s.tabText, filter === tab.key && s.tabTextActive]}>
              {tab.label}
            </Text>
            <View style={[s.tabBadge, filter === tab.key && s.tabBadgeActive]}>
              <Text style={[s.tabBadgeText, filter === tab.key && s.tabBadgeTextActive]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders list */}
      <FlatList
        data={filteredOrders}
        keyExtractor={o => o._id || o.id || o.orderNumber || String(Math.random())}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7c3aed" />
        }
        contentContainerStyle={s.list}
        renderItem={({ item }) => {
          const oid = item._id || item.id || item.orderNumber;
          return (
            <OrderCard
              order={item}
              expanded={expandedIds.has(oid)}
              onToggle={() => toggleExpand(oid)}
              onAssignGarment={openPicker}
            />
          );
        }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>
              {filter === 'unassigned' ? '🎉' : '📋'}
            </Text>
            <Text style={s.emptyTitle}>
              {filter === 'unassigned' ? 'All assigned!' : 'No orders'}
            </Text>
            <Text style={s.emptySub}>
              {filter === 'unassigned'
                ? 'Every garment has been assigned to a worker'
                : 'No orders found for this hub'}
            </Text>
          </View>
        }
      />

      {/* Worker picker bottom sheet */}
      <WorkerPicker
        visible={pickerVisible}
        garment={pickerGarment}
        workers={workers}
        onAssign={handleAssign}
        onClose={() => { setPickerVisible(false); setPickerGarment(null); }}
        assigning={assigning}
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

  summaryBar: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  summaryCard: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14,
    backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#e2e8f0',
  },
  summaryNum: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  summaryLabel: { fontSize: 9, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: 2, letterSpacing: 0.3 },

  tabs: {
    flexDirection: 'row', backgroundColor: '#fff', paddingHorizontal: 16,
    paddingBottom: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 12, backgroundColor: '#f8fafc',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  tabActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  tabText: { fontSize: 11, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  tabBadge: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, backgroundColor: '#e2e8f0', minWidth: 20, alignItems: 'center' },
  tabBadgeActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabBadgeText: { fontSize: 10, fontWeight: '800', color: '#64748b' },
  tabBadgeTextActive: { color: '#fff' },

  list: { padding: 16, paddingTop: 12, paddingBottom: 40 },

  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center', maxWidth: 260 },
});
