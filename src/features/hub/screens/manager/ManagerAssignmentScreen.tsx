import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator, Alert, Modal, ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { Garment, TailorScore } from '../../../../domain/models/types';
import { SLABadge } from '../../components/manager/SLABadge';
import { ScoreBreakdown } from '../../components/manager/ScoreBreakdown';
import { ConfirmModal } from '../../components/manager/ConfirmModal';

export const ManagerAssignmentScreen = () => {
  const { hubId, userId, userName } = useAuth();
  const navigation = useNavigation<any>();

  const [garments, setGarments] = useState<Garment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Assignment flow state
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);
  const [scores, setScores] = useState<TailorScore[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Confirm state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmScore, setConfirmScore] = useState<TailorScore | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      // Garments at stitching stage that have no tailor assigned
      const data = await ApiClient.getGarments({ hubId: hubId || undefined, stage: 'intake' });
      setGarments(data.filter(g => !g.assignedTailorId));
    } catch { setGarments([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [hubId]);

  useEffect(() => { load(); }, [load]);

  const findBestTailor = async (garment: Garment) => {
    setSelectedGarment(garment);
    setSheetVisible(true);
    setScoresLoading(true);
    try {
      const s = await ApiClient.suggestTailorWithScores(garment);
      setScores(s);
    } catch {
      Alert.alert('Error', 'Could not fetch tailor suggestions');
      setSheetVisible(false);
    } finally {
      setScoresLoading(false);
    }
  };

  const handleAssignPress = (score: TailorScore) => {
    setConfirmScore(score);
    setConfirmVisible(true);
  };

  const handleConfirmAssign = async () => {
    if (!confirmScore || !selectedGarment) return;
    setAssigningId(confirmScore.tailor.id);
    try {
      await ApiClient.assignTailor(selectedGarment.id, confirmScore.tailor.id);
      setConfirmVisible(false);
      setSheetVisible(false);
      Alert.alert('Success', `${confirmScore.tailor.name} assigned to garment ${selectedGarment.qrCode}`);
      load();
    } catch (e: any) {
      Alert.alert('Assignment Failed', e.message);
    } finally {
      setAssigningId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Assignments</Text>
        <Text style={styles.sub}>{garments.length} garments need assignment</Text>
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
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardInfo}>
                  <Text style={styles.garmentId}>{g.qrCode}</Text>
                  <Text style={styles.meta}>{g.type} · {g.gender}</Text>
                  <Text style={styles.stage}>{g.stage.toUpperCase()}</Text>
                </View>
                <SLABadge garment={g} compact />
              </View>
              <TouchableOpacity
                style={styles.findBtn}
                onPress={() => findBestTailor(g)}
              >
                <Text style={styles.findBtnText}>🎯 FIND BEST TAILOR</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyText}>All caught up!</Text>
              <Text style={styles.emptySub}>No garments awaiting tailor assignment.</Text>
            </View>
          }
        />
      )}

      {/* Tailor suggestions bottom sheet */}
      <Modal visible={sheetVisible} animationType="slide" transparent onRequestClose={() => setSheetVisible(false)}>
        <View style={sheetStyles.overlay}>
          <TouchableOpacity style={sheetStyles.backdrop} onPress={() => setSheetVisible(false)} />
          <View style={sheetStyles.sheet}>
            <View style={sheetStyles.handle} />
            <View style={sheetStyles.sheetHeader}>
              <Text style={sheetStyles.sheetTitle}>Tailor Recommendations</Text>
              <Text style={sheetStyles.sheetSub}>
                {selectedGarment?.type} · {selectedGarment?.gender} · {selectedGarment?.qrCode}
              </Text>
            </View>
            {scoresLoading ? (
              <View style={sheetStyles.loading}>
                <ActivityIndicator size="large" color="#7c3aed" />
                <Text style={sheetStyles.loadingText}>Calculating best matches...</Text>
              </View>
            ) : scores.length === 0 ? (
              <View style={sheetStyles.loading}>
                <Text style={sheetStyles.emptyIcon}>🧵</Text>
                <Text style={sheetStyles.emptyText}>No available tailors</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={sheetStyles.scoresList} showsVerticalScrollIndicator={false}>
                {scores.map((s, idx) => (
                  <ScoreBreakdown
                    key={s.tailor.id}
                    score={s}
                    recommended={idx === 0}
                    loading={assigningId === s.tailor.id}
                    onAssign={() => handleAssignPress(s)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Confirm assignment modal */}
      <ConfirmModal
        visible={confirmVisible}
        title="Confirm Assignment"
        message={`Assign garment ${selectedGarment?.qrCode} to ${confirmScore?.tailor.name}?\n\nScore: ${confirmScore?.totalScore} | Capacity: ${confirmScore?.tailor.assignedToday}/${confirmScore?.tailor.capacityPerDay}`}
        confirmLabel="CONFIRM ASSIGNMENT"
        confirmColor="#7c3aed"
        loading={!!assigningId}
        onConfirm={handleConfirmAssign}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
};

const sheetStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#f1f5f9', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', minHeight: 300 },
  handle: { width: 40, height: 4, backgroundColor: '#cbd5e1', borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 8 },
  sheetHeader: { paddingHorizontal: 20, paddingBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  sheetSub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  loading: { alignItems: 'center', padding: 40 },
  loadingText: { color: '#7c3aed', fontSize: 14, fontWeight: '600', marginTop: 16 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: '#64748b' },
  scoresList: { padding: 20, gap: 0 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  sub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  cardInfo: { flex: 1 },
  garmentId: { fontSize: 16, fontWeight: '800', color: '#1e293b', fontFamily: 'Courier New', marginBottom: 4 },
  meta: { fontSize: 13, color: '#64748b', textTransform: 'capitalize', marginBottom: 4 },
  stage: { fontSize: 11, color: '#8b5cf6', fontWeight: '700', letterSpacing: 0.5 },
  findBtn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  findBtnText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748b', textAlign: 'center' },
});
