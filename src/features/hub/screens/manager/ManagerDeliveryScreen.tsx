import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { Garment } from '../../../../domain/models/types';
import { FilterBar } from '../../components/manager/FilterBar';
import { SLABadge } from '../../components/manager/SLABadge';
import { ConfirmModal } from '../../components/manager/ConfirmModal';

type DeliveryTab = 'packed' | 'dispatched' | 'out_for_delivery' | 'delivered';

const TAB_OPTIONS: { key: DeliveryTab; label: string; color: string }[] = [
  { key: 'packed',           label: 'Packed',      color: '#10b981' },
  { key: 'dispatched',       label: 'Dispatched',  color: '#0ea5e9' },
  { key: 'out_for_delivery', label: 'Out',         color: '#6366f1' },
  { key: 'delivered',        label: 'Delivered',   color: '#16a34a' },
];

export const ManagerDeliveryScreen = () => {
  const { hubId, userId } = useAuth();
  const navigation = useNavigation<any>();

  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<DeliveryTab>('packed');
  const [selected, setSelected] = useState<Garment | null>(null);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ApiClient.getGarments({ hubId: hubId || undefined, stage: tab });
      setGarments(data);
    } catch { setGarments([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [hubId, tab]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const handleDispatch = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await ApiClient.dispatchGarment(selected.id, userId || 'manager');
      Alert.alert('Dispatched', `${selected.qrCode} dispatched successfully`);
      setShowDispatchModal(false);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const tabInfo = TAB_OPTIONS.find(t => t.key === tab)!;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Dispatch & Delivery</Text>
        <View style={[styles.countBadge, { backgroundColor: tabInfo.color + '20' }]}>
          <Text style={[styles.countText, { color: tabInfo.color }]}>{garments.length}</Text>
        </View>
      </View>

      <View style={styles.filterWrap}>
        <FilterBar
          options={TAB_OPTIONS.map(t => ({ key: t.key, label: t.label }))}
          selected={tab}
          onSelect={setTab}
          accentColor={tabInfo.color}
        />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#7c3aed" /></View>
      ) : (
        <FlatList
          data={garments}
          keyExtractor={g => g.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7c3aed" />}
          contentContainerStyle={styles.list}
          renderItem={({ item: g }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('MGRGarmentDetail', { garmentId: g.id })}
              activeOpacity={0.9}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.garmentId}>{g.qrCode}</Text>
                  <Text style={styles.meta}>{g.type} · {g.gender}</Text>
                  <Text style={styles.orderId}>Order: {g.orderId}</Text>
                </View>
                <SLABadge garment={g} compact />
              </View>

              {tab === 'packed' && (
                <TouchableOpacity
                  style={styles.dispatchBtn}
                  onPress={() => { setSelected(g); setShowDispatchModal(true); }}
                >
                  <Text style={styles.dispatchBtnText}>🚚 MARK DISPATCHED</Text>
                </TouchableOpacity>
              )}

              {tab === 'delivered' && g.codCollected === false && (
                <View style={styles.codAlert}>
                  <Text style={styles.codAlertText}>⚠️ COD not yet collected</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚚</Text>
              <Text style={styles.emptyText}>No garments in {tab.replace('_', ' ')}</Text>
            </View>
          }
        />
      )}

      <ConfirmModal
        visible={showDispatchModal}
        title="Confirm Dispatch"
        message={`Mark garment ${selected?.qrCode} as dispatched?\n\nOrder: ${selected?.orderId}`}
        confirmLabel="DISPATCH NOW"
        confirmColor="#0ea5e9"
        loading={actionLoading}
        onConfirm={handleDispatch}
        onCancel={() => setShowDispatchModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { flex: 1, fontSize: 26, fontWeight: '900', color: '#1e293b' },
  countBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
  countText: { fontSize: 16, fontWeight: '800' },
  filterWrap: { paddingHorizontal: 20, marginBottom: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardInfo: { flex: 1 },
  garmentId: { fontSize: 15, fontWeight: '800', color: '#1e293b', fontFamily: 'Courier New', marginBottom: 4 },
  meta: { fontSize: 12, color: '#64748b', textTransform: 'capitalize', marginBottom: 2 },
  orderId: { fontSize: 11, color: '#94a3b8', fontFamily: 'Courier New' },
  dispatchBtn: { backgroundColor: '#0ea5e9', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  dispatchBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  codAlert: { backgroundColor: '#fef3c7', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginTop: 8 },
  codAlertText: { color: '#d97706', fontWeight: '600', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#64748b', textTransform: 'capitalize' },
});
