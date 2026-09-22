import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, useWindowDimensions, Platform
} from 'react-native';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { UserStatusBadge } from '../../components/credentials/UserStatusBadge';
import { CreateWorkerModal } from '../../components/credentials/CreateWorkerModal';
import { ActivationSuccessModal } from '../../components/credentials/ActivationSuccessModal';
import { ResetAccessModal } from '../../components/credentials/ResetAccessModal';
import { DeactivateAccountModal } from '../../components/credentials/DeactivateAccountModal';

export const ManagerWorkersScreen = ({ navigation }: { navigation: any }) => {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < 768;

  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdWorkerData, setCreatedWorkerData] = useState<any>(null);

  const [targetWorker, setTargetWorker] = useState<any>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const fetchWorkers = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getWorkers(search || undefined, accountStatusFilter || undefined);
      setWorkers(data);
    } catch (e) {
      console.error('Failed to fetch workers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [search, accountStatusFilter]);

  const totalCount = workers.length;
  const activeCount = workers.filter(w => w.accountStatus === 'ACTIVE').length;
  const inactiveCount = workers.filter(w => w.isActive === false || w.accountStatus === 'INACTIVE').length;
  const loggedInCount = workers.filter(w => w.lastLoginAt).length;

  const handleCreateWorker = async (formData: any) => {
    const res = await ApiClient.createWorker(formData);
    setCreatedWorkerData(res);
    fetchWorkers();
  };

  const handleConfirmReset = async () => {
    if (!targetWorker) return;
    const res = await ApiClient.resetWorkerAccess(targetWorker.userId || targetWorker.id);
    fetchWorkers();
    return res;
  };

  const handleConfirmDeactivate = async () => {
    if (!targetWorker) return;
    await ApiClient.deactivateWorker(targetWorker.userId || targetWorker.id);
    fetchWorkers();
  };

  const handleReactivate = async (workerId: string) => {
    await ApiClient.reactivateWorker(workerId);
    fetchWorkers();
  };

  return (
    <View style={[styles.container, { height: Platform.OS === 'web' ? windowHeight - 56 : undefined }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.title}>HUB WORKERS</Text>
            <Text style={styles.subtitle}>Manage operational staff assigned to this hub.</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.addBtnText}>+ ADD HUB WORKER</Text>
          </TouchableOpacity>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{totalCount}</Text>
            <Text style={styles.metricLabel}>Total Workers</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#16a34a' }]}>{activeCount}</Text>
            <Text style={styles.metricLabel}>Active</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#dc2626' }]}>{inactiveCount}</Text>
            <Text style={styles.metricLabel}>Inactive</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#2563eb' }]}>{loggedInCount}</Text>
            <Text style={styles.metricLabel}>Logged In</Text>
          </View>
        </View>

        {/* Search & Filters */}
        <View style={styles.filterRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by worker name or phone..."
            value={search}
            onChangeText={setSearch}
          />
          <View style={styles.chipRow}>
            {['', 'ACTIVE', 'PENDING_ACTIVATION', 'INACTIVE'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.chip, accountStatusFilter === st && styles.chipActive]}
                onPress={() => setAccountStatusFilter(st)}
              >
                <Text style={[styles.chipText, accountStatusFilter === st && styles.chipTextActive]}>
                  {st === '' ? 'ALL STATUS' : st.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data View */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : workers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hub workers found for this hub.</Text>
          </View>
        ) : isSmallScreen ? (
          <View style={styles.cardsContainer}>
            {workers.map((w) => (
              <View key={w.userId || w.id} style={styles.workerCard}>
                <View style={styles.cardTop}>
                  <Text style={styles.workerName}>{w.name}</Text>
                  <UserStatusBadge status={w.accountStatus || 'ACTIVE'} />
                </View>
                <Text style={styles.workerPhone}>{w.phone}</Text>
                <Text style={styles.roleBadge}>Role: {w.role}</Text>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => navigation.navigate('MGRWorkerDetail', { workerId: w.userId || w.id })}
                  >
                    <Text style={styles.viewBtnText}>VIEW</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resetAccessBtn}
                    onPress={() => { setTargetWorker(w); setShowResetModal(true); }}
                  >
                    <Text style={styles.resetAccessBtnText}>RESET</Text>
                  </TouchableOpacity>
                  {w.isActive !== false ? (
                    <TouchableOpacity
                      style={styles.deactBtn}
                      onPress={() => { setTargetWorker(w); setShowDeactivateModal(true); }}
                    >
                      <Text style={styles.deactBtnText}>DEACTIVATE</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.reactBtn}
                      onPress={() => handleReactivate(w.userId || w.id)}
                    >
                      <Text style={styles.reactBtnText}>REACTIVATE</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>Name</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Phone</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Operational Role</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Account Status</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Last Login</Text>
              <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>Actions</Text>
            </View>

            {workers.map((w, idx) => (
              <View key={w.userId || w.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.td, styles.tdBold, { flex: 2 }]}>{w.name}</Text>
                <Text style={[styles.td, { flex: 1.5 }]}>{w.phone}</Text>
                <Text style={[styles.td, { flex: 1.5, fontWeight: '700' }]}>{w.role}</Text>
                <View style={{ flex: 1.5 }}>
                  <UserStatusBadge status={w.accountStatus || 'ACTIVE'} />
                </View>
                <Text style={[styles.td, { flex: 1.5 }]}>
                  {w.lastLoginAt ? new Date(w.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </Text>
                <View style={styles.tdActions}>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => navigation.navigate('MGRWorkerDetail', { workerId: w.userId || w.id })}
                  >
                    <Text style={styles.viewBtnText}>VIEW</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resetAccessBtn}
                    onPress={() => { setTargetWorker(w); setShowResetModal(true); }}
                  >
                    <Text style={styles.resetAccessBtnText}>RESET</Text>
                  </TouchableOpacity>
                  {w.isActive !== false ? (
                    <TouchableOpacity
                      style={styles.deactBtn}
                      onPress={() => { setTargetWorker(w); setShowDeactivateModal(true); }}
                    >
                      <Text style={styles.deactBtnText}>DEACTIVATE</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.reactBtn}
                      onPress={() => handleReactivate(w.userId || w.id)}
                    >
                      <Text style={styles.reactBtnText}>REACTIVATE</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <CreateWorkerModal
        visible={showCreateModal}
        onSubmit={handleCreateWorker}
        onClose={() => setShowCreateModal(false)}
      />

      <ActivationSuccessModal
        visible={!!createdWorkerData}
        data={createdWorkerData}
        onClose={() => setCreatedWorkerData(null)}
      />

      <ResetAccessModal
        visible={showResetModal}
        userName={targetWorker?.name || ''}
        userRole="HUB_STAFF"
        onConfirm={handleConfirmReset}
        onClose={() => setShowResetModal(false)}
      />

      <DeactivateAccountModal
        visible={showDeactivateModal}
        userName={targetWorker?.name || ''}
        userRole="HUB_STAFF"
        onConfirm={handleConfirmDeactivate}
        onClose={() => setShowDeactivateModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addBtn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  addBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  metricCard: {
    flex: 1, minWidth: 120, backgroundColor: '#ffffff', borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center',
  },
  metricVal: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  metricLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 4 },
  filterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  searchInput: {
    flex: 1, minWidth: 200, backgroundColor: '#ffffff', borderWidth: 1,
    borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#0f172a',
  },
  chipRow: { flexDirection: 'row', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1' },
  chipActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#ffffff' },
  loadingBox: { padding: 40, alignItems: 'center' },
  emptyBox: { backgroundColor: '#ffffff', borderRadius: 12, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { fontSize: 14, color: '#64748b' },
  tableCard: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  th: { fontSize: 12, fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  td: { fontSize: 13, color: '#334155' },
  tdBold: { fontWeight: '700', color: '#0f172a' },
  tdActions: { flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  viewBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  viewBtnText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  resetAccessBtn: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  resetAccessBtnText: { fontSize: 11, fontWeight: '800', color: '#b45309' },
  deactBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deactBtnText: { fontSize: 11, fontWeight: '800', color: '#b91c1c' },
  reactBtn: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  reactBtnText: { fontSize: 11, fontWeight: '800', color: '#15803d' },
  cardsContainer: { gap: 12 },
  workerCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workerName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  workerPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleBadge: { fontSize: 12, color: '#475569', fontWeight: '700', marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
