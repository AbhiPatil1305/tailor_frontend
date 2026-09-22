import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ApiClient } from '../../../infrastructure/api/ApiClient';
import { OfflineBanner } from '../components/OfflineBanner';

export const TailorEarningsScreen = () => {
  const navigation = useNavigation<any>();
  const [ledger, setLedger] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const loadData = useCallback(async (showIndicator = true) => {
    if (showIndicator) setLoading(true);
    try {
      const [sumData, ledgData] = await Promise.all([
        ApiClient.getPayoutSummary(),
        ApiClient.getMyPayoutLedger()
      ]);
      setSummary(sumData);
      setLedger(ledgData);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <SafeAreaView style={styles.safe}>
      <OfflineBanner visible={!isOnline} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Earnings</Text>
        <TouchableOpacity 
          style={styles.claimBtn}
          onPress={() => navigation.navigate('TailorPayoutClaims')}
        >
          <Text style={styles.claimBtnText}>My Claims</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6d28d9" /></View>
      ) : (
        <FlatList
          data={ledger}
          keyExtractor={item => item._id || item.id}
          refreshing={refreshing}
          onRefresh={() => loadData(false)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <View style={styles.sumRow}>
                <View>
                  <Text style={styles.sumLabel}>Total Earnings</Text>
                  <Text style={styles.sumValPrimary}>₹{summary.total_earned?.toLocaleString() || 0}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.sumLabel}>Pending Claim</Text>
                  <Text style={styles.sumValSecondary}>₹{summary.pending_amount?.toLocaleString() || 0}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.sumRowSmall}>
                <Text style={styles.sumLabel}>Claimed (Processing)</Text>
                <Text style={styles.sumValSmall}>₹{summary.claimed_amount?.toLocaleString() || 0}</Text>
              </View>
              <View style={styles.sumRowSmall}>
                <Text style={styles.sumLabel}>Paid Out</Text>
                <Text style={[styles.sumValSmall, { color: '#10b981' }]}>₹{summary.paid_amount?.toLocaleString() || 0}</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => navigation.navigate('TailorPayoutClaims')}
                disabled={summary.pending_amount <= 0}
              >
                <Text style={styles.actionBtnText}>
                  {summary.pending_amount > 0 ? 'Raise Claim Now' : 'No Pending Earnings to Claim'}
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text style={styles.itemRef}>Order {item.orderId?.substring(0, 8)}...</Text>
                <Text style={[styles.itemAmt, item.status === 'PAID' && { color: '#10b981' }]}>
                  ₹{item.amount}
                </Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.itemDate}>{new Date(item.earnedAt).toLocaleDateString()}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusBg(item.status) }]}>
                  <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💸</Text>
              <Text style={styles.emptyTitle}>No earnings yet</Text>
              <Text style={styles.emptyText}>Complete stitching assignments to earn payouts.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const getStatusBg = (s: string) => {
  if (s === 'PAID') return '#dcfce7';
  if (s === 'CLAIMED') return '#fef3c7';
  return '#f1f5f9';
};

const getStatusColor = (s: string) => {
  if (s === 'PAID') return '#15803d';
  if (s === 'CLAIMED') return '#b45309';
  return '#475569';
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  claimBtn: { backgroundColor: '#f3e8ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  claimBtnText: { color: '#6d28d9', fontSize: 13, fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryCard: { backgroundColor: '#6d28d9', borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#6d28d9', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sumLabel: { color: '#c4b5fd', fontSize: 12, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  sumValPrimary: { color: '#ffffff', fontSize: 28, fontWeight: '900' },
  sumValSecondary: { color: '#fef3c7', fontSize: 22, fontWeight: '800' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 12 },
  sumRowSmall: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  sumValSmall: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  actionBtn: { backgroundColor: '#ffffff', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 },
  actionBtnText: { color: '#6d28d9', fontSize: 14, fontWeight: '800' },
  itemCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemRef: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  itemAmt: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  itemDate: { fontSize: 12, color: '#64748b' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b' },
});
