import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, SafeAreaView, Modal, TextInput
} from 'react-native';
import { useAuth } from '../../../core/auth/AuthContext';
import { MockApi } from '../../../infrastructure/api/MockApi';
import { Garment } from '../../../domain/models/types';

export const RiderDeliveryScreen = () => {
  const { logout, userName, userId } = useAuth();
  const [garments, setGarments] = useState<Garment[]>([]);

  // OTP modal
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpGarment, setOtpGarment] = useState<Garment | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const MOCK_OTP = '1234';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const data = await MockApi.getAllGarments();
    setGarments(data.filter(g => g.stage === 'dispatched' || g.stage === 'out_for_delivery'));
  };

  const startDelivery = async (garment: Garment) => {
    try {
      await MockApi.advanceGarmentStage(garment.qrCode, 'out_for_delivery', userId || 'r1', 'rider');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const openOtpModal = (garment: Garment) => {
    setOtpGarment(garment);
    setOtpInput('');
    setOtpModalVisible(true);
  };

  const confirmDelivery = async () => {
    if (!otpGarment) return;
    if (otpInput !== MOCK_OTP) {
      Alert.alert('Invalid OTP', `The OTP "${otpInput}" is incorrect. Ask the customer for their 4-digit OTP. (Demo OTP: ${MOCK_OTP})`);
      return;
    }
    try {
      await MockApi.advanceGarmentStage(otpGarment.qrCode, 'delivered', userId || 'r1', 'rider', { otp_verified: true });
      setOtpModalVisible(false);
      setOtpGarment(null);
      loadData();
      Alert.alert('Delivered! ✓', 'Garment delivered successfully. COD status updated. Tailor payout triggered.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const activeCount = garments.filter(g => g.stage === 'out_for_delivery').length;
  const pendingPickup = garments.filter(g => g.stage === 'dispatched').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerRole}>Logistics Rider</Text>
          <Text style={styles.headerName}>{userName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{activeCount}</Text>
            <Text style={styles.heroStatLabel}>Out for Delivery</Text>
          </View>
          <View style={[styles.heroStat, styles.heroStatDivider]}>
            <Text style={styles.heroStatValue}>{pendingPickup}</Text>
            <Text style={styles.heroStatLabel}>Pending Pickup</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{garments.length}</Text>
            <Text style={styles.heroStatLabel}>Total Active</Text>
          </View>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={garments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isOutForDelivery = item.stage === 'out_for_delivery';
          return (
            <View style={[styles.card, { borderLeftColor: isOutForDelivery ? '#f97316' : '#6366f1' }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.type}</Text>
                <View style={[styles.badge, { backgroundColor: isOutForDelivery ? '#fff7ed' : '#eef2ff' }]}>
                  <Text style={[styles.badgeText, { color: isOutForDelivery ? '#f97316' : '#6366f1' }]}>
                    {isOutForDelivery ? '🛵 Out for Delivery' : '📦 Ready to Pick'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Garment QR</Text>
                  <Text style={styles.infoValue}>{item.qrCode}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Customer</Text>
                  <Text style={styles.infoValue}>Ravi Kumar</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>12, Gandhi Nagar, Bidar</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Category</Text>
                  <Text style={styles.infoValue}>{item.gender.toUpperCase()}</Text>
                </View>
              </View>

              {!isOutForDelivery && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => startDelivery(item)}>
                  <Text style={styles.actionBtnText}>🛵 Start Delivery</Text>
                </TouchableOpacity>
              )}
              {isOutForDelivery && (
                <TouchableOpacity style={[styles.actionBtn, styles.deliverBtn]} onPress={() => openOtpModal(item)}>
                  <Text style={styles.actionBtnText}>✓ Confirm Delivery (OTP)</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>Queue Cleared!</Text>
            <Text style={styles.emptySub}>No active pickups or deliveries right now.</Text>
          </View>
        }
      />

      {/* OTP Confirmation Modal */}
      <Modal visible={otpModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Confirm Delivery</Text>
            {otpGarment && (
              <Text style={styles.modalSub}>{otpGarment.type} — {otpGarment.qrCode}</Text>
            )}
            <Text style={styles.otpHint}>Ask the customer for their 4-digit OTP</Text>
            <TextInput
              style={styles.otpInput}
              value={otpInput}
              onChangeText={setOtpInput}
              keyboardType="numeric"
              maxLength={4}
              placeholder="0000"
              placeholderTextColor="#cbd5e1"
            />
            <Text style={styles.demoNote}>Demo OTP: {MOCK_OTP}</Text>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmDelivery}>
              <Text style={styles.confirmBtnText}>Submit OTP & Mark Delivered</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setOtpModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerRole: { fontSize: 13, color: '#f97316', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerName: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  logoutBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: '#475569', fontWeight: '700', fontSize: 14 },

  hero: { backgroundColor: '#1e293b', margin: 16, borderRadius: 16, padding: 20 },
  heroStats: { flexDirection: 'row' },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatDivider: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#334155' },
  heroStatValue: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 4 },
  heroStatLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '600', textAlign: 'center' },

  listContent: { flexGrow: 1, paddingHorizontal: 16, paddingBottom: 40 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '700' },

  infoSection: { marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  infoLabel: { color: '#64748b', fontSize: 13, fontWeight: '500' },
  infoValue: { color: '#1e293b', fontSize: 13, fontWeight: '700' },

  actionBtn: { backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  deliverBtn: { backgroundColor: '#10b981' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 32, alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  otpHint: { fontSize: 14, color: '#475569', fontWeight: '600', marginBottom: 16 },
  otpInput: { fontSize: 40, fontWeight: '900', letterSpacing: 16, color: '#1e293b', textAlign: 'center', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 16, paddingHorizontal: 24, width: '100%', marginBottom: 8 },
  demoNote: { color: '#94a3b8', fontSize: 12, marginBottom: 24 },
  confirmBtn: { backgroundColor: '#10b981', paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center', marginBottom: 8 },
  confirmBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: { paddingVertical: 12, width: '100%', alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '600' },
});
