import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Platform, useWindowDimensions, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { ProductionPipeline } from '../../components/manager/ProductionPipeline';
import { AttentionPanel, AttentionItem } from '../../components/manager/AttentionPanel';
import { UserProfileModal } from '../../../../shared/components/UserProfileModal';
import { Ionicons } from '@expo/vector-icons';

const KPICard = ({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) => (
  <View style={[kpiStyles.card, { borderTopColor: color }]}>
    <Text style={[kpiStyles.value, { color }]}>{value}</Text>
    <Text style={kpiStyles.label}>{label}</Text>
    {sub && <Text style={kpiStyles.sub}>{sub}</Text>}
  </View>
);

const kpiStyles = StyleSheet.create({
  card: { flex: 1, minWidth: 140, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  value: { fontSize: 32, fontWeight: '900', marginBottom: 4 },
  label: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  sub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
});

export const ManagerDashboardScreen = () => {
  const { hubId, userName, logout } = useAuth();
  const navigation = useNavigation<any>();
  const { height: windowHeight } = useWindowDimensions();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) logout();
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]);
    }
  };

  // On web the navigator header is ~56px; subtract it so scroll stays within viewport
  const containerStyle = Platform.OS === 'web'
    ? { flex: 1, backgroundColor: '#f1f5f9', height: windowHeight - 56, maxHeight: windowHeight - 56 }
    : { flex: 1, backgroundColor: '#f1f5f9' };

  const scrollStyle = Platform.OS === 'web'
    ? { flex: 1, overflow: 'scroll' as any }
    : { flex: 1 };

  const [orders, setOrders] = useState<any[]>([]);
  const [advancingId, setAdvancingId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      setError(null);
      const [data, ordersData] = await Promise.all([
        ApiClient.getDashboardMetrics(hubId || undefined),
        ApiClient.getOrders(hubId || undefined),
      ]);
      setDashboard(data);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (e: any) {
      setError(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hubId]);

  const handleAdvanceGarment = async (garment: any, nextStage: string) => {
    try {
      setAdvancingId(garment.id || garment._id);
      await ApiClient.advanceGarmentStage(
        garment.qrCode || garment.id || garment._id,
        nextStage,
        userName || 'Hub Manager',
        'hub_manager'
      );
      await loadDashboard();
    } catch (e: any) {
      if (Platform.OS === 'web') {
        window.alert(e.message || 'Failed to update garment stage');
      } else {
        Alert.alert('Stage Update Failed', e.message || 'Failed to update garment stage');
      }
    } finally {
      setAdvancingId(null);
    }
  };

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  const onRefresh = () => { setRefreshing(true); loadDashboard(); };

  const d = dashboard || {};

  const attentionItems: AttentionItem[] = [
    { id: 'overdue',    icon: '🔴', label: 'garments overdue',           count: d.overdue ?? 0,            severity: 'critical', onPress: () => navigation.navigate('MGRGarments', { filter: 'overdue' }) },
    { id: 'at_risk',    icon: '🟠', label: 'garments at risk',            count: d.atRisk ?? 0,             severity: 'warning',  onPress: () => navigation.navigate('MGRGarments', { filter: 'at_risk' }) },
    { id: 'unassigned', icon: '🟠', label: 'garments awaiting assignment',count: d.awaitingAssignment ?? 0, severity: 'warning',  onPress: () => navigation.navigate('MGRAssignments') },
    { id: 'rework',     icon: '🟡', label: 'QC reworks pending',          count: d.qcRework ?? 0,           severity: 'info',     onPress: () => navigation.navigate('MGRQC') },
    { id: 'leave',      icon: '🟡', label: 'leave requests pending',       count: d.pendingLeave ?? 0,       severity: 'info',     onPress: () => navigation.navigate('MGRLeave') },
    { id: 'payouts',    icon: '🟡', label: 'payout claims pending',        count: d.pendingPayouts ?? 0,     severity: 'info',     onPress: () => navigation.navigate('MGRPayouts') },
  ];

  const stagesForPipeline = [
    { key: 'intake',     label: 'INTAKE',    count: d.stageCount?.intake     ?? 0, color: '#6366f1' },
    { key: 'cutting',    label: 'CUTTING',   count: d.stageCount?.cutting    ?? 0, color: '#8b5cf6' },
    { key: 'stitching',  label: 'STITCHING', count: d.stageCount?.stitching  ?? 0, color: '#a855f7' },
    { key: 'qc',         label: 'QC',        count: d.stageCount?.qc         ?? 0, color: '#ec4899' },
    { key: 'ironing',    label: 'IRONING',   count: d.stageCount?.ironing    ?? 0, color: '#f97316' },
    { key: 'packed',     label: 'PACKED',    count: d.stageCount?.packed     ?? 0, color: '#10b981' },
    { key: 'dispatched', label: 'DISPATCH',  count: d.stageCount?.dispatched ?? 0, color: '#0ea5e9' },
  ];

  if (loading) {
    return (
      <View style={containerStyle}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={containerStyle}>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadDashboard}>
            <Text style={styles.retryText}>RETRY</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <ScrollView
        style={scrollStyle}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        showsVerticalScrollIndicator={true}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()}, {userName?.split(' ')[0] ?? 'Manager'}</Text>
            <Text style={styles.pageTitle}>Hub Dashboard</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerActionBtn} onPress={onRefresh}>
              <Text style={styles.refreshIcon}>↺</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={() => setShowProfile(true)}>
              <Ionicons name="person-outline" size={20} color="#7c3aed" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={confirmLogout}>
              <Ionicons name="log-out-outline" size={20} color="#7c3aed" />
            </TouchableOpacity>
          </View>
        </View>

        {/* KPI Cards */}
        <Text style={styles.sectionLabel}>TODAY'S OVERVIEW</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kpiRow}>
          <KPICard label="In Production"     value={d.inProduction ?? '—'}    color="#7c3aed" />
          <KPICard label="Awaiting Assignment" value={d.awaitingAssignment ?? '—'} color="#f97316" />
          <KPICard label="At Risk"            value={d.atRisk ?? '—'}          color="#ea580c" />
          <KPICard label="Overdue"            value={d.overdue ?? '—'}         color="#dc2626" />
          <KPICard label="Ready for Dispatch" value={d.readyDispatch ?? '—'}   color="#10b981" />
          <KPICard label="Delivered Today"    value={d.deliveredToday ?? '—'}  color="#0ea5e9" />
          <KPICard label="Pending Leave"      value={d.pendingLeave ?? '—'}    color="#f59e0b" />
          <KPICard label="Pending Claims"     value={d.pendingPayouts ?? '—'}  color="#8b5cf6" />
        </ScrollView>

        {/* Production Pipeline */}
        <Text style={styles.sectionLabel}>PRODUCTION PIPELINE</Text>
        <ProductionPipeline
          stages={stagesForPipeline}
          onStagePress={(stage) => navigation.navigate('MGRQueue', { defaultStage: stage })}
        />

        {/* Attention Required */}
        <Text style={styles.sectionLabel}>ACTION REQUIRED</Text>
        <AttentionPanel items={attentionItems} />

        {/* Quick Actions */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.actionsGrid}>
          <QuickAction icon="📦" label="Orders"      onPress={() => navigation.navigate('MGROrders')} color="#7c3aed" />
          <QuickAction icon="👕" label="Garments"    onPress={() => navigation.navigate('MGRGarments')} color="#8b5cf6" />
          <QuickAction icon="🎯" label="Assignments"  onPress={() => navigation.navigate('MGRAssignments')} color="#6366f1" />
          <QuickAction icon="🧵" label="Tailors"     onPress={() => navigation.navigate('MGRTailors')} color="#0d9488" />
          <QuickAction icon="🛵" label="Riders"      onPress={() => navigation.navigate('MGRRiders')} color="#0284c7" />
          <QuickAction icon="👥" label="Workers"     onPress={() => navigation.navigate('MGRWorkers')} color="#0d9488" />
          <QuickAction icon="🗓️" label="Leave"       onPress={() => navigation.navigate('MGRLeave')} color="#f59e0b" />
          <QuickAction icon="🔍" label="QC / Rework" onPress={() => navigation.navigate('MGRQC')} color="#ec4899" />
          <QuickAction icon="🚚" label="Dispatch"    onPress={() => navigation.navigate('MGRDelivery')} color="#0ea5e9" />
          <QuickAction icon="💰" label="Payouts"     onPress={() => navigation.navigate('MGRPayouts')} color="#10b981" />
          <QuickAction icon="📈" label="Reports"     onPress={() => navigation.navigate('MGRReports')} color="#64748b" />
        </View>

        {/* Recent Orders */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RECENT ORDERS</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MGROrders')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        {orders.length === 0 ? (
          <View style={styles.emptyOrders}>
            <Text style={styles.emptyOrdersText}>No orders yet for this hub</Text>
          </View>
        ) : (
          orders.slice(0, 5).map((order: any) => {
            const garments: any[] = order.garments || [];
            const stageLabels: Record<string, { label: string; color: string }> = {
              INTAKE: { label: 'Intake', color: '#6366f1' },
              CUTTING_STARTED: { label: 'Cutting', color: '#8b5cf6' },
              CUTTING_COMPLETED: { label: 'Cutting ✓', color: '#7c3aed' },
              STITCHING_ASSIGNED: { label: 'Assigned', color: '#a855f7' },
              STITCHING_STARTED: { label: 'Stitching', color: '#a855f7' },
              STITCHING_COMPLETED: { label: 'Stitching ✓', color: '#9333ea' },
              QC_STARTED: { label: 'QC', color: '#ec4899' },
              QC_PASSED: { label: 'QC ✓', color: '#db2777' },
              QC_REWORK: { label: 'Rework', color: '#dc2626' },
              IRONING_STARTED: { label: 'Ironing', color: '#f97316' },
              IRONING_COMPLETED: { label: 'Ironing ✓', color: '#ea580c' },
              PACKED: { label: 'Packed', color: '#10b981' },
              DISPATCHED: { label: 'Dispatched', color: '#0ea5e9' },
              OUT_FOR_DELIVERY: { label: 'On the Way', color: '#0284c7' },
              DELIVERED: { label: 'Delivered', color: '#16a34a' },
            };
            // Find the earliest-pipeline stage across all garments
            const stages = garments.map(g => g.currentStage || 'CUTTING_STARTED');
            const firstStage = stages[0] || 'CUTTING_STARTED';
            const info = stageLabels[firstStage] || { label: firstStage, color: '#64748b' };

            return (
              <TouchableOpacity
                key={order._id || order.id || order.orderNumber}
                style={styles.orderCard}
                onPress={() => navigation.navigate('MGROrders')}
                activeOpacity={0.85}
              >
                <View style={styles.orderCardLeft}>
                  <Text style={styles.orderNum}>{order.orderNumber || ('…' + (order._id || '').slice(-6))}</Text>
                  <Text style={styles.orderCustomer}>👤 {order.customerName || 'Customer'}</Text>
                  <Text style={styles.orderGarments}>{garments.length} garment{garments.length !== 1 ? 's' : ''}</Text>
                </View>
                <View style={[styles.orderStagePill, { backgroundColor: info.color + '18' }]}>
                  <Text style={[styles.orderStageText, { color: info.color }]}>{info.label}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />
      </ScrollView>
    </View>
  );
};

const QuickAction = ({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) => (
  <TouchableOpacity style={[qaStyles.card, { borderTopColor: color }]} onPress={onPress} activeOpacity={0.8}>
    <Text style={qaStyles.icon}>{icon}</Text>
    <Text style={qaStyles.label}>{label}</Text>
  </TouchableOpacity>
);

const qaStyles = StyleSheet.create({
  card: { flex: 1, minWidth: '22%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  icon: { fontSize: 28, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: '#1e293b', textAlign: 'center' },
});

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { color: '#7c3aed', fontSize: 14, fontWeight: '600', marginTop: 16 },
  errorIcon: { fontSize: 48, marginBottom: 16 },
  errorText: { color: '#dc2626', fontSize: 15, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 32 },
  retryText: { color: '#fff', fontWeight: '700' },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  greeting: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  pageTitle: { fontSize: 26, fontWeight: '900', color: '#1e293b', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  refreshIcon: { fontSize: 20, color: '#7c3aed', fontWeight: 'bold' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 },
  seeAll: { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  kpiRow: { flexDirection: 'row', gap: 12, paddingBottom: 4, marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  orderCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  orderCardLeft: { flex: 1, marginRight: 12 },
  orderNum: { fontSize: 13, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  orderCustomer: { fontSize: 12, color: '#64748b', marginBottom: 1 },
  orderGarments: { fontSize: 11, color: '#94a3b8' },
  orderStagePill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  orderStageText: { fontSize: 11, fontWeight: '700' },
  emptyOrders: { backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 16 },
  emptyOrdersText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
});
