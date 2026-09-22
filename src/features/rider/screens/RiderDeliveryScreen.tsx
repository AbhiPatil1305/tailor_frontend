import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, SafeAreaView, Modal, TextInput, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../core/auth/AuthContext';
import { ApiClient as MockApi } from '../../../infrastructure/api/ApiClient';
import { Garment } from '../../../domain/models/types';
import { UserProfileModal } from '../../../shared/components/UserProfileModal';

export const RiderDeliveryScreen = () => {
  const { logout, userName, userId } = useAuth();

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
  const [garments, setGarments] = useState<Garment[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [showProfile, setShowProfile] = useState(false);

  // OTP modal
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpOrder, setOtpOrder] = useState<Order | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const MOCK_OTP = '1234';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    // Rider should see orders containing garments that are in dispatched, out_for_delivery, or delivered (today).
    // For MVP, we will fetch all orders and filter those containing relevant garments.
    const allOrders = await MockApi.getOrders();
    // In a real app, we'd filter by rider ID (if riders are assigned to specific orders or hubs).
    // Here we'll show orders that have any garments in dispatch or delivery pipeline.
    const relevantOrders = allOrders.filter(o => 
      o.garments.some(g => ['dispatched', 'out_for_delivery', 'delivered'].includes(g.stage))
    );
    // Sort by latest created
    setOrders(relevantOrders.reverse());
  };

  const getOrderDeliveryStatus = (order: Order) => {
    const relevantGarments = order.garments.filter(g => ['dispatched', 'out_for_delivery', 'delivered'].includes(g.stage));
    if (relevantGarments.length === 0) return 'pending_production';
    if (relevantGarments.every(g => g.stage === 'delivered')) return 'delivered';
    if (relevantGarments.some(g => g.stage === 'out_for_delivery')) return 'out_for_delivery';
    return 'dispatched'; // default ready for pickup
  };

  const startDelivery = async (order: Order) => {
    try {
      // Move all 'dispatched' garments in this order to 'out_for_delivery'
      const toUpdate = order.garments.filter(g => g.stage === 'dispatched');
      if (toUpdate.length === 0) {
        Alert.alert('Notice', 'No dispatched garments found to start delivery.');
        return;
      }
      for (const g of toUpdate) {
        await MockApi.advanceGarmentStage(g.qrCode, 'out_for_delivery', userId || 'r1', 'rider');
      }
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const openOtpModal = (order: Order) => {
    setOtpOrder(order);
    setOtpInput('');
    setOtpModalVisible(true);
  };

  const confirmDelivery = async () => {
    if (!otpOrder) return;
    if (otpInput !== MOCK_OTP) {
      Alert.alert('Invalid OTP', `The OTP "${otpInput}" is incorrect. Ask the customer for their 4-digit OTP.`);
      return;
    }
    try {
      const toDeliver = otpOrder.garments.filter(g => g.stage === 'out_for_delivery');
      for (const g of toDeliver) {
        await MockApi.advanceGarmentStage(g.qrCode, 'delivered', userId || 'r1', 'rider', { otp_verified: true });
      }
      setOtpModalVisible(false);
      setOtpOrder(null);
      loadData();
      
      const paymentMsg = otpOrder.paymentMethod === 'cod' 
        ? `COD — ₹${otpOrder.totalAmount} collected`
        : `Online — Already Paid`;

      Alert.alert('Delivery Successful ✓', `Order: ${otpOrder.id.replace('ord_', '')}\nCustomer: ${otpOrder.customerName}\nPayment: ${paymentMsg}\nTime: ${new Date().toLocaleTimeString()}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const callCustomer = (phone: string) => {
    Alert.alert('Calling Customer', `Dialing ${phone}...`);
  };

  const pendingCount = orders.filter(o => getOrderDeliveryStatus(o) === 'dispatched').length;
  const outCount = orders.filter(o => getOrderDeliveryStatus(o) === 'out_for_delivery').length;
  const deliveredCount = orders.filter(o => getOrderDeliveryStatus(o) === 'delivered').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerRole}>Logistics Rider</Text>
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

      <View style={styles.hero}>
        <Text style={{color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 12, opacity: 0.8}}>TODAY'S DELIVERIES</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{pendingCount}</Text>
            <Text style={styles.heroStatLabel}>Pending Pickup</Text>
          </View>
          <View style={[styles.heroStat, styles.heroStatDivider]}>
            <Text style={styles.heroStatValue}>{outCount}</Text>
            <Text style={styles.heroStatLabel}>Out for Delivery</Text>
          </View>
          <View style={[styles.heroStat, styles.heroStatDivider]}>
            <Text style={styles.heroStatValue}>{deliveredCount}</Text>
            <Text style={styles.heroStatLabel}>Delivered</Text>
          </View>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={orders.filter(o => ['dispatched', 'out_for_delivery'].includes(getOrderDeliveryStatus(o)))}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text style={{textAlign: 'center', color: '#64748b', marginTop: 40}}>No active deliveries right now.</Text>}
        renderItem={({ item }) => {
          const status = getOrderDeliveryStatus(item);
          const isOutForDelivery = status === 'out_for_delivery';
          const garmentCount = item.garments.length;
          
          return (
            <View style={[styles.card, { borderLeftColor: isOutForDelivery ? '#f97316' : '#6366f1' }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.id.replace('ord_', '')}</Text>
                <View style={[styles.badge, { backgroundColor: isOutForDelivery ? '#fff7ed' : '#eef2ff' }]}>
                  <Text style={[styles.badgeText, { color: isOutForDelivery ? '#f97316' : '#6366f1' }]}>
                    {isOutForDelivery ? '🛵 Out for Delivery' : '📦 Ready to Pick'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Customer</Text>
                  <Text style={styles.infoValue}>{item.customerName || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={[styles.infoValue, { flexShrink: 1 }]} numberOfLines={2}>{item.customerAddress || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Garments</Text>
                  <Text style={styles.infoValue}>{garmentCount} Item(s)</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Payment</Text>
                  <Text style={[styles.infoValue, { color: item.paymentStatus === 'paid' ? '#10b981' : '#f59e0b' }]}>
                    {item.paymentMethod.toUpperCase()} — {item.paymentStatus.toUpperCase()}
                  </Text>
                </View>
                {/* 24 Hour SLA Indicator */}
                <View style={styles.infoRow}>
                   <Text style={styles.infoLabel}>SLA Status</Text>
                   <Text style={[styles.infoValue, { color: MockApi.getSlaStatus(item.garments[0]?.slaDeadline).color }]}>
                     {MockApi.getSlaStatus(item.garments[0]?.slaDeadline).label}
                   </Text>
                </View>
              </View>

              <View style={styles.actionSection}>
                {isOutForDelivery && item.paymentMethod === 'cod' && item.paymentStatus !== 'paid' && (
                  <View style={{ backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 12 }}>
                    <Text style={{ color: '#d97706', fontWeight: '700', textAlign: 'center' }}>Collect COD: ₹{item.totalAmount}</Text>
                  </View>
                )}
                
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity style={styles.contactBtn} onPress={() => callCustomer(item.customerPhone || '')}>
                    <Text style={styles.contactBtnText}>📞 Call Customer</Text>
                  </TouchableOpacity>

                  {!isOutForDelivery ? (
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => startDelivery(item)}>
                      <Text style={styles.primaryBtnText}>START DELIVERY</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: '#10b981' }]} onPress={() => openOtpModal(item)}>
                      <Text style={styles.primaryBtnText}>DELIVERED ✓</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
      />
      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} />

      {/* Verification Modal */}
      <Modal visible={otpModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Confirm Delivery</Text>
            {otpOrder && (
               <Text style={styles.modalSub}>Customer: {otpOrder.customerName}</Text>
            )}
            
            {otpOrder && otpOrder.paymentMethod === 'cod' && otpOrder.paymentStatus !== 'paid' && (
              <View style={{ backgroundColor: '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 16, alignItems: 'center' }}>
                <Text style={{ color: '#d97706', fontWeight: '800', fontSize: 16 }}>Collect COD: ₹{otpOrder.totalAmount}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Enter 4-Digit OTP (Demo: 1234)</Text>
            <TextInput
              style={styles.input}
              value={otpInput}
              onChangeText={setOtpInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="0000"
              placeholderTextColor="#94a3b8"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setOtpModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={confirmDelivery}>
                <Text style={styles.modalSubmitText}>Verify & Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerRole: { fontSize: 13, color: '#f97316', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerName: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  logoutBtn: { padding: 4 },

  hero: { backgroundColor: '#1e293b', margin: 16, borderRadius: 16, padding: 20 },
  heroStats: { flexDirection: 'row' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatDivider: { borderLeftWidth: 1, borderLeftColor: '#475569' },
  heroStatValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroStatLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  listContent: { padding: 16, paddingBottom: 60, marginTop: -20 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3, borderLeftWidth: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  infoSection: { padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  infoValue: { fontSize: 13, color: '#1e293b', fontWeight: '700', textAlign: 'right' },
  actionSection: { padding: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  contactBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center' },
  contactBtnText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  primaryBtn: { flex: 1.5, paddingVertical: 12, borderRadius: 8, backgroundColor: '#3b82f6', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  inputLabel: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 16, height: 48, fontSize: 18, color: '#1e293b', textAlign: 'center', letterSpacing: 8, fontWeight: '800', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center' },
  modalCancelText: { color: '#475569', fontWeight: '700', fontSize: 15 },
  modalSubmit: { flex: 2, paddingVertical: 14, borderRadius: 10, backgroundColor: '#3b82f6', alignItems: 'center' },
  modalSubmitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
