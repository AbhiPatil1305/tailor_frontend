import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, ScrollView } from 'react-native';
import { MockApi } from '../../../infrastructure/api/MockApi';
import { Order, Garment } from '../../../domain/models/types';
import { SLAIndicator } from '../../../shared/components/SLAIndicator';
import { EmptyState } from '../../../shared/components/EmptyState';
import { LoadingState } from '../../../shared/components/LoadingState';

const STAGE_ORDER = ['booked','intake','cutting','stitching','qc','ironing','packed','dispatched','out_for_delivery','delivered'];
const STAGE_LABELS: Record<string, string> = {
  booked: 'Booked', intake: 'Received at Hub', cutting: 'Cutting',
  stitching: 'Stitching', qc: 'Quality Check', ironing: 'Ironing',
  packed: 'Packed', dispatched: 'Dispatched', out_for_delivery: 'Out for Delivery', delivered: 'Delivered ✓'
};

interface Props { selectedRef?: string; }

export const CustomerTrackingScreen = ({ selectedRef }: Props) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MockApi.getOrders().then((data: Order[]) => {
      const myOrders = data.filter((o: Order) => o.customerId === 'c1').reverse();
      setOrders(myOrders);
      if (selectedRef) {
        const found = myOrders.find(o => o.trackingReference === selectedRef);
        if (found) setSelectedOrder(found);
      } else if (myOrders.length === 1) {
        setSelectedOrder(myOrders[0]);
      }
      setLoading(false);
    });
  }, [selectedRef]);

  if (loading) return <LoadingState message="Loading tracking info..." />;

  if (!selectedOrder) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}><Text style={s.title}>Track Order</Text></View>
        {orders.length === 0 ? (
          <EmptyState icon="📍" title="No orders to track" subtitle="Book an order first and track every garment in real time." />
        ) : (
          <FlatList
            data={orders}
            keyExtractor={o => o.id}
            contentContainerStyle={s.list}
            ListHeaderComponent={<Text style={s.selectHint}>Select an order to track</Text>}
            renderItem={({ item: o }) => (
              <TouchableOpacity style={s.orderPill} onPress={() => setSelectedOrder(o)}>
                <View><Text style={s.pillRef}>{o.trackingReference}</Text><Text style={s.pillMeta}>{o.garments.length} garments · {o.paymentMethod.toUpperCase()}</Text></View>
                <Text style={s.pillChev}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  const overallStageIdx = Math.min(...selectedOrder.garments.map((g: Garment) => STAGE_ORDER.indexOf(g.stage)));

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.trackScroll}>
        <View style={s.trackHeader}>
          <TouchableOpacity onPress={() => setSelectedOrder(null)} style={s.backBtn}>
            <Text style={s.backText}>← Orders</Text>
          </TouchableOpacity>
          <View style={s.refBox}>
            <Text style={s.trackRef}>{selectedOrder.trackingReference}</Text>
            <Text style={s.trackMeta}>{selectedOrder.garments.length} garments · {selectedOrder.paymentMethod.toUpperCase()}</Text>
          </View>
          {selectedOrder.garments[0]?.slaDeadline && <SLAIndicator slaDeadline={selectedOrder.garments[0].slaDeadline} />}
        </View>

        {/* Overall pipeline */}
        <View style={s.pipelineCard}>
          <Text style={s.pipelineTitle}>Order Status</Text>
          {STAGE_ORDER.filter(st => st !== 'rework').map((stage, idx, arr) => {
            const done = overallStageIdx >= idx;
            const isCurrent = overallStageIdx === idx;
            return (
              <View key={stage} style={s.timelineRow}>
                <View style={s.timelineLeft}>
                  <View style={[s.dot, done ? s.dotDone : s.dotPending, isCurrent && s.dotCurrent]} />
                  {idx < arr.length - 1 && <View style={[s.connector, done && s.connectorDone]} />}
                </View>
                <Text style={[s.stageLabel, done && s.stageLabelDone, isCurrent && s.stageLabelCurrent]}>
                  {STAGE_LABELS[stage]}{isCurrent ? '  ← Now' : ''}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Per-garment breakdown */}
        <Text style={s.sectionTitle}>Garment Details</Text>
        {selectedOrder.garments.map((g: Garment) => (
          <View key={g.id} style={s.garmentCard}>
            <View style={s.garmentHeader}>
              <Text style={s.garmentType}>{g.type} ({g.gender})</Text>
              <Text style={s.garmentQr}>{g.qrCode}</Text>
            </View>
            <SLAIndicator slaDeadline={g.slaDeadline} compact />
            <View style={[s.stagePill, { marginTop: 8 }]}>
              <Text style={s.stagePillText}>{STAGE_LABELS[g.stage] || g.stage}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '900', color: '#1e293b' },
  list: { padding: 16, paddingBottom: 40 },
  selectHint: { fontSize: 14, color: '#64748b', marginBottom: 12, fontWeight: '500' },
  orderPill: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  pillRef: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  pillMeta: { fontSize: 13, color: '#64748b' },
  pillChev: { fontSize: 22, color: '#94a3b8' },
  trackScroll: { flexGrow: 1, padding: 16, paddingBottom: 40 },
  trackHeader: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  backBtn: { marginBottom: 12 },
  backText: { color: '#3b82f6', fontWeight: '700', fontSize: 14 },
  refBox: { marginBottom: 12 },
  trackRef: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 2 },
  trackMeta: { fontSize: 13, color: '#64748b' },
  pipelineCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16 },
  pipelineTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineLeft: { alignItems: 'center', marginRight: 14, width: 14 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  dotPending: { backgroundColor: '#e2e8f0', borderWidth: 2, borderColor: '#cbd5e1' },
  dotDone: { backgroundColor: '#10b981' },
  dotCurrent: { backgroundColor: '#3b82f6', width: 14, height: 14, borderRadius: 7 },
  connector: { width: 2, flex: 1, minHeight: 20, backgroundColor: '#e2e8f0', marginTop: 2 },
  connectorDone: { backgroundColor: '#10b981' },
  stageLabel: { fontSize: 14, color: '#94a3b8', paddingBottom: 14, paddingTop: 1 },
  stageLabelDone: { color: '#475569' },
  stageLabelCurrent: { color: '#3b82f6', fontWeight: '800' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 10 },
  garmentCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10 },
  garmentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  garmentType: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  garmentQr: { fontSize: 12, color: '#94a3b8', fontFamily: 'Courier' },
  stagePill: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  stagePillText: { color: '#3b82f6', fontSize: 12, fontWeight: '800' },
});
