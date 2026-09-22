import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, useWindowDimensions, Platform
} from 'react-native';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { UserStatusBadge } from '../../components/credentials/UserStatusBadge';
import { CreateRiderModal } from '../../components/credentials/CreateRiderModal';
import { ActivationSuccessModal } from '../../components/credentials/ActivationSuccessModal';
import { ResetAccessModal } from '../../components/credentials/ResetAccessModal';
import { DeactivateAccountModal } from '../../components/credentials/DeactivateAccountModal';

export const ManagerRidersScreen = ({ navigation }: { navigation: any }) => {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < 768;

  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [accountStatusFilter, setAccountStatusFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdRiderData, setCreatedRiderData] = useState<any>(null);
  
  const [targetRider, setTargetRider] = useState<any>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getRiders(search || undefined, undefined, accountStatusFilter || undefined);
      setRiders(data);
    } catch (e) {
      console.error('Failed to fetch riders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [search, accountStatusFilter]);

  // Metrics
  const totalCount = riders.length;
  const activeCount = riders.filter(r => r.accountStatus === 'ACTIVE').length;
  const availableCount = riders.filter(r => (r.availabilityStatus || 'AVAILABLE').toUpperCase() === 'AVAILABLE').length;
  const deliveringCount = riders.filter(r => (r.activeDeliveries || 0) > 0).length;
  const inactiveCount = riders.filter(r => r.isActive === false || r.accountStatus === 'INACTIVE').length;

  const handleCreateRider = async (formData: any) => {
    const res = await ApiClient.createRider(formData);
    setCreatedRiderData(res);
    fetchRiders();
  };

  const handleConfirmReset = async () => {
    if (!targetRider) return;
    const res = await ApiClient.resetRiderAccess(targetRider.userId || targetRider.id);
    fetchRiders();
    return res;
  };

  const handleConfirmDeactivate = async () => {
    if (!targetRider) return;
    await ApiClient.deactivateRider(targetRider.userId || targetRider.id);
    fetchRiders();
  };

  const handleReactivate = async (riderId: string) => {
    await ApiClient.reactivateRider(riderId);
    fetchRiders();
  };

  return (
    <View style={[styles.container, { height: Platform.OS === 'web' ? windowHeight - 56 : undefined }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Title Section */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.title}>DELIVERY RIDERS</Text>
            <Text style={styles.subtitle}>Manage delivery riders assigned to this hub.</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)}>
            <Text style={styles.addBtnText}>+ ADD RIDER</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{totalCount}</Text>
            <Text style={styles.metricLabel}>Total Riders</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#16a34a' }]}>{activeCount}</Text>
            <Text style={styles.metricLabel}>Active</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#2563eb' }]}>{availableCount}</Text>
            <Text style={styles.metricLabel}>Available</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#9333ea' }]}>{deliveringCount}</Text>
            <Text style={styles.metricLabel}>Delivering</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#dc2626' }]}>{inactiveCount}</Text>
            <Text style={styles.metricLabel}>Inactive</Text>
          </View>
        </View>

        {/* Search & Filter Bar */}
        <View style={styles.filterRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or phone..."
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

        {/* Loading / Empty / Data Table */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : riders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No delivery riders found for this hub.</Text>
          </View>
        ) : isSmallScreen ? (
          /* Mobile Card View */
          <View style={styles.cardsContainer}>
            {riders.map((r) => (
              <View key={r.userId || r.id} style={styles.riderCard}>
                <View style={styles.cardTop}>
                  <Text style={styles.riderName}>{r.name}</Text>
                  <UserStatusBadge status={r.accountStatus || 'ACTIVE'} />
                </View>
                <Text style={styles.riderPhone}>{r.phone}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.metaLabel}>Availability: <Text style={styles.metaVal}>{r.availabilityStatus || 'AVAILABLE'}</Text></Text>
                  <Text style={styles.metaLabel}>Delivering: <Text style={styles.metaVal}>{r.activeDeliveries || 0}</Text></Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => navigation.navigate('MGRRiderDetail', { riderId: r.userId || r.id })}
                  >
                    <Text style={styles.viewBtnText}>VIEW</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resetAccessBtn}
                    onPress={() => { setTargetRider(r); setShowResetModal(true); }}
                  >
                    <Text style={styles.resetAccessBtnText}>RESET</Text>
                  </TouchableOpacity>
                  {r.isActive !== false ? (
                    <TouchableOpacity
                      style={styles.deactBtn}
                      onPress={() => { setTargetRider(r); setShowDeactivateModal(true); }}
                    >
                      <Text style={styles.deactBtnText}>DEACTIVATE</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.reactBtn}
                      onPress={() => handleReactivate(r.userId || r.id)}
                    >
                      <Text style={styles.reactBtnText}>REACTIVATE</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* Desktop / Tablet Table View */
          <View style={styles.tableCard}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { flex: 2 }]}>Name</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Phone</Text>
              <Text style={[styles.th, { flex: 1.2 }]}>Status</Text>
              <Text style={[styles.th, { flex: 1 }]}>Active Deliv.</Text>
              <Text style={[styles.th, { flex: 1 }]}>Today</Text>
              <Text style={[styles.th, { flex: 1.5 }]}>Account Status</Text>
              <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>Actions</Text>
            </View>

            {riders.map((r, idx) => (
              <View key={r.userId || r.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                <Text style={[styles.td, styles.tdBold, { flex: 2 }]}>{r.name}</Text>
                <Text style={[styles.td, { flex: 1.5 }]}>{r.phone}</Text>
                <View style={{ flex: 1.2 }}>
                  <UserStatusBadge status={r.availabilityStatus || 'AVAILABLE'} type="operational" />
                </View>
                <Text style={[styles.td, { flex: 1 }]}>{r.activeDeliveries || 0}</Text>
                <Text style={[styles.td, { flex: 1 }]}>{r.deliveriesToday || 0}</Text>
                <View style={{ flex: 1.5 }}>
                  <UserStatusBadge status={r.accountStatus || 'ACTIVE'} />
                </View>
                <View style={styles.tdActions}>
                  <TouchableOpacity
                    style={styles.viewBtn}
                    onPress={() => navigation.navigate('MGRRiderDetail', { riderId: r.userId || r.id })}
                  >
                    <Text style={styles.viewBtnText}>VIEW</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.resetAccessBtn}
                    onPress={() => { setTargetRider(r); setShowResetModal(true); }}
                  >
                    <Text style={styles.resetAccessBtnText}>RESET</Text>
                  </TouchableOpacity>
                  {r.isActive !== false ? (
                    <TouchableOpacity
                      style={styles.deactBtn}
                      onPress={() => { setTargetRider(r); setShowDeactivateModal(true); }}
                    >
                      <Text style={styles.deactBtnText}>DEACTIVATE</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.reactBtn}
                      onPress={() => handleReactivate(r.userId || r.id)}
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
      <CreateRiderModal
        visible={showCreateModal}
        onSubmit={handleCreateRider}
        onClose={() => setShowCreateModal(false)}
      />

      <ActivationSuccessModal
        visible={!!createdRiderData}
        data={createdRiderData}
        onClose={() => setCreatedRiderData(null)}
      />

      <ResetAccessModal
        visible={showResetModal}
        userName={targetRider?.name || ''}
        userRole="RIDER"
        onConfirm={handleConfirmReset}
        onClose={() => setShowResetModal(false)}
      />

      <DeactivateAccountModal
        visible={showDeactivateModal}
        userName={targetRider?.name || ''}
        userRole="RIDER"
        onConfirm={handleConfirmDeactivate}
        onClose={() => setShowDeactivateModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  th: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  td: {
    fontSize: 13,
    color: '#334155',
  },
  tdBold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  tdActions: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  viewBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  resetAccessBtn: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  resetAccessBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  deactBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deactBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b91c1c',
  },
  reactBtn: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reactBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803d',
  },
  cardsContainer: {
    gap: 12,
  },
  riderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riderName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  riderPhone: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  metaVal: {
    fontWeight: '700',
    color: '#0f172a',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
});
