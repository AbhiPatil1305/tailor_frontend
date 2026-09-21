import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, TextInput } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MockApi, getSlaStatus } from '../../../infrastructure/api/MockApi';
import { Garment, GarmentEvent } from '../../../domain/models/types';

export const GarmentActionScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const [garment, setGarment] = useState<Garment | null>(null);
  const [events, setEvents] = useState<GarmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reworkReason, setReworkReason] = useState('');
  const [showReworkInput, setShowReworkInput] = useState(false);

  const garmentId = route.params?.garmentId;

  const loadGarment = async () => {
    setLoading(true);
    const all = await MockApi.getAllGarments();
    const g = all.find(x => x.id === garmentId) || null;
    setGarment(g);
    if (g) {
      const evs = await MockApi.getGarmentEvents(g.id);
      setEvents(evs);
    }
    setLoading(false);
  };

  useEffect(() => { loadGarment(); }, [garmentId]);

  const processAction = async (actionType: string) => {
    if (!garment) return;
    try {
      if (actionType === 'cutting') {
        if (!garment.measurementsConfirmed) {
          Alert.alert('Hold On', 'Measurements are not confirmed yet.');
          return;
        }
        await MockApi.advanceGarmentStage(garment.qrCode, 'cutting', 'hub_staff', 'hub_staff');
      } else if (actionType === 'qc_pass') {
        await MockApi.recordQC(garment.qrCode, 'pass', 'hub_staff');
      } else if (actionType === 'qc_rework') {
        if (!reworkReason.trim()) {
          Alert.alert('Error', 'Please provide a rework reason.');
          return;
        }
        await MockApi.recordQC(garment.qrCode, 'rework', 'hub_staff', reworkReason);
      } else if (actionType === 'ironing') {
        await MockApi.advanceGarmentStage(garment.qrCode, 'packed', 'hub_staff', 'hub_staff');
      } else if (actionType === 'dispatch') {
        await MockApi.advanceGarmentStage(garment.qrCode, 'dispatched', 'hub_staff', 'hub_staff');
      }
      
      Alert.alert('Success', 'Garment advanced to next stage.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (loading) return <SafeAreaView style={s.safe}><Text style={{padding:20}}>Loading...</Text></SafeAreaView>;
  if (!garment) return <SafeAreaView style={s.safe}><Text style={{padding:20}}>Garment not found.</Text></SafeAreaView>;

  const sla = getSlaStatus(garment.slaDeadline);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        
        {/* Header Block */}
        <View style={s.headerBlock}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginBottom: 16}}>
            <Text style={{color: '#64748b', fontWeight: '700'}}>← BACK TO QUEUE</Text>
          </TouchableOpacity>
          <Text style={s.grmTitle}>GARMENT FOUND</Text>
          <Text style={s.grmQr}>{garment.qrCode}</Text>
        </View>

        {/* Details Card */}
        <View style={s.card}>
          <DetailRow label="Order" value={garment.orderId} />
          <DetailRow label="Garment" value={`${garment.gender} ${garment.type}`} />
          <DetailRow label="Current Stage" value={garment.stage.toUpperCase()} highlight />
          <DetailRow 
            label="Measurements" 
            value={garment.measurementsConfirmed ? 'Confirmed ✓' : '⚠ Required'} 
            valueColor={garment.measurementsConfirmed ? '#10b981' : '#ef4444'} 
          />
          <DetailRow label="SLA" value={sla.label} valueColor={sla.color} />
          {garment.assignedTailorId && <DetailRow label="Assigned Tailor" value={garment.assignedTailorId} />}
        </View>

        {/* Dynamic Action Block */}
        <View style={s.actionBlock}>
          <Text style={s.actionTitle}>NEXT ACTION</Text>
          
          {garment.stage === 'intake' && (
            garment.measurementsConfirmed ? (
              <ActionBtn label="[ COMPLETE CUTTING ]" color="#3b82f6" onPress={() => processAction('cutting')} />
            ) : (
              <View>
                <ActionBtn label="⚠ Measurements Required" color="#64748b" onPress={() => {}} disabled />
                <ActionBtn label="[ VIEW MEASUREMENTS ]" color="#f59e0b" onPress={() => Alert.alert('Measurements', garment.measurements || 'No data')} />
              </View>
            )
          )}

          {garment.stage === 'stitching' && (
            <View style={s.noticeBox}>
              <Text style={s.noticeText}>Stitching is handled by independent tailors (BYOD). Waiting for tailor to complete.</Text>
            </View>
          )}

          {garment.stage === 'qc' && (
            <>
              <ActionBtn label="[ ✓ PASS QC ]" color="#10b981" onPress={() => processAction('qc_pass')} />
              {!showReworkInput ? (
                <ActionBtn label="[ ↻ SEND TO REWORK ]" color="#ef4444" onPress={() => setShowReworkInput(true)} />
              ) : (
                <View style={s.reworkBox}>
                  <Text style={s.reworkLabel}>Reason for rework:</Text>
                  <TextInput style={s.reworkInput} value={reworkReason} onChangeText={setReworkReason} placeholder="e.g. Loose thread" />
                  <ActionBtn label="SUBMIT REWORK" color="#ef4444" onPress={() => processAction('qc_rework')} />
                </View>
              )}
            </>
          )}

          {garment.stage === 'ironing' && (
            <ActionBtn label="[ IRON & PACK COMPLETE ]" color="#10b981" onPress={() => processAction('ironing')} />
          )}

          {garment.stage === 'packed' && (
            <ActionBtn label="[ DISPATCH ]" color="#8b5cf6" onPress={() => processAction('dispatch')} />
          )}

          {!['intake','qc','ironing','packed','stitching'].includes(garment.stage) && (
            <View style={s.noticeBox}>
              <Text style={s.noticeText}>No primary action available for Hub Staff at stage: {garment.stage.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={s.timelineBlock}>
          <Text style={s.timelineTitle}>TIMELINE</Text>
          {events.map((ev, i) => (
            <View key={ev.id} style={s.timelineItem}>
              <View style={s.timelineDot} />
              <View style={s.timelineContent}>
                <Text style={s.timelineStage}>{ev.eventType.replace(/_/g, ' ')}</Text>
                <Text style={s.timelineTime}>{new Date(ev.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {ev.performedByRole}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ label, value, highlight, valueColor }: { label: string, value: string, highlight?: boolean, valueColor?: string }) => (
  <View style={s.detailRow}>
    <Text style={s.detailLabel}>{label}</Text>
    <Text style={[s.detailValue, highlight && s.highlightValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
  </View>
);

const ActionBtn = ({ label, color, onPress, disabled }: { label: string, color: string, onPress: () => void, disabled?: boolean }) => (
  <TouchableOpacity style={[s.actionBtn, { backgroundColor: color, opacity: disabled ? 0.5 : 1 }]} onPress={onPress} disabled={disabled}>
    <Text style={s.actionText}>{label}</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { padding: 16, paddingBottom: 60 },
  headerBlock: { marginBottom: 20 },
  grmTitle: { fontSize: 13, fontWeight: '800', color: '#64748b', letterSpacing: 1 },
  grmQr: { fontSize: 24, fontWeight: '900', color: '#1e293b', fontFamily: 'Courier' },
  
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 24 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  detailLabel: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  detailValue: { color: '#1e293b', fontSize: 14, fontWeight: '700' },
  highlightValue: { color: '#f59e0b', fontWeight: '900' },

  actionBlock: { marginBottom: 30 },
  actionTitle: { fontSize: 13, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 12 },
  actionBtn: { padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  
  noticeBox: { backgroundColor: '#e2e8f0', padding: 16, borderRadius: 8 },
  noticeText: { color: '#475569', fontWeight: '600' },
  
  reworkBox: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', marginBottom: 12 },
  reworkLabel: { color: '#b91c1c', fontWeight: '700', marginBottom: 8 },
  reworkInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#fca5a5', padding: 12, borderRadius: 8, marginBottom: 12 },

  timelineBlock: { backgroundColor: '#fff', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  timelineTitle: { fontSize: 13, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 16 },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#3b82f6', marginTop: 4, marginRight: 12 },
  timelineContent: { flex: 1 },
  timelineStage: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  timelineTime: { fontSize: 12, color: '#64748b' },
});
