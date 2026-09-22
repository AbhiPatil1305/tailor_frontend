import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, SafeAreaView, ActivityIndicator, Linking, Modal, TextInput, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ApiClient } from '../../../infrastructure/api/ApiClient';
import { useAuth } from '../../../core/auth/AuthContext';
import { SLABadge, getSLAStatus } from '../components/SLABadge';
import { StageActionButton } from '../components/StageActionButton';
import { OfflineBanner } from '../components/OfflineBanner';

export const TailorGarmentDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { userName } = useAuth();
  const { garmentId } = route.params;

  const [garment, setGarment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  
  const [clarifyModal, setClarifyModal] = useState(false);
  const [clarifyMessage, setClarifyMessage] = useState('');

  const loadGarment = useCallback(async () => {
    try {
      const res = await ApiClient.fetchWithAuth(`/garments/${garmentId}`);
      const json = await res.json();
      if (json.data) setGarment(json.data);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  }, [garmentId]);

  useEffect(() => { loadGarment(); }, [loadGarment]);

  const handleAction = async (action: string) => {
    try {
      setActionLoading(true);
      await ApiClient.scanGarment(garmentId, action);
      await loadGarment();
      Alert.alert('Success', 'Garment updated successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClarification = async () => {
    if (!clarifyMessage.trim()) return;
    try {
      setActionLoading(true);
      await ApiClient.requestClarificationForGarment(garmentId, 'Other', clarifyMessage, userName || 'Tailor');
      setClarifyModal(false);
      setClarifyMessage('');
      await loadGarment();
      Alert.alert('Requested', 'Clarification requested successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color="#6d28d9" /></View>
      </SafeAreaView>
    );
  }

  if (!garment) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text>Garment not found.</Text></View>
      </SafeAreaView>
    );
  }

  const stage = garment.currentStage || '';
  const measStatus = garment.measurements?.status;
  const isClarificationNeeded = measStatus === 'NEEDS_CLARIFICATION' || measStatus === 'CLARIFICATION_REQUIRED';
  
  // Logic for what buttons to show
  const showStart = stage === 'STITCHING_ASSIGNED' || stage === 'QC_REWORK';
  const showComplete = stage === 'STITCHING_STARTED';

  return (
    <SafeAreaView style={styles.safe}>
      <OfflineBanner visible={!isOnline} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Garment Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        
        {/* Core Info */}
        <View style={styles.card}>
          <View style={styles.qrRow}>
            <Text style={styles.qrCode}>QR: {garment.qrCode}</Text>
            <SLABadge status={garment.slaStatus || getSLAStatus(garment.sla?.dueAt)} />
          </View>
          <Text style={styles.type}>{garment.garmentType || garment.type}</Text>
          <Text style={styles.gender}>{garment.gender?.toUpperCase()}</Text>
          
          <View style={styles.divider} />
          
          <Text style={styles.label}>Current Stage</Text>
          <Text style={styles.stageText}>{stage.replace(/_/g, ' ')}</Text>
          
          <Text style={styles.label}>Assigned Time</Text>
          <Text style={styles.valText}>
            {garment.updatedAt ? new Date(garment.updatedAt).toLocaleString() : 'N/A'}
          </Text>
        </View>

        {/* Measurements */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Measurements</Text>
          {measStatus === 'CONFIRMED' ? (
            <View style={styles.measGrid}>
              {Object.entries(garment.measurements?.data || {}).map(([k, v]) => (
                <View key={k} style={styles.measBox}>
                  <Text style={styles.measKey}>{k}</Text>
                  <Text style={styles.measVal}>{String(v)}"</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.warningBox}>
              <Text style={styles.warningIcon}>⚠</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Measurements not confirmed</Text>
                <Text style={styles.warningSub}>
                  {isClarificationNeeded ? 'Waiting for clarification.' : 'Measurements missing.'}
                </Text>
              </View>
            </View>
          )}

          {isClarificationNeeded && (
            <View style={styles.clarifyActions}>
              <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL('tel:1234567890')}>
                <Text style={styles.callBtnText}>📞 Call Customer</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isClarificationNeeded && measStatus !== 'CONFIRMED' && (
            <TouchableOpacity style={styles.clarifyBtn} onPress={() => setClarifyModal(true)}>
              <Text style={styles.clarifyBtnText}>Request Clarification</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Workflow Actions */}
        <View style={styles.actionSection}>
          {showStart && (
            <StageActionButton
              label={stage === 'QC_REWORK' ? 'START REWORK' : 'START STITCHING'}
              onPress={() => handleAction('STITCHING_STARTED')}
              loading={actionLoading}
              disabled={measStatus !== 'CONFIRMED'}
            />
          )}
          {showComplete && (
            <StageActionButton
              label="COMPLETE STITCHING"
              onPress={() => {
                Alert.alert('Confirm', 'Is this garment ready for QC?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Complete', onPress: () => handleAction('STITCHING_COMPLETED') },
                ]);
              }}
              loading={actionLoading}
            />
          )}
        </View>

      </ScrollView>

      {/* Clarification Modal */}
      <Modal visible={clarifyModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Request Clarification</Text>
            <Text style={styles.inputLabel}>Reason / Message</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="What needs to be clarified?"
              value={clarifyMessage}
              onChangeText={setClarifyMessage}
            />
            <StageActionButton label="Submit Request" onPress={handleClarification} loading={actionLoading} />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setClarifyModal(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 24, color: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  qrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  qrCode: { fontFamily: 'monospace', fontSize: 15, fontWeight: '700', color: '#1e293b' },
  type: { fontSize: 22, fontWeight: '900', color: '#6d28d9', marginBottom: 4 },
  gender: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 16 },
  label: { fontSize: 12, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  stageText: { fontSize: 18, color: '#1e293b', fontWeight: '800', marginBottom: 16 },
  valText: { fontSize: 15, color: '#475569', fontWeight: '600' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 16 },
  measGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  measBox: { backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  measKey: { fontSize: 11, color: '#64748b', marginBottom: 2 },
  measVal: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  warningBox: { flexDirection: 'row', backgroundColor: '#fef2f2', padding: 12, borderRadius: 8, alignItems: 'center' },
  warningIcon: { fontSize: 20, color: '#dc2626', marginRight: 12 },
  warningTitle: { fontSize: 14, fontWeight: '700', color: '#991b1b' },
  warningSub: { fontSize: 12, color: '#b91c1c' },
  clarifyActions: { marginTop: 16 },
  callBtn: { backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  callBtnText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  clarifyBtn: { marginTop: 16, backgroundColor: '#fee2e2', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  clarifyBtnText: { fontSize: 14, fontWeight: '700', color: '#dc2626' },
  actionSection: { marginTop: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1e293b', marginBottom: 24, height: 100, textAlignVertical: 'top' },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '700', fontSize: 15 },
});
