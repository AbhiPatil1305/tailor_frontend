import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ApiClient as MockApi } from '../../../infrastructure/api/ApiClient';
import { Garment } from '../../../domain/models/types';
import { SLAIndicator } from '../../../shared/components/SLAIndicator';

export const HubStationScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const station = route.params?.station;
  
  const [queue, setQueue] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // The queue should show items ready to be received by this station.
  // Exception: for QC we might look for 'stitching' stage items ready for QC.
  // Wait, if item is in 'cutting', it's waiting for stitching handoff.
  const fetchQueue = async () => {
    setLoading(true);
    // receives is the stage of garments that need to be processed here.
    // e.g. Cutting station receives garments at 'intake' stage.
    const items = await MockApi.getQueueForStage(station.receives);
    setQueue(items);
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();
  }, [station.receives]);

  const processGarment = async (garment: Garment, actionStr?: string) => {
    setProcessing(true);
    try {
      let nextStage: any;
      if (station.id === 'cutting') nextStage = 'cutting';
      else if (station.id === 'stitching') nextStage = 'stitching';
      else if (station.id === 'qc') {
        if (actionStr === 'pass') nextStage = 'ironing';
        else if (actionStr === 'rework') nextStage = 'rework';
        else return;
      }
      else if (station.id === 'ironing') nextStage = 'packed';
      else if (station.id === 'dispatch') nextStage = 'dispatched';

      if (station.id === 'qc') {
        await MockApi.recordQC(garment.qrCode, actionStr as any, 'hub_staff', 'QC at station');
      } else {
        await MockApi.advanceGarmentStage(garment.qrCode, nextStage, 'hub_staff', 'hub_staff');
      }
      
      Alert.alert('Success', `Garment ${garment.qrCode} processed!`);
      fetchQueue();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
    setProcessing(false);
  };

  const scanDemoQr = (garment: Garment) => {
    if (station.id === 'qc') {
      Alert.alert(
        'QC Decision',
        `Evaluate Garment ${garment.qrCode}`,
        [
          { text: 'Rework', onPress: () => processGarment(garment, 'rework'), style: 'destructive' },
          { text: 'Pass', onPress: () => processGarment(garment, 'pass') }
        ]
      );
    } else {
      processGarment(garment);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back to Stations</Text>
        </TouchableOpacity>

        <View style={s.header}>
          <Text style={s.icon}>{station.icon}</Text>
          <Text style={s.title}>{station.name} Station</Text>
          <Text style={s.subtitle}>Process garments at {station.receives.toUpperCase()} stage</Text>
        </View>

        <View style={s.scanArea}>
          <Text style={s.scanIcon}>📷</Text>
          <Text style={s.scanTitle}>SCAN GARMENT QR</Text>
          <Text style={s.scanNote}>Tap a garment in the queue below to simulate scanning it.</Text>
        </View>

        <View style={s.queueHeader}>
          <Text style={s.queueTitle}>Live Queue ({queue.length})</Text>
          <TouchableOpacity onPress={fetchQueue}>
            <Text style={s.refreshText}>↻ Refresh</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : queue.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyText}>No garments waiting for {station.name}.</Text>
          </View>
        ) : (
          queue.map((g) => (
            <TouchableOpacity key={g.id} style={s.queueItem} onPress={() => scanDemoQr(g)} disabled={processing}>
              <View style={s.itemTop}>
                <Text style={s.itemType}>{g.type}</Text>
                <Text style={s.itemQr}>{g.qrCode}</Text>
              </View>
              <SLAIndicator slaDeadline={g.slaDeadline} />
              <View style={s.actionHint}>
                <Text style={s.actionHintText}>Tap to Scan & Process →</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { padding: 20, paddingBottom: 40 },
  backBtn: { marginBottom: 20 },
  backText: { color: '#3b82f6', fontWeight: '700', fontSize: 16 },
  header: { marginBottom: 30, alignItems: 'center' },
  icon: { fontSize: 50, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '900', color: '#1e293b' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  scanArea: {
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  scanIcon: { fontSize: 48, marginBottom: 16 },
  scanTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  scanNote: { fontSize: 13, color: '#e0e7ff', marginTop: 8, textAlign: 'center' },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  queueTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  refreshText: { color: '#3b82f6', fontWeight: '700' },
  emptyState: { padding: 30, alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1' },
  emptyText: { color: '#94a3b8', fontSize: 15, fontWeight: '500' },
  queueItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemType: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  itemQr: { fontSize: 13, color: '#64748b', fontFamily: 'Courier', fontWeight: '700' },
  actionHint: { marginTop: 16, backgroundColor: '#f1f5f9', padding: 12, borderRadius: 8, alignItems: 'center' },
  actionHintText: { color: '#3b82f6', fontWeight: '700', fontSize: 13 },
});
