import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { Garment } from '../../../../domain/models/types';
import { FilterBar } from '../../components/manager/FilterBar';
import { SLABadge } from '../../components/manager/SLABadge';

type QCTab = 'waiting' | 'passed' | 'rework';

const REWORK_REASONS = [
  'Measurement issue',
  'Stitching defect',
  'Finishing issue',
  'Wrong fabric usage',
  'Other',
];

export const ManagerQCScreen = () => {
  const { hubId, userId, userName } = useAuth();
  const navigation = useNavigation<any>();

  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<QCTab>('waiting');

  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [reworkModalVisible, setReworkModalVisible] = useState(false);
  const [reworkReason, setReworkReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      let stage: string;
      if (tab === 'waiting') stage = 'qc';
      else if (tab === 'passed') stage = 'ironing';
      else stage = 'rework';
      const data = await ApiClient.getGarments({ hubId: hubId || undefined, stage });
      setGarments(data);
    } catch { setGarments([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [hubId, tab]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const handlePass = async (garment: Garment) => {
    setActionLoading(true);
    try {
      await ApiClient.recordQC(garment.qrCode, 'pass', userId || 'manager');
      Alert.alert('QC Passed', `${garment.qrCode} passed QC`);
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRework = async () => {
    if (!selectedGarment) return;
    if (!reworkReason.trim()) {
      Alert.alert('Reason Required', 'Please select or enter a reason');
      return;
    }
    setActionLoading(true);
    try {
      await ApiClient.recordQC(selectedGarment.qrCode, 'rework', userId || 'manager', reworkReason);
      Alert.alert('Rework Queued', `${selectedGarment.qrCode} sent to rework`);
      setReworkModalVisible(false);
      setReworkReason('');
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>QC / Rework</Text>
      </View>

      <View style={styles.filterWrap}>
        <FilterBar
          options={[
            { key: 'waiting' as QCTab, label: 'Waiting for QC' },
            { key: 'passed'  as QCTab, label: 'Passed' },
            { key: 'rework'  as QCTab, label: 'Rework' },
          ]}
          selected={tab}
          onSelect={setTab}
          accentColor={tab === 'rework' ? '#dc2626' : tab === 'passed' ? '#16a34a' : '#ec4899'}
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
                  {g.assignedTailorId && <Text style={styles.tailor}>🧵 {g.assignedTailorId}</Text>}
                </View>
                <SLABadge garment={g} compact />
              </View>

              {tab === 'waiting' && (
                <View style={styles.qcActions}>
                  <TouchableOpacity
                    style={styles.reworkBtn}
                    onPress={() => { setSelectedGarment(g); setReworkModalVisible(true); }}
                    disabled={actionLoading}
                  >
                    <Text style={styles.reworkBtnText}>🔄 SEND TO REWORK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.passBtn}
                    onPress={() => handlePass(g)}
                    disabled={actionLoading}
                  >
                    <Text style={styles.passBtnText}>✓ PASS QC</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>{tab === 'rework' ? '🔄' : '🔍'}</Text>
              <Text style={styles.emptyText}>No garments in {tab}</Text>
            </View>
          }
        />
      )}

      {/* Rework reason modal */}
      <Modal visible={reworkModalVisible} transparent animationType="slide" onRequestClose={() => setReworkModalVisible(false)}>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handle} />
            <Text style={modalStyles.title}>Send to Rework</Text>
            <Text style={modalStyles.sub}>{selectedGarment?.qrCode} · {selectedGarment?.type}</Text>
            <Text style={modalStyles.label}>SELECT REASON *</Text>
            {REWORK_REASONS.map(r => (
              <TouchableOpacity
                key={r}
                style={[modalStyles.reasonBtn, reworkReason === r && modalStyles.reasonBtnActive]}
                onPress={() => setReworkReason(r)}
              >
                <Text style={[modalStyles.reasonText, reworkReason === r && modalStyles.reasonTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
            {reworkReason === 'Other' && (
              <TextInput
                style={modalStyles.input}
                placeholder="Describe the issue..."
                multiline
                numberOfLines={3}
              />
            )}
            <View style={modalStyles.actions}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setReworkModalVisible(false)}>
                <Text style={modalStyles.cancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.confirmBtn} onPress={handleRework} disabled={actionLoading}>
                <Text style={modalStyles.confirmText}>{actionLoading ? 'SENDING...' : 'SEND TO REWORK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 6 },
  sub: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, marginBottom: 10 },
  reasonBtn: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, marginBottom: 8 },
  reasonBtnActive: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  reasonText: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  reasonTextActive: { color: '#dc2626', fontWeight: '700' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, fontSize: 14, marginTop: 8, marginBottom: 16, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  confirmBtn: { flex: 1, backgroundColor: '#dc2626', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  filterWrap: { paddingHorizontal: 20, marginBottom: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  cardInfo: { flex: 1 },
  garmentId: { fontSize: 15, fontWeight: '800', color: '#1e293b', fontFamily: 'Courier New', marginBottom: 4 },
  meta: { fontSize: 12, color: '#64748b', textTransform: 'capitalize', marginBottom: 2 },
  tailor: { fontSize: 12, color: '#64748b' },
  qcActions: { flexDirection: 'row', gap: 10 },
  reworkBtn: { flex: 1, borderWidth: 1.5, borderColor: '#fca5a5', backgroundColor: '#fef2f2', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  reworkBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 13 },
  passBtn: { flex: 1, backgroundColor: '#16a34a', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  passBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#64748b' },
});
