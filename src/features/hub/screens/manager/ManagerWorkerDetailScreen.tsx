import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { UserStatusBadge } from '../../components/credentials/UserStatusBadge';
import { AuditTimeline } from '../../components/credentials/AuditTimeline';
import { ResetAccessModal } from '../../components/credentials/ResetAccessModal';
import { DeactivateAccountModal } from '../../components/credentials/DeactivateAccountModal';

export const ManagerWorkerDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const workerId = route.params?.workerId;

  const [loading, setLoading] = useState(true);
  const [worker, setWorker] = useState<any>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getWorkerDetail(workerId);
      setWorker(data);
    } catch (e) {
      console.error('Failed to fetch worker detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workerId) fetchDetail();
  }, [workerId]);

  const handleConfirmReset = async () => {
    const res = await ApiClient.resetWorkerAccess(workerId);
    fetchDetail();
    return res;
  };

  const handleConfirmDeactivate = async () => {
    await ApiClient.deactivateWorker(workerId);
    fetchDetail();
  };

  const handleReactivate = async () => {
    await ApiClient.reactivateWorker(workerId);
    fetchDetail();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!worker) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Hub worker not found or unavailable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.name}>{worker.name}</Text>
            <Text style={styles.roleLabel}>{worker.role} • {worker.phone}</Text>
          </View>
          <UserStatusBadge status={worker.accountStatus || 'ACTIVE'} />
        </View>

        <View style={styles.actionBtnRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={() => setShowResetModal(true)}>
            <Text style={styles.resetBtnText}>RESET ACCESS</Text>
          </TouchableOpacity>
          {worker.isActive !== false ? (
            <TouchableOpacity style={styles.deactBtn} onPress={() => setShowDeactivateModal(true)}>
              <Text style={styles.deactBtnText}>DEACTIVATE</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.reactBtn} onPress={handleReactivate}>
              <Text style={styles.reactBtnText}>REACTIVATE</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Grid of Sections */}
      <View style={styles.grid}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PROFILE INFORMATION</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoVal}>{worker.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoVal}>{worker.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoVal}>{worker.email || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Operational Role</Text>
            <Text style={styles.infoVal}>{worker.role}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Hub</Text>
            <Text style={styles.infoVal}>{worker.hubId || 'Hub #01'}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>STATION & PERMISSIONS</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Station Assignments</Text>
            <Text style={styles.infoVal}>Cutting, Intake, Packing, QC</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role Elevation</Text>
            <Text style={[styles.infoVal, { color: '#64748b' }]}>Restricted (Cannot grant Manager/Admin)</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SECURITY & LOGINS</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <Text style={[styles.infoVal, { fontWeight: '800' }]}>{worker.accountStatus}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Login</Text>
            <Text style={styles.infoVal}>
              {worker.lastLoginAt ? new Date(worker.lastLoginAt).toLocaleString() : 'Never logged in'}
            </Text>
          </View>
        </View>
      </View>

      {/* Audit Logs */}
      <AuditTimeline logs={worker.auditLogs || []} />

      {/* Modals */}
      <ResetAccessModal
        visible={showResetModal}
        userName={worker.name}
        userRole="HUB_STAFF"
        onConfirm={handleConfirmReset}
        onClose={() => setShowResetModal(false)}
      />

      <DeactivateAccountModal
        visible={showDeactivateModal}
        userName={worker.name}
        userRole="HUB_STAFF"
        onConfirm={handleConfirmDeactivate}
        onClose={() => setShowDeactivateModal(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { fontSize: 14, color: '#dc2626' },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  roleLabel: { fontSize: 13, color: '#64748b', fontWeight: '700', marginTop: 2 },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  resetBtn: { backgroundColor: '#fef3c7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  resetBtnText: { color: '#b45309', fontWeight: '800', fontSize: 12 },
  deactBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  deactBtnText: { color: '#b91c1c', fontWeight: '800', fontSize: 12 },
  reactBtn: { backgroundColor: '#dcfce7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  reactBtnText: { color: '#15803d', fontWeight: '800', fontSize: 12 },
  grid: { gap: 16 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#475569', letterSpacing: 0.5, marginBottom: 12 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f8fafc',
  },
  infoLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  infoVal: { fontSize: 13, color: '#0f172a', fontWeight: '700' },
});
