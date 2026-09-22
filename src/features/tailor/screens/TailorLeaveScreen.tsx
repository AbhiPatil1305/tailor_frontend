import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ApiClient } from '../../../infrastructure/api/ApiClient';

export const TailorLeaveScreen = () => {
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getMyLeaveRequests();
      setRequests(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async () => {
    if (!fromDate.trim() || !toDate.trim()) {
      Alert.alert('Validation Error', 'Please enter both from and to dates.');
      return;
    }
    setSubmitLoading(true);
    try {
      await ApiClient.applyForLeave(fromDate, toDate, reason);
      setModalVisible(false);
      setFromDate('');
      setToDate('');
      setReason('');
      await loadData();
      Alert.alert('Success', 'Leave request submitted to Hub Manager.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'APPROVED') return '#10b981';
    if (s === 'REJECTED') return '#dc2626';
    return '#f59e0b';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Leave Management</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addIcon}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6d28d9" /></View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item._id || item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.dates}>
                  {new Date(item.fromDate).toLocaleDateString()} - {new Date(item.toDate).toLocaleDateString()}
                </Text>
                <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '20' }]}>
                  <Text style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.reason}>{item.reason || 'No reason provided'}</Text>
              <Text style={styles.meta}>Applied on {new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏖</Text>
              <Text style={styles.emptyTitle}>No leave history</Text>
              <Text style={styles.emptyText}>You haven't requested any leave yet.</Text>
            </View>
          }
        />
      )}

      {/* Leave Application Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Apply for Leave</Text>
            
            <Text style={styles.label}>From Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-09-25"
              value={fromDate}
              onChangeText={setFromDate}
            />
            
            <Text style={styles.label}>To Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 2026-09-28"
              value={toDate}
              onChangeText={setToDate}
            />

            <Text style={styles.label}>Reason</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              multiline
              placeholder="Why are you taking leave?"
              value={reason}
              onChangeText={setReason}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitLoading}>
              {submitLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={submitLoading}>
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
  title: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  addBtn: { paddingHorizontal: 12 },
  addIcon: { fontSize: 32, color: '#6d28d9', fontWeight: '300' },
  list: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  dates: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  reason: { fontSize: 14, color: '#475569', marginBottom: 12 },
  meta: { fontSize: 11, color: '#94a3b8' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1e293b', marginBottom: 16 },
  submitBtn: { backgroundColor: '#6d28d9', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cancelBtn: { paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '700', fontSize: 15 },
});
