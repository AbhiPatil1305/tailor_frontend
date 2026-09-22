import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { LeaveRequest } from '../../../../domain/models/types';
import { FilterBar } from '../../components/manager/FilterBar';
import { ConfirmModal } from '../../components/manager/ConfirmModal';

type LeaveTab = 'pending' | 'approved' | 'rejected';

const TAB_OPTIONS: { key: LeaveTab; label: string }[] = [
  { key: 'pending',  label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const STATUS_COLORS = {
  pending:  { bg: '#fffbeb', text: '#d97706', border: '#fcd34d' },
  approved: { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  rejected: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
};

export const ManagerLeaveScreen = () => {
  const { hubId } = useAuth();

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<LeaveTab>('pending');
  const [actionLoading, setActionLoading] = useState(false);

  // Selected request for action
  const [selected, setSelected] = useState<LeaveRequest | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await ApiClient.getLeaveRequests(hubId || undefined);
      setRequests(data);
    } catch { setRequests([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [hubId]);

  useEffect(() => { load(); }, [load]);

  const filtered = requests.filter(r => r.status === tab);

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await ApiClient.approveLeaveRequest(selected.id);
      Alert.alert('Approved', `Leave for ${selected.tailorName} approved.`);
      setShowApprove(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    if (!rejectReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a reason for rejection');
      return;
    }
    setActionLoading(true);
    try {
      await ApiClient.rejectLeaveRequest(selected.id, rejectReason);
      Alert.alert('Rejected', `Leave for ${selected.tailorName} rejected.`);
      setShowReject(false);
      setRejectReason('');
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Leave Requests</Text>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingCount}>{requests.filter(r => r.status === 'pending').length}</Text>
        </View>
      </View>

      <View style={styles.filterWrap}>
        <FilterBar options={TAB_OPTIONS} selected={tab} onSelect={setTab} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#7c3aed" /></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={r => r.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7c3aed" />}
          contentContainerStyle={styles.list}
          renderItem={({ item: r }) => {
            const sc = STATUS_COLORS[r.status];
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => { setSelected(r); }}
                activeOpacity={0.9}
              >
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{r.tailorName.charAt(0)}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.tailorName}>{r.tailorName}</Text>
                    <Text style={styles.date}>📅 {r.date}</Text>
                    {r.reason && <Text style={styles.reason} numberOfLines={2}>{r.reason}</Text>}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{r.status.toUpperCase()}</Text>
                  </View>
                </View>

                {r.status === 'pending' && (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => { setSelected(r); setShowReject(true); }}
                    >
                      <Text style={styles.rejectText}>✗ REJECT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.approveBtn}
                      onPress={() => { setSelected(r); setShowApprove(true); }}
                    >
                      <Text style={styles.approveText}>✓ APPROVE</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🗓️</Text>
              <Text style={styles.emptyText}>No {tab} requests</Text>
            </View>
          }
        />
      )}

      {/* Approve modal */}
      <ConfirmModal
        visible={showApprove}
        title="Approve Leave"
        message={`Approve leave for ${selected?.tailorName} on ${selected?.date}?\n\n⚠️ Check if this tailor has garments assigned before approving.`}
        confirmLabel="APPROVE"
        confirmColor="#16a34a"
        loading={actionLoading}
        onConfirm={handleApprove}
        onCancel={() => setShowApprove(false)}
      />

      {/* Reject modal */}
      <Modal visible={showReject} transparent animationType="fade" onRequestClose={() => setShowReject(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.card}>
            <Text style={modalStyles.title}>Reject Leave Request</Text>
            <Text style={modalStyles.sub}>Tailor: {selected?.tailorName} · Date: {selected?.date}</Text>
            <Text style={modalStyles.label}>REASON FOR REJECTION *</Text>
            <TextInput
              style={modalStyles.input}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="Enter reason..."
              multiline
              numberOfLines={3}
            />
            <View style={modalStyles.actions}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => { setShowReject(false); setRejectReason(''); }}>
                <Text style={modalStyles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.rejectBtn} onPress={handleReject} disabled={actionLoading}>
                <Text style={modalStyles.rejectText}>{actionLoading ? 'REJECTING...' : 'REJECT'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400 },
  title: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  sub: { fontSize: 13, color: '#64748b', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: '#64748b', letterSpacing: 1, marginBottom: 8 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 15, color: '#1e293b', backgroundColor: '#f8fafc', marginBottom: 20, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  rejectBtn: { flex: 1, backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  rejectText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { flex: 1, fontSize: 26, fontWeight: '900', color: '#1e293b' },
  pendingBadge: { backgroundColor: '#fef3c7', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  pendingCount: { color: '#d97706', fontWeight: '800', fontSize: 16 },
  filterWrap: { paddingHorizontal: 20, marginBottom: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#7c3aed' },
  info: { flex: 1 },
  tailorName: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  date: { fontSize: 13, color: '#64748b', marginBottom: 3 },
  reason: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  statusBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  actions: { flexDirection: 'row', gap: 10 },
  rejectBtn: { flex: 1, borderWidth: 1.5, borderColor: '#fca5a5', borderRadius: 10, paddingVertical: 10, alignItems: 'center', backgroundColor: '#fef2f2' },
  rejectText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  approveBtn: { flex: 1, backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  approveText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#64748b' },
});
