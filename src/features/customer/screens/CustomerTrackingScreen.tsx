import React, { useEffect, useState } from 'react';
<<<<<<< HEAD
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, ScrollView, TextInput } from 'react-native';
import { MockApi } from '../../../infrastructure/api/MockApi';
=======
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView, ScrollView } from 'react-native';
import { ApiClient } from '../../../infrastructure/api/ApiClient';
>>>>>>> c0a5703 (good morning)
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
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrderTracking, setSelectedOrderTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clarificationData, setClarificationData] = useState<Record<string, Record<string, string>>>({});

  const submitClarification = async (garment: Garment) => {
    const data = clarificationData[garment.id];
    if (!data || Object.keys(data).length === 0) return;
    await MockApi.submitClarification(garment.id, data, 'c1');
    
    // refresh
    const updatedOrders = await MockApi.getOrders();
    const myOrders = updatedOrders.filter((o: Order) => o.customerId === 'c1').reverse();
    setOrders(myOrders);
    setSelectedOrder(myOrders.find(o => o.id === selectedOrder?.id) || null);
    setClarificationData(prev => {
      const next = {...prev};
      delete next[garment.id];
      return next;
    });
  };

  const updateClarificationField = (garmentId: string, key: string, val: string) => {
    setClarificationData(prev => ({
      ...prev,
      [garmentId]: { ...(prev[garmentId] || {}), [key]: val }
    }));
  };


  useEffect(() => {
    ApiClient.getMyOrders().then(async (data: any[]) => {
      const myOrders = data.reverse();
      setOrders(myOrders);
      if (selectedRef) {
        const found = myOrders.find(o => o.trackingReference === selectedRef);
        if (found) await handleSelectOrder(found);
      } else if (myOrders.length === 1) {
        await handleSelectOrder(myOrders[0]);
      }
      setLoading(false);
    });
  }, [selectedRef]);

  const handleSelectOrder = async (o: any) => {
    setLoading(true);
    try {
      const tracking = await ApiClient.trackOrder(o.id || o._id);
      setSelectedOrderTracking(tracking);
    } catch (e) {
      console.warn('Failed to load tracking', e);
    }
    setLoading(false);
  };

  if (loading) return <LoadingState message="Loading tracking info..." />;

  if (!selectedOrderTracking) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}><Text style={s.title}>Track Order</Text></View>
        {orders.length === 0 ? (
          <EmptyState icon="📍" title="No orders to track" subtitle="Book an order first and track every garment in real time." />
        ) : (
          <FlatList
            data={orders}
            keyExtractor={o => o.id || o._id}
            contentContainerStyle={s.list}
            ListHeaderComponent={<Text style={s.selectHint}>Select an order to track</Text>}
            renderItem={({ item: o }) => (
              <TouchableOpacity style={s.orderPill} onPress={() => handleSelectOrder(o)}>
                <View><Text style={s.pillRef}>{o.trackingReference}</Text><Text style={s.pillMeta}>{o.garmentCount || 0} garments · {o.payment?.method?.toUpperCase() || 'COD'}</Text></View>
                <Text style={s.pillChev}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    );
  }

  const overallStageIdx = selectedOrderTracking.garments.length > 0 
    ? Math.min(...selectedOrderTracking.garments.map((g: any) => Math.max(0, STAGE_ORDER.indexOf(g.currentStage))))
    : 0;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.trackScroll}>
        <View style={s.trackHeader}>
          <TouchableOpacity onPress={() => setSelectedOrderTracking(null)} style={s.backBtn}>
            <Text style={s.backText}>← Orders</Text>
          </TouchableOpacity>
          <View style={s.refBox}>
            <Text style={s.trackRef}>{selectedOrderTracking.order.trackingReference}</Text>
            <Text style={s.trackMeta}>{selectedOrderTracking.garments.length} garments · {selectedOrderTracking.order.payment?.method?.toUpperCase() || 'COD'}</Text>
          </View>
          {selectedOrderTracking.garments[0]?.slaDeadline && <SLAIndicator slaDeadline={selectedOrderTracking.garments[0].slaDeadline} />}
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
        {selectedOrderTracking.garments.map((g: any) => (
          <View key={g.garmentId} style={s.garmentCard}>
            <View style={s.garmentHeader}>
              <Text style={s.garmentType}>{g.type} ({g.gender})</Text>
              <Text style={s.garmentQr}>{g.qrCode}</Text>
            </View>
<<<<<<< HEAD
            <SLAIndicator slaDeadline={g.slaDeadline} compact />

=======
            <SLAIndicator slaDeadline={g.sla} compact />
>>>>>>> c0a5703 (good morning)
            <View style={[s.stagePill, { marginTop: 8 }]}>
              <Text style={s.stagePillText}>{STAGE_LABELS[g.currentStage] || g.currentStage || 'Booked'}</Text>
            </View>

            {g.measurements?.status === 'NEEDS_CLARIFICATION' && g.measurements.clarificationRequest && (
              <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, marginTop: 12, borderWidth: 1, borderColor: '#fca5a5' }}>
                <Text style={{ color: '#b91c1c', fontWeight: '800', marginBottom: 4 }}>⚠ Measurement Clarification Required</Text>
                <Text style={{ color: '#7f1d1d', fontSize: 13, marginBottom: 8 }}>
                  Tailor says: "{g.measurements.clarificationRequest.message}"
                </Text>
                
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {['Chest', 'Shoulder', 'Sleeve', 'Length', 'Waist', 'Hip', 'Thigh', 'Bottom', 'Bust'].map(f => {
                     const relevant = ['Shirt', 'Kurta'].includes(g.type) ? ['Chest', 'Shoulder', 'Sleeve', 'Length'] : 
                                      ['Trousers'].includes(g.type) ? ['Waist', 'Hip', 'Length', 'Thigh', 'Bottom'] : 
                                      ['Suit'].includes(g.type) ? ['Chest', 'Shoulder', 'Sleeve', 'Length', 'Waist', 'Hip'] :
                                      ['Chest', 'Shoulder', 'Sleeve', 'Length', 'Waist'];
                     if (!relevant.includes(f)) return null;

                     return (
                       <View key={f} style={{ width: '45%', marginBottom: 8 }}>
                         <Text style={{ fontSize: 11, color: '#7f1d1d', fontWeight: '600', marginBottom: 4 }}>{f}</Text>
                         <TextInput 
                           style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 6, height: 32, paddingHorizontal: 8, fontSize: 13, color: '#1e293b' }}
                           placeholder={String(g.measurements?.data?.[f] || 'in')}
                           keyboardType="numeric"
                           value={clarificationData[g.id]?.[f] || ''}
                           onChangeText={(v) => updateClarificationField(g.id, f, v)}
                         />
                       </View>
                     )
                  })}
                </View>
                <TouchableOpacity 
                  style={{ backgroundColor: '#b91c1c', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 12 }}
                  onPress={() => submitClarification(g)}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>CONFIRM FINAL MEASUREMENTS</Text>
                </TouchableOpacity>
              </View>
            )}

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
