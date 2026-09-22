import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { PayoutClaim } from '../../../../domain/models/types';
import { FilterBar } from '../../components/manager/FilterBar';
import { ConfirmModal } from '../../components/manager/ConfirmModal';

type PayoutTab = 'pending' | 'approved' | 'paid';

const STATUS_COLORS = {
  pending:  { bg: '#fffbeb', text: '#d97706', border: '#fcd34d' },
  approved: { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  paid:     { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
};

export const ManagerPayoutScreen = () => {
  const { hubId } = useAuth();

  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<PayoutTab>('pending');
  const [selected, setSelected] = useState<PayoutClaim | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ApiClient.getPayoutClaims(hubId || undefined, tab === 'approved' ? 'manager_approved' : tab);
      setClaims(data);
    } catch { setClaims([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [hubId, tab]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const handleApprove = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await ApiClient.approvePayoutClaim(selected.id);
      Alert.alert('Approved', `Payout claim for ₹${selected.amount} approved`);
      setConfirmVisible(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingTotal = claims
    .filter(c => c.hubManagerApproval === 'pending' || c.status === 'pending')
    .reduce((s, c) => s + (c.amount || 0), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Payout Claims</Text>
      </View>

      {/* Summary */}
      {tab === 'pending' && claims.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total Pending Approval</Text>
          <Text style={styles.summaryAmount}>₹{pendingTotal.toLocaleString()}</Text>
        </View>
      )}

      <View style={styles.filterWrap}>
        <FilterBar
          options={[
            { key: 'pending'  as PayoutTab, label: 'Pending' },
            { key: 'approved' as PayoutTab, label: 'Approved' },
            { key: 'paid'     as PayoutTab, label: 'Paid' },
          ]}
          selected={tab}
          onSelect={setTab}
          accentColor={tab === 'paid' ? '#2563eb' : tab === 'approved' ? '#16a34a' : '#d97706'}
        />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#7c3aed" /></View>
      ) : (
        <FlatList
          data={claims}
          keyExtractor={c => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7c3aed" />}
          contentContainerStyle={styles.list}
          renderItem={({ item: c }) => {
            const claimStatus: string = c.status || (c.hubManagerApproval === 'pending' ? 'pending' : c.hubManagerApproval === 'approved' ? 'approved' : 'paid');
            const sc = STATUS_COLORS[claimStatus as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.pending;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{c.tailorName.charAt(0)}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.tailorName}>{c.tailorName}</Text>
                    <Text style={styles.period}>{c.period}</Text>
                    <Text style={styles.garmentCount}>{c.garmentCount} garments</Text>
                  </View>
                  <View style={styles.amountWrap}>
                    <Text style={styles.amount}>₹{c.amount.toLocaleString()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                      <Text style={[styles.statusText, { color: sc.text }]}>{c.status.toUpperCase()}</Text>
                    </View>
                  </View>
                </View>

                {/* Breakdown */}
                {c.breakdown && (
                  <View style={styles.breakdown}>
                    {Object.entries(c.breakdown).map(([type, amt]) => (
                      <View key={type} style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>{type}</Text>
                        <Text style={styles.breakdownAmount}>₹{(amt as number).toLocaleString()}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {c.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() => { setSelected(c); setConfirmVisible(true); }}
                  >
                    <Text style={styles.approveBtnText}>✓ APPROVE PAYOUT</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyText}>No {tab} claims</Text>
            </View>
          }
        />
      )}

      <ConfirmModal
        visible={confirmVisible}
        title="Approve Payout"
        message={`Approve ₹${(selected as any)?.amount?.toLocaleString()} payout to ${(selected as any)?.tailorName ?? (selected as any)?.tailorId} for ${(selected as any)?.period ?? 'this period'}?\n\n${(selected as any)?.garmentCount ?? (selected as any)?.ledgerIds?.length ?? 0} garments processed.`}
        confirmLabel="APPROVE PAYOUT"
        confirmColor="#16a34a"
        loading={actionLoading}
        onConfirm={handleApprove}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  summary: { marginHorizontal: 20, marginBottom: 12, backgroundColor: '#7c3aed', borderRadius: 16, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { color: '#c4b5fd', fontSize: 13, fontWeight: '600' },
  summaryAmount: { color: '#fff', fontSize: 28, fontWeight: '900' },
  filterWrap: { paddingHorizontal: 20, marginBottom: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#7c3aed' },
  info: { flex: 1 },
  tailorName: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  period: { fontSize: 13, color: '#64748b', marginBottom: 2 },
  garmentCount: { fontSize: 12, color: '#94a3b8' },
  amountWrap: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  statusBadge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  breakdown: { backgroundColor: '#f8fafc', borderRadius: 10, padding: 12, marginBottom: 12, gap: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownLabel: { fontSize: 12, color: '#64748b', textTransform: 'capitalize' },
  breakdownAmount: { fontSize: 12, fontWeight: '700', color: '#1e293b' },
  approveBtn: { backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#64748b' },
});
