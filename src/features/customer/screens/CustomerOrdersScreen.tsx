import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, RefreshControl } from 'react-native';
import { MockApi } from '../../../infrastructure/api/MockApi';
import { Order } from '../../../domain/models/types';
import { EmptyState } from '../../../shared/components/EmptyState';
import { LoadingState } from '../../../shared/components/LoadingState';

interface Props { onTrack: (ref: string) => void; }

export const CustomerOrdersScreen = ({ onTrack }: Props) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await MockApi.getOrders();
    setOrders(data.filter((o: Order) => o.customerId === 'c1').reverse());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, []);

  const statusVariant = (status: string) => {
    switch(status) {
      case 'paid': return { bg: '#dcfce7', text: '#16a34a', label: 'PAID' };
      case 'cod_collected': return { bg: '#dcfce7', text: '#16a34a', label: 'COD ✓' };
      case 'cod_pending': return { bg: '#fef3c7', text: '#d97706', label: 'COD' };
      default: return { bg: '#f1f5f9', text: '#475569', label: 'PENDING' };
    }
  };

  if (loading) return <LoadingState message="Loading your orders..." />;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>My Orders</Text>
        <Text style={s.count}>{orders.length} order{orders.length !== 1 ? 's' : ''}</Text>
      </View>
      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={[s.list, orders.length === 0 && s.listEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        ListEmptyComponent={
          <EmptyState
            icon="📦"
            title="No orders yet"
            subtitle="Book your first stitching order and track every garment in real time."
          />
        }
        renderItem={({ item: o }) => {
          const st = statusVariant(o.paymentStatus);
          return (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={s.refRow}>
                  <Text style={s.ref}>{o.trackingReference}</Text>
                  <View style={[s.badge, { backgroundColor: st.bg }]}>
                    <Text style={[s.badgeText, { color: st.text }]}>{st.label}</Text>
                  </View>
                </View>
                <Text style={s.date}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
              </View>
              <View style={s.divider} />
              <View style={s.cardBottom}>
                <View style={s.meta}>
                  <Text style={s.metaLabel}>Garments</Text>
                  <Text style={s.metaValue}>{o.garments.length}</Text>
                </View>
                <View style={s.meta}>
                  <Text style={s.metaLabel}>Amount</Text>
                  <Text style={s.metaValue}>₹{o.totalAmount}</Text>
                </View>
                <View style={s.meta}>
                  <Text style={s.metaLabel}>Payment</Text>
                  <Text style={s.metaValue}>{o.paymentMethod.toUpperCase()}</Text>
                </View>
                <TouchableOpacity style={s.trackBtn} onPress={() => onTrack(o.trackingReference)}>
                  <Text style={s.trackBtnText}>Track →</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  count: { fontSize: 14, color: '#94a3b8', fontWeight: '600' },
  list: { flexGrow: 1, padding: 16, paddingTop: 4, paddingBottom: 40 },
  listEmpty: { flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 14, overflow: 'hidden', elevation: 2 },
  cardTop: { padding: 16, paddingBottom: 12 },
  refRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  ref: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  date: { fontSize: 13, color: '#94a3b8' },
  divider: { height: 1, backgroundColor: '#f1f5f9' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  meta: { flex: 1 },
  metaLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 2 },
  metaValue: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  trackBtn: { backgroundColor: '#1e293b', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  trackBtnText: { color: '#f59e0b', fontWeight: '800', fontSize: 13 },
});
