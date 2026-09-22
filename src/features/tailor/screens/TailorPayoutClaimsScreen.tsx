import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ApiClient } from '../../../infrastructure/api/ApiClient';

export const TailorPayoutClaimsScreen = () => {
  const navigation = useNavigation<any>();
  const [claims, setClaims] = useState<any[]>([]);
  const [pendingLedger, setPendingLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimLoading, setClaimLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cData, lData] = await Promise.all([
        ApiClient.getMyPayoutClaims(),
        ApiClient.getMyPayoutLedger({ status: 'PENDING' }),
      ]);
      setClaims(cData);
      setPendingLedger(lData);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleRaiseClaim = async () => {
    if (selectedIds.size === 0) return;
    setClaimLoading(true);
    try {
      await ApiClient.raisePayoutClaimFromLedger(Array.from(selectedIds));
      setSelectedIds(new Set());
      await loadData();
      Alert.alert('Success', 'Claim raised successfully. It will be reviewed by your Hub Manager.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setClaimLoading(false);
    }
  };

  const pendingTotal = pendingLedger
    .filter(item => selectedIds.has(item._id || item.id))
    .reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const renderClaim = ({ item }: { item: any }) => (
    <View style={styles.claimCard}>
      <View style={styles.claimHeader}>
        <Text style={styles.claimId}>Claim {item._id?.substring(0, 8).toUpperCase()}</Text>
        <Text style={styles.claimAmt}>₹{item.totalAmount}</Text>
      </View>
      <View style={styles.claimFooter}>
        <Text style={styles.claimDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.claimStatus}>{item.status.replace(/_/g, ' ')}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Claims</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6d28d9" /></View>
      ) : (
        <ScrollView style={styles.scroll}>
          {pendingLedger.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available to Claim</Text>
              {pendingLedger.map((item) => {
                const id = item._id || item.id;
                const isSelected = selectedIds.has(id);
                return (
                  <TouchableOpacity 
                    key={id} 
                    style={[styles.ledgerItem, isSelected && styles.ledgerItemSelected]}
                    onPress={() => toggleSelect(id)}
                  >
                    <View style={styles.radio}>
                      {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ledgerRef}>Order {item.orderId?.substring(0, 8)}</Text>
                      <Text style={styles.ledgerDate}>{new Date(item.earnedAt).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.ledgerAmt}>₹{item.amount}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.actionBox}>
                <View style={styles.actionRow}>
                  <Text style={styles.actionLabel}>Selected Total:</Text>
                  <Text style={styles.actionAmt}>₹{pendingTotal.toFixed(2)}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.btn, selectedIds.size === 0 && styles.btnDisabled]}
                  onPress={handleRaiseClaim}
                  disabled={selectedIds.size === 0 || claimLoading}
                >
                  {claimLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Raise Claim</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Claims</Text>
            {claims.length > 0 ? (
              claims.map(c => <React.Fragment key={c._id || c.id}>{renderClaim({ item: c })}</React.Fragment>)
            ) : (
              <Text style={styles.emptyText}>No past claims found.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

// Needs ScrollView
import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 24, color: '#1e293b' },
  title: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  ledgerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  ledgerItemSelected: { borderColor: '#6d28d9', backgroundColor: '#faf5ff' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6d28d9' },
  ledgerRef: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  ledgerDate: { fontSize: 12, color: '#64748b', marginTop: 2 },
  ledgerAmt: { fontSize: 16, fontWeight: '800', color: '#10b981' },
  actionBox: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  actionLabel: { fontSize: 15, fontWeight: '600', color: '#475569' },
  actionAmt: { fontSize: 24, fontWeight: '900', color: '#6d28d9' },
  btn: { backgroundColor: '#6d28d9', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#cbd5e1' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  claimCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10 },
  claimHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  claimId: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  claimAmt: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  claimFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  claimDate: { fontSize: 12, color: '#64748b' },
  claimStatus: { fontSize: 11, fontWeight: '700', color: '#f59e0b', textTransform: 'uppercase' },
  emptyText: { color: '#64748b', fontSize: 14, fontStyle: 'italic' },
});
