import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { UserStatusBadge } from '../../components/credentials/UserStatusBadge';
import { AuditTimeline } from '../../components/credentials/AuditTimeline';
import { ResetAccessModal } from '../../components/credentials/ResetAccessModal';
import { DeactivateAccountModal } from '../../components/credentials/DeactivateAccountModal';

export const ManagerRiderDetailScreen = ({ route, navigation }: { route: any; navigation: any }) => {
  const riderId = route.params?.riderId;

  const [loading, setLoading] = useState(true);
  const [rider, setRider] = useState<any>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getRiderDetail(riderId);
      setRider(data);
    } catch (e) {
      console.error('Failed to fetch rider detail:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (riderId) fetchDetail();
  }, [riderId]);

  const handleConfirmReset = async () => {
    const res = await ApiClient.resetRiderAccess(riderId);
    fetchDetail();
    return res;
  };

  const handleConfirmDeactivate = async () => {
    await ApiClient.deactivateRider(riderId);
    fetchDetail();
  };

  const handleReactivate = async () => {
    await ApiClient.reactivateRider(riderId);
    fetchDetail();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!rider) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Rider not found or unavailable.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header card */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.name}>{rider.name}</Text>
            <Text style={styles.roleLabel}>DELIVERY RIDER • {rider.phone}</Text>
          </View>
          <UserStatusBadge status={rider.accountStatus || 'ACTIVE'} />
        </View>

        <View style={styles.actionBtnRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={() => setShowResetModal(true)}>
            <Text style={styles.resetBtnText}>RESET ACCESS</Text>
          </TouchableOpacity>
          {rider.isActive !== false ? (
            <TouchableOpacity style={styles.deactBtn} onPress={() => setShowDeactivateModal(true)}>
              <Text style={styles.deactBtnText}>DEACTIVATE ACCOUNT</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.reactBtn} onPress={handleReactivate}>
              <Text style={styles.reactBtnText}>REACTIVATE ACCOUNT</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Grid of detail sections */}
      <View style={styles.grid}>
        {/* Profile Info */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>PROFILE INFORMATION</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Full Name</Text>
            <Text style={styles.infoVal}>{rider.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile Number</Text>
            <Text style={styles.infoVal}>{rider.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoVal}>{rider.email || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Emergency Contact</Text>
            <Text style={styles.infoVal}>{rider.emergencyContact || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoVal}>{rider.address || 'Not provided'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Hub</Text>
            <Text style={styles.infoVal}>{rider.hubId || 'Hub #01'}</Text>
          </View>
        </View>

        {/* Operational Stats */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>OPERATIONAL METRICS</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Availability Status</Text>
            <UserStatusBadge status={rider.availabilityStatus || 'AVAILABLE'} type="operational" />
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Active Deliveries</Text>
            <Text style={styles.infoVal}>{rider.activeDeliveries || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Deliveries Today</Text>
            <Text style={styles.infoVal}>{rider.deliveriesToday || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Failed Deliveries</Text>
            <Text style={styles.infoVal}>{rider.failedDeliveries || 0}</Text>
          </View>
        </View>

        {/* Credential & Security Status */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>SECURITY & CREDENTIALS</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Activation Status</Text>
            <Text style={[styles.infoVal, { fontWeight: '800' }]}>{rider.accountStatus}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Credential Reset</Text>
            <Text style={styles.infoVal}>
              {rider.lastCredentialResetAt
                ? new Date(rider.lastCredentialResetAt).toLocaleString()
                : 'Never'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Login</Text>
            <Text style={styles.infoVal}>
              {rider.lastLoginAt ? new Date(rider.lastLoginAt).toLocaleString() : 'Never logged in'}
            </Text>
          </View>
        </View>
      </View>

      {/* Audit Log Timeline */}
      <AuditTimeline logs={rider.auditLogs || []} />

      {/* Modals */}
      <ResetAccessModal
        visible={showResetModal}
        userName={rider.name}
        userRole="RIDER"
        onConfirm={handleConfirmReset}
        onClose={() => setShowResetModal(false)}
      />

      <DeactivateAccountModal
        visible={showDeactivateModal}
        userName={rider.name}
        userRole="RIDER"
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
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
  resetBtn: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetBtnText: { color: '#b45309', fontWeight: '800', fontSize: 12 },
  deactBtn: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  deactBtnText: { color: '#b91c1c', fontWeight: '800', fontSize: 12 },
  reactBtn: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  reactBtnText: { color: '#15803d', fontWeight: '800', fontSize: 12 },
  grid: { gap: 16 },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoLabel: { fontSize: 13, color: '#64748b', fontWeight: '600' },
  infoVal: { fontSize: 13, color: '#0f172a', fontWeight: '700' },
});
