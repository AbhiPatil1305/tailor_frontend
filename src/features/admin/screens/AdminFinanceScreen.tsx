import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, SafeAreaView, TextInput, Modal, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../core/auth/AuthContext';
import { ApiClient as MockApi } from '../../../infrastructure/api/ApiClient';
import { PayoutClaim, Hub, PayoutLedger } from '../../../domain/models/types';
import { UserProfileModal } from '../../../shared/components/UserProfileModal';

export const AdminFinanceScreen = () => {
  const { logout, userName } = useAuth();

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
  const [claims, setClaims] = useState<PayoutClaim[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [ledger, setLedger] = useState<PayoutLedger[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);

  // Transfer modal
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<PayoutClaim | null>(null);
  const [transferRef, setTransferRef] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [pc, h, l, db] = await Promise.all([
      MockApi.getPayoutClaims(),
      MockApi.getHubs(),
      MockApi.getPayoutLedger(),
      MockApi.getDashboardMetrics(),
    ]);
    setClaims(pc);
    setHubs(h);
    setLedger(l);
    setDashboard(db);
  };

  const openTransferModal = (claim: PayoutClaim) => {
    setSelectedClaim(claim);
    setTransferRef('');
    setTransferModalVisible(true);
  };

  const confirmTransfer = async () => {
    if (!selectedClaim) return;
    if (!transferRef.trim()) {
      Alert.alert('Required', 'Please enter the bank/UPI transfer reference number.');
      return;
    }
    await MockApi.updatePayoutClaim(selectedClaim.id, 'admin', 'approved', transferRef);
    setTransferModalVisible(false);
    setSelectedClaim(null);
    await loadData();
    Alert.alert('Transfer Confirmed ✓', `Payout of ₹${selectedClaim.amount} marked as PAID.\nRef: ${transferRef}`);
  };

  const rejectClaim = async (id: string) => {
    await MockApi.updatePayoutClaim(id, 'admin', 'rejected');
    loadData();
  };

  const pendingClaims = claims.filter(c => c.hubManagerApproval === 'approved' && c.adminApproval === 'pending');
  const totalPending = pendingClaims.reduce((s, c) => s + c.amount, 0);
  const paidClaims = claims.filter(c => c.adminApproval === 'approved');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerRole}>Finance & Admin</Text>
          <Text style={styles.headerName}>{userName}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={[styles.logoutBtn, { marginRight: 8 }]} onPress={() => setShowProfile(true)}>
            <Ionicons name="person-outline" size={24} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={24} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>
      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Operations Metrics */}
        {dashboard && (
          <>
            <Text style={styles.sectionTitle}>Franchise Overview</Text>
            <View style={styles.metricsRow}>
              <View style={[styles.metricCard, { borderTopColor: '#3b82f6' }]}>
                <Text style={[styles.metricValue, { color: '#3b82f6' }]}>{dashboard.inProduction}</Text>
                <Text style={styles.metricLabel}>In Production</Text>
              </View>
              <View style={[styles.metricCard, { borderTopColor: '#10b981' }]}>
                <Text style={[styles.metricValue, { color: '#10b981' }]}>{dashboard.deliveredToday}</Text>
                <Text style={styles.metricLabel}>Delivered Today</Text>
              </View>
              <View style={[styles.metricCard, { borderTopColor: '#f59e0b' }]}>
                <Text style={[styles.metricValue, { color: '#f59e0b' }]}>{dashboard.codPending}</Text>
                <Text style={styles.metricLabel}>COD Pending</Text>
              </View>
              <View style={[styles.metricCard, { borderTopColor: '#ef4444' }]}>
                <Text style={[styles.metricValue, { color: '#ef4444' }]}>{dashboard.atRisk}</Text>
                <Text style={styles.metricLabel}>At Risk</Text>
              </View>
            </View>
          </>
        )}

        {/* Pending Finance Approvals */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Step 2: Bank Transfers</Text>
          {totalPending > 0 && (
            <Text style={styles.totalPending}>₹{totalPending} due</Text>
          )}
        </View>
        <Text style={styles.sectionSub}>
          These claims were approved by Hub Managers. Confirm UPI/Bank transfer to finalize payout.
        </Text>

        {pendingClaims.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>✓ Ledger is clear. No pending transfers.</Text>
          </View>
        ) : pendingClaims.map(c => (
          <View key={c.id} style={styles.claimCard}>
            <View style={styles.claimHeader}>
              <View>
                <Text style={styles.claimTailor}>Tailor ID: {c.tailorId}</Text>
                <Text style={styles.claimApproved}>✓ Hub Manager Approved</Text>
                <Text style={styles.claimDate}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</Text>
              </View>
              <Text style={styles.claimAmount}>₹{c.amount}</Text>
            </View>
            <Text style={styles.claimGarments}>{c.ledgerIds.length} garment(s) covered</Text>
            <View style={styles.claimActions}>
              <TouchableOpacity style={styles.transferBtn} onPress={() => openTransferModal(c)}>
                <Text style={styles.transferBtnText}>Confirm Bank Transfer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectClaim(c.id)}>
                <Text style={styles.rejectBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Paid history */}
        {paidClaims.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Paid History</Text>
            {paidClaims.map(c => (
              <View key={c.id} style={[styles.claimCard, { borderLeftColor: '#10b981' }]}>
                <View style={styles.claimHeader}>
                  <View>
                    <Text style={styles.claimTailor}>Tailor: {c.tailorId}</Text>
                    {c.transferReference && (
                      <Text style={styles.claimRef}>Ref: {c.transferReference}</Text>
                    )}
                  </View>
                  <Text style={[styles.claimAmount, { color: '#10b981' }]}>₹{c.amount} ✓</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Hub Network */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Franchise Hubs ({hubs.length})</Text>
        {hubs.map(h => (
          <View key={h.id} style={styles.hubCard}>
            <Text style={styles.hubIcon}>🏭</Text>
            <View>
              <Text style={styles.hubName}>{h.name}</Text>
              <Text style={styles.hubLocation}>{h.location}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Transfer Reference Modal */}
      <Modal visible={transferModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Confirm Bank Transfer</Text>
            {selectedClaim && (
              <Text style={styles.modalSub}>₹{selectedClaim.amount} to Tailor {selectedClaim.tailorId}</Text>
            )}
            <Text style={styles.inputLabel}>Transfer / UTR Reference Number</Text>
            <TextInput
              style={styles.input}
              value={transferRef}
              onChangeText={setTransferRef}
              placeholder="e.g. UTR12345678 or UPI Ref"
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmTransfer}>
              <Text style={styles.confirmBtnText}>Mark as PAID</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setTransferModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerRole: { fontSize: 13, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerName: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  logoutBtn: { padding: 4 },

  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 60 },

  metricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metricCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderTopWidth: 3 },
  metricValue: { fontSize: 26, fontWeight: '900', marginBottom: 4 },
  metricLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  totalPending: { fontSize: 16, fontWeight: '800', color: '#ef4444' },
  sectionSub: { fontSize: 13, color: '#64748b', lineHeight: 18, marginBottom: 16 },

  emptyBox: { backgroundColor: '#f0fdf4', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  emptyText: { color: '#16a34a', fontWeight: '700' },

  claimCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#10b981', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  claimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  claimTailor: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  claimApproved: { fontSize: 12, color: '#10b981', fontWeight: '700' },
  claimDate: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  claimRef: { fontSize: 12, color: '#64748b' },
  claimAmount: { fontSize: 24, fontWeight: '900', color: '#1e293b' },
  claimGarments: { fontSize: 13, color: '#64748b', marginBottom: 14 },
  claimActions: { flexDirection: 'row', gap: 8 },
  transferBtn: { flex: 1, backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  transferBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  rejectBtn: { width: 44, backgroundColor: '#fee2e2', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  rejectBtnText: { color: '#ef4444', fontWeight: '800', fontSize: 15 },

  hubCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  hubIcon: { fontSize: 28, marginRight: 16 },
  hubName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  hubLocation: { fontSize: 13, color: '#64748b', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1e293b', marginBottom: 16 },
  confirmBtn: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '600' },
});
