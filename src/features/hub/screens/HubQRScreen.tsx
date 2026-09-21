import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { ApiClient as MockApi } from '../../../infrastructure/api/ApiClient';
import { Garment } from '../../../domain/models/types';
import { StatusBadge } from '../../../shared/components/StatusBadge';
import { SLAIndicator } from '../../../shared/components/SLAIndicator';

const DEMO_QRS = ['T24-GRM-G001', 'T24-GRM-G002', 'T24-GRM-G003', 'T24-GRM-G004', 'T24-GRM-G005'];

const STAGE_ACTIONS: Record<string, { label: string; next: any; color: string }> = {
  booked: { label: '📷 Scan Intake QR', next: 'intake', color: '#3b82f6' },
  intake: { label: '✂️ Move to Cutting', next: 'cutting', color: '#f59e0b' },
  qc: { label: '→ Move to Ironing', next: 'ironing', color: '#10b981' },
  ironing: { label: '📦 Pack Garment', next: 'packed', color: '#10b981' },
  packed: { label: '🚚 Dispatch to Rider', next: 'dispatched', color: '#6366f1' },
};

export const HubQRScreen = () => {
  const [garment, setGarment] = useState<Garment | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanned, setScanned] = useState(false);

  const scanQR = async (qr: string) => {
    setLoading(true);
    const g = await MockApi.getGarmentByQR(qr);
    setGarment(g);
    setScanned(true);
    setLoading(false);
    if (!g) Alert.alert('Not Found', `No garment found with QR: ${qr}`);
  };

  const processGarment = async () => {
    if (!garment) return;
    const action = STAGE_ACTIONS[garment.stage];
    if (!action) { Alert.alert('No Action', `Garment at "${garment.stage}" has no staff action.`); return; }
    try {
      await MockApi.advanceGarmentStage(garment.qrCode, action.next, 's1', 'hub_staff');
      const updated = await MockApi.getGarmentByQR(garment.qrCode);
      setGarment(updated);
      Alert.alert('✓ Done', `Garment moved to ${action.next.toUpperCase()}`);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.title}>QR Processing</Text>
        <Text style={s.subtitle}>Scan or select a garment QR to process</Text>

        {/* QR display area */}
        <View style={s.scanArea}>
          <Text style={s.scanIcon}>📷</Text>
          <Text style={s.scanTitle}>Scan Garment QR</Text>
          <Text style={s.scanNote}>Camera scanning available on device.{`\n`}Select demo QR below:</Text>
        </View>

        {/* Demo QR selector */}
        <Text style={s.demoLabel}>DEMO — Select QR</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.qrScroll}>
          {DEMO_QRS.map(qr => (
            <TouchableOpacity key={qr} style={s.qrChip} onPress={() => scanQR(qr)}>
              <Text style={s.qrChipText}>{qr}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Garment info */}
        {loading && <Text style={s.loadingText}>Looking up garment...</Text>}
        {garment && scanned && (
          <View style={s.garmentCard}>
            <View style={s.garmentHeader}>
              <Text style={s.garmentType}>{garment.type}</Text>
              <Text style={s.garmentQr}>{garment.qrCode}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Order</Text>
              <Text style={s.infoValue}>{garment.orderId.slice(-8)}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Stage</Text>
              <Text style={s.infoValue}>{garment.stage.toUpperCase()}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Gender</Text>
              <Text style={s.infoValue}>{garment.gender.toUpperCase()}</Text>
            </View>
            <SLAIndicator slaDeadline={garment.slaDeadline} />

            {STAGE_ACTIONS[garment.stage] ? (
              <TouchableOpacity
                style={[s.actionBtn, { backgroundColor: STAGE_ACTIONS[garment.stage].color }]}
                onPress={processGarment}
              >
                <Text style={s.actionBtnText}>{STAGE_ACTIONS[garment.stage].label}</Text>
              </TouchableOpacity>
            ) : (
              <View style={s.noAction}>
                <Text style={s.noActionText}>No hub staff action available at this stage</Text>
              </View>
            )}
          </View>
        )}
        {!scanned && !loading && (
          <View style={s.placeholder}>
            <Text style={s.placeholderText}>Select a QR above to see garment details and available actions.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  scanArea: { backgroundColor: '#1e293b', borderRadius: 20, padding: 32, alignItems: 'center', marginBottom: 20 },
  scanIcon: { fontSize: 52, marginBottom: 12 },
  scanTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 8 },
  scanNote: { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 20 },
  demoLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '700', marginBottom: 10 },
  qrScroll: { marginBottom: 20 },
  qrChip: { backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  qrChipText: { fontFamily: 'Courier', fontSize: 13, color: '#1e293b', fontWeight: '700' },
  loadingText: { textAlign: 'center', color: '#64748b', marginVertical: 20 },
  garmentCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  garmentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  garmentType: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  garmentQr: { fontSize: 12, color: '#94a3b8', fontFamily: 'Courier' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  infoLabel: { fontSize: 13, color: '#64748b' },
  infoValue: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
  actionBtn: { marginTop: 16, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  noAction: { marginTop: 16, backgroundColor: '#f1f5f9', padding: 14, borderRadius: 10 },
  noActionText: { color: '#64748b', textAlign: 'center', fontWeight: '500' },
  placeholder: { backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center', marginTop: 8 },
  placeholderText: { color: '#94a3b8', textAlign: 'center', lineHeight: 22 },
});
