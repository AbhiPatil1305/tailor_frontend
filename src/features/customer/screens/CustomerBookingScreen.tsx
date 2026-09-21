import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, TextInput, Alert
} from 'react-native';
import { useAuth } from '../../../core/auth/AuthContext';
import { MockApi } from '../../../infrastructure/api/MockApi';
import { Order } from '../../../domain/models/types';

const GARMENT_TYPES = ['Shirt', 'Trousers', 'Kurta', 'Suit', 'Saree', 'Dress', 'Other'];
const GENDER_OPTIONS = ['ladies', 'gents', 'kids', 'unisex'] as const;

const TRACKING_STAGES = [
  { key: 'booked',           label: 'Booked' },
  { key: 'intake',           label: 'Received at Hub' },
  { key: 'cutting',          label: 'Cutting' },
  { key: 'stitching',        label: 'Stitching' },
  { key: 'qc',               label: 'Quality Check' },
  { key: 'ironing',          label: 'Ironing' },
  { key: 'packed',           label: 'Packed' },
  { key: 'dispatched',       label: 'Dispatched' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered',        label: 'Delivered' },
];

const STAGE_ORDER = TRACKING_STAGES.map(s => s.key);

export const CustomerBookingScreen = () => {
  const { logout, userName } = useAuth();
  const [tab, setTab] = useState<'book' | 'track'>('book');
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Booking form state
  const [customerName, setCustomerName] = useState('Ravi Kumar');
  const [customerPhone, setCustomerPhone] = useState('9000000001');
  const [customerAddress, setCustomerAddress] = useState('12, Gandhi Nagar, Bidar');
  const [garments, setGarments] = useState([{ type: 'Shirt', gender: 'gents' as const }]);
  const [pickupSlot, setPickupSlot] = useState('Tomorrow 10:00–11:00 AM');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadOrders(); }, []);
  useEffect(() => { if (tab === 'track') loadOrders(); }, [tab]);

  const loadOrders = async () => {
    const data = await MockApi.getOrders();
    setOrders(data.filter(o => o.customerId === 'c1').reverse());
  };

  const addGarment = () => {
    if (garments.length >= 6) return;
    setGarments(prev => [...prev, { type: 'Shirt', gender: 'gents' }]);
  };

  const removeGarment = (idx: number) => {
    setGarments(prev => prev.filter((_, i) => i !== idx));
  };

  const updateGarment = (idx: number, field: 'type' | 'gender', value: string) => {
    setGarments(prev => prev.map((g, i) => i === idx ? { ...g, [field]: value } : g));
  };

  const handleBook = async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      Alert.alert('Missing Details', 'Please fill in your name, phone, and address.');
      return;
    }
    if (!pickupSlot) {
      Alert.alert('Missing Slot', 'Please select a pickup slot.');
      return;
    }
    setLoading(true);
    try {
      const order = await MockApi.bookOrder({
        customerName, customerPhone, customerAddress,
        pickupSlot,
        paymentMethod,
        garments: garments as any,
      });
      setConfirmedOrder(order);
      await loadOrders();
    } catch (e: any) {
      Alert.alert('Booking Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const stageIndex = (stage: string) => STAGE_ORDER.indexOf(stage);
  const getSlaColor = (slaDeadline?: string) => {
    if (!slaDeadline) return '#94a3b8';
    const sla = MockApi.getSlaStatus(slaDeadline);
    return sla.color;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'book' && styles.activeTab]} onPress={() => setTab('book')}>
          <Text style={[styles.tabText, tab === 'book' && styles.activeTabText]}>New Booking</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'track' && styles.activeTab]} onPress={() => setTab('track')}>
          <Text style={[styles.tabText, tab === 'track' && styles.activeTabText]}>
            Track Orders {orders.length > 0 ? `(${orders.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── BOOKING TAB ────────────────────────────── */}
        {tab === 'book' && !confirmedOrder && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Details</Text>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput style={styles.input} value={customerName} onChangeText={setCustomerName} placeholder="e.g. Ravi Kumar" />
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <TextInput style={styles.input} value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" placeholder="10-digit number" />
              <Text style={styles.inputLabel}>Delivery Address</Text>
              <TextInput style={[styles.input, { height: 60 }]} value={customerAddress} onChangeText={setCustomerAddress} multiline placeholder="Full address" />
            </View>

            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>Garments ({garments.length})</Text>
                {garments.length < 6 && (
                  <TouchableOpacity style={styles.addGarmentBtn} onPress={addGarment}>
                    <Text style={styles.addGarmentText}>+ Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {garments.map((g, idx) => (
                <View key={idx} style={styles.garmentRow}>
                  <View style={styles.garmentIndex}><Text style={styles.garmentIndexText}>{idx + 1}</Text></View>
                  <View style={styles.garmentFields}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.pillGroup}>
                        {GARMENT_TYPES.map(t => (
                          <TouchableOpacity key={t} style={[styles.pill, g.type === t && styles.activePill]} onPress={() => updateGarment(idx, 'type', t)}>
                            <Text style={[styles.pillText, g.type === t && styles.activePillText]}>{t}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      <View style={styles.pillGroup}>
                        {GENDER_OPTIONS.map(gv => (
                          <TouchableOpacity key={gv} style={[styles.pill, g.gender === gv && styles.activePillGender]} onPress={() => updateGarment(idx, 'gender', gv)}>
                            <Text style={[styles.pillText, g.gender === gv && styles.activePillText]}>{gv}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  {garments.length > 1 && (
                    <TouchableOpacity onPress={() => removeGarment(idx)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Payment</Text>
              <View style={styles.paymentRow}>
                <TouchableOpacity style={[styles.payBtn, paymentMethod === 'cod' && styles.payBtnActive]} onPress={() => setPaymentMethod('cod')}>
                  <Text style={paymentMethod === 'cod' ? styles.payBtnTextActive : styles.payBtnText}>💵 Cash on Delivery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.payBtn, paymentMethod === 'online' && styles.payBtnActive]} onPress={() => setPaymentMethod('online')}>
                  <Text style={paymentMethod === 'online' ? styles.payBtnTextActive : styles.payBtnText}>📱 UPI / Card</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Pickup Slot</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.pillGroup}>
                  {['Tomorrow 10:00–11:00 AM', 'Tomorrow 12:00–01:00 PM', 'Tomorrow 02:00–03:00 PM', 'Tomorrow 04:00–05:00 PM'].map(slot => (
                    <TouchableOpacity key={slot} style={[styles.pill, pickupSlot === slot && styles.activePill]} onPress={() => setPickupSlot(slot)}>
                      <Text style={[styles.pillText, pickupSlot === slot && styles.activePillText]}>{slot.replace('Tomorrow ', '')}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Pickup: {pickupSlot.split(' ')[0]} {pickupSlot.split(' ')[1]}</Text>
              <Text style={styles.summaryAmount}>₹{garments.reduce((sum, g) => {
                const payout = g.type === 'Shirt' ? 150 : g.type === 'Trousers' ? 180 : g.type === 'Kurta' ? 200 : g.type === 'Suit' ? 500 : 160;
                return sum + Math.round(payout * 1.6);
              }, 0)}</Text>
            </View>

            <TouchableOpacity style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]} onPress={handleBook} disabled={loading}>
              <Text style={styles.primaryBtnText}>{loading ? 'Booking...' : `Confirm Booking (₹${garments.reduce((sum, g) => {
                const payout = g.type === 'Shirt' ? 150 : g.type === 'Trousers' ? 180 : g.type === 'Kurta' ? 200 : g.type === 'Suit' ? 500 : 160;
                return sum + Math.round(payout * 1.6);
              }, 0)})`}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── SUCCESS CARD ──────────────────────────── */}
        {tab === 'book' && confirmedOrder && (
          <View style={styles.successCard}>
            <View style={styles.successIconBox}><Text style={styles.successIcon}>✓</Text></View>
            <Text style={styles.successTitle}>Booking Confirmed!</Text>
            <Text style={styles.successSub}>Our rider will arrive at your selected slot.</Text>
            <View style={styles.refBox}>
              <Text style={styles.refLabel}>Tracking Reference</Text>
              <Text style={styles.refValue}>{confirmedOrder.trackingReference}</Text>
            </View>
            <Text style={styles.garmentsSummary}>
              {confirmedOrder.garments.map(g => `${g.type} (${g.gender})`).join(' • ')}
            </Text>
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => { setConfirmedOrder(null); setGarments([{ type: 'Shirt', gender: 'gents' }]); }}>
              <Text style={styles.secondaryBtnText}>Book Another Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 8 }]} onPress={() => setTab('track')}>
              <Text style={[styles.secondaryBtnText, { color: '#3b82f6' }]}>Track This Order →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── TRACKING TAB ─────────────────────────── */}
        {tab === 'track' && (
          <>
            {orders.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📦</Text>
                <Text style={styles.emptyTitle}>No Orders Yet</Text>
                <Text style={styles.emptySub}>Book a pickup to get started.</Text>
              </View>
            ) : (
              orders.map(order => (
                <View key={order.id} style={styles.trackingCard}>
                  <View style={styles.trackingHeader}>
                    <View>
                      <Text style={styles.trackingRef}>{order.trackingReference}</Text>
                      <Text style={styles.trackingDate}>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                    <View style={[styles.paymentBadge, { backgroundColor: order.paymentStatus === 'cod_pending' ? '#fef3c7' : '#dcfce7' }]}>
                      <Text style={[styles.paymentBadgeText, { color: order.paymentStatus === 'cod_pending' ? '#d97706' : '#16a34a' }]}>
                        {order.paymentMethod === 'cod' ? 'COD' : 'PAID'}
                      </Text>
                    </View>
                  </View>

                  {/* Per-garment tracking timeline */}
                  {order.garments.map((garment, gi) => {
                    const currentIdx = stageIndex(garment.stage);
                    const sla = garment.slaDeadline ? MockApi.getSlaStatus(garment.slaDeadline) : null;
                    return (
                      <View key={garment.id} style={styles.garmentTracker}>
                        <View style={styles.garmentTrackerHeader}>
                          <Text style={styles.garmentTrackerTitle}>{garment.type} ({garment.gender})</Text>
                          <Text style={styles.garmentQr}>{garment.qrCode}</Text>
                        </View>
                        {sla && (
                          <View style={[styles.slaBadge, { backgroundColor: sla.color + '20' }]}>
                            <Text style={[styles.slaText, { color: sla.color }]}>⏱ {sla.label}</Text>
                          </View>
                        )}
                        <View style={styles.timeline}>
                          {TRACKING_STAGES.filter(s => s.key !== 'rework').map((stage, si) => {
                            const realIdx = stageIndex(stage.key);
                            const done = currentIdx >= realIdx;
                            const isCurrent = currentIdx === realIdx;
                            return (
                              <View key={stage.key} style={styles.timelineStep}>
                                <View style={styles.timelineLeft}>
                                  <View style={[styles.dot, done ? styles.dotDone : styles.dotPending, isCurrent && styles.dotCurrent]} />
                                  {si < TRACKING_STAGES.filter(s => s.key !== 'rework').length - 1 && (
                                    <View style={[styles.line, done && styles.lineDone]} />
                                  )}
                                </View>
                                <Text style={[styles.stageLabel, done && styles.stageLabelDone, isCurrent && styles.stageLabelCurrent]}>
                                  {stage.label} {isCurrent ? '←' : ''}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  greeting: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  userName: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  logoutBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: '#475569', fontWeight: '700', fontSize: 14 },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#3b82f6' },
  tabText: { color: '#64748b', fontWeight: '600', fontSize: 15 },
  activeTabText: { color: '#3b82f6', fontWeight: '800' },

  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 60 },

  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 14, color: '#1e293b' },

  garmentRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  garmentIndex: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 4 },
  garmentIndexText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  garmentFields: { flex: 1 },
  pillGroup: { flexDirection: 'row', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f1f5f9', borderRadius: 20 },
  activePill: { backgroundColor: '#1e293b' },
  activePillGender: { backgroundColor: '#ec4899' },
  pillText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  activePillText: { color: '#fff' },
  addGarmentBtn: { backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  addGarmentText: { color: '#3b82f6', fontWeight: '700', fontSize: 14 },
  removeBtn: { padding: 8 },
  removeBtnText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },

  paymentRow: { flexDirection: 'row', gap: 12 },
  payBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center' },
  payBtnActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  payBtnText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  payBtnTextActive: { color: '#3b82f6', fontWeight: '700', fontSize: 14 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  summaryText: { color: '#475569', fontWeight: '600', fontSize: 14 },
  summaryAmount: { color: '#1e293b', fontWeight: '800', fontSize: 18 },

  primaryBtn: { backgroundColor: '#3b82f6', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  primaryBtnDisabled: { backgroundColor: '#93c5fd' },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  successCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center' },
  successIconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIcon: { fontSize: 36, color: '#22c55e', fontWeight: '900' },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  refBox: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  refLabel: { fontSize: 12, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  refValue: { fontSize: 20, fontWeight: '900', color: '#1e293b', letterSpacing: 2 },
  garmentsSummary: { color: '#64748b', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  secondaryBtn: { backgroundColor: '#f8fafc', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  secondaryBtnText: { color: '#475569', fontSize: 15, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b' },

  trackingCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  trackingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  trackingRef: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  trackingDate: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  paymentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paymentBadgeText: { fontWeight: '800', fontSize: 12 },

  garmentTracker: { marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  garmentTrackerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  garmentTrackerTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  garmentQr: { fontSize: 12, color: '#94a3b8', fontFamily: 'Courier' },
  slaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12, alignSelf: 'flex-start' },
  slaText: { fontSize: 12, fontWeight: '700' },

  timeline: { paddingLeft: 4 },
  timelineStep: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 32 },
  timelineLeft: { alignItems: 'center', marginRight: 12, width: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  dotPending: { backgroundColor: '#e2e8f0', borderWidth: 2, borderColor: '#cbd5e1' },
  dotDone: { backgroundColor: '#10b981' },
  dotCurrent: { backgroundColor: '#3b82f6', width: 14, height: 14, borderRadius: 7 },
  line: { width: 2, flex: 1, minHeight: 16, backgroundColor: '#e2e8f0', marginTop: 2 },
  lineDone: { backgroundColor: '#10b981' },
  stageLabel: { fontSize: 14, color: '#94a3b8', paddingTop: 1, paddingBottom: 12, fontWeight: '500' },
  stageLabelDone: { color: '#475569' },
  stageLabelCurrent: { color: '#3b82f6', fontWeight: '800' },
});
