import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, SafeAreaView, Modal, TextInput, Platform
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../../../core/auth/AuthContext';
import { MockApi } from '../../../infrastructure/api/MockApi';
import { Garment, Tailor, PayoutLedger } from '../../../domain/models/types';

export const TailorDashboardScreen = () => {
  const { logout, userName, userId } = useAuth();
  const tailorId = userId || 't1';

  const [garments, setGarments] = useState<Garment[]>([]);
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [ledger, setLedger] = useState<PayoutLedger[]>([]);
  const [tab, setTab] = useState<'queue' | 'earnings'>('queue');

  // Leave modal
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [clarificationModalVisible, setClarificationModalVisible] = useState(false);
  const [clarifyGarmentId, setClarifyGarmentId] = useState('');
  const [clarifyMessage, setClarifyMessage] = useState('');

  const submitClarification = async () => {
    if (!clarifyMessage.trim()) return;
    try {
      await MockApi.requestClarification(clarifyGarmentId, 'Other', clarifyMessage, tailor?.name || 'Tailor');
      setClarificationModalVisible(false);
      setClarifyMessage('');
      loadData();
      Alert.alert('Clarification Requested', 'The customer has been notified.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => { loadData(); }, [tailorId]);

  const loadData = async () => {
    const data = await MockApi.getAllGarments();
    const tailors = await MockApi.getTailors();
    const ledgerData = await MockApi.getPayoutLedger(tailorId);
    const found = tailors.find(t => t.id === tailorId) || null;
    setTailor(found);
    setGarments(data.filter(g => g.assignedTailorId === tailorId && g.stage === 'stitching'));
    setLedger(ledgerData);
  };

  const advanceStage = async (qr: string) => {
    try {
      await MockApi.advanceGarmentStage(qr, 'qc', tailorId, 'tailor');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const submitLeave = async () => {
    if (!leaveDate.trim()) {
      Alert.alert('Missing Date', 'Please enter a date for your leave request.');
      return;
    }
    await MockApi.requestLeave(tailorId, leaveDate, leaveReason);
    setLeaveModalVisible(false);
    setLeaveDate('');
    setLeaveReason('');
    Alert.alert('Leave Requested', 'Your request has been sent to the Hub Manager for approval.');
  };

  const raiseClaim = async () => {
    const pendingLedger = ledger.filter(l => l.status === 'pending');
    if (pendingLedger.length === 0) {
      Alert.alert('No Pending Balance', 'You have no pending completed garments to claim.');
      return;
    }
    const totalAmount = pendingLedger.reduce((sum, l) => sum + l.amount, 0);
    try {
      await MockApi.raisePayoutClaim(tailorId, totalAmount, pendingLedger.map(l => l.id));
      await loadData();
      Alert.alert('Claim Raised! ✓', `Claimed ₹${totalAmount} for ${pendingLedger.length} garment(s).\nAwaiting Hub Manager approval.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const setStatus = async (status: 'available' | 'busy' | 'on-leave') => {
    await MockApi.setTailorStatus(tailorId, status);
    loadData();
  };

  const callCustomer = () => {
    Alert.alert('Call Customer', 'Connecting to customer for measurement clarification...');
  };

  const shareLocation = () => {
    Alert.alert('Location Shared', 'Your live location is now visible to the Hub Manager.');
  };

  const downloadApplicationPDF = async () => {
    if (!tailor) return;
    const html = `
      <html>
        <body style="font-family: Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b;">
          <h1 style="color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">TAILOR24 Partner Application</h1>
          <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          <h2>Applicant Information</h2>
          <table style="width: 100%; text-align: left; margin-bottom: 20px;">
            <tr><th style="padding: 8px 0;">Name:</th><td>${tailor.name}</td></tr>
            <tr><th style="padding: 8px 0;">ID:</th><td>${tailor.id}</td></tr>
            <tr><th style="padding: 8px 0;">Gender Specialization:</th><td>${tailor.gender.toUpperCase()}</td></tr>
            <tr><th style="padding: 8px 0;">Rating:</th><td>★ ${tailor.rating}</td></tr>
          </table>
          <h2>Skills & Capabilities</h2>
          <ul>
            ${tailor.specialisations.map(s => `<li>${s.charAt(0).toUpperCase() + s.slice(1)}</li>`).join('')}
          </ul>
          <p><strong>Daily Capacity:</strong> ${tailor.capacityPerDay} garments per day</p>
          <div style="margin-top: 60px;">
            <p>___________________________</p>
            <p>Applicant Signature</p>
          </div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      if (Platform.OS === 'web') {
        // Web downloads automatically when printed
        Print.printAsync({ html });
      } else {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to generate PDF: ' + e.message);
    }
  };

  const ledgerStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'manager_approved': case 'finance_confirmed': return '#3b82f6';
      case 'claim_raised': return '#f59e0b';
      default: return '#94a3b8';
    }
  };
  const ledgerStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Claim';
      case 'claim_raised': return 'Claim Raised';
      case 'manager_approved': return 'Manager Approved';
      case 'finance_confirmed': return 'Finance Confirmed';
      case 'paid': return 'Paid ✓';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  if (!tailor) return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerRole}>Tailor Partner</Text>
          <Text style={styles.headerName}>{userName || tailor.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'queue' && styles.activeTab]} onPress={() => setTab('queue')}>
          <Text style={[styles.tabText, tab === 'queue' && styles.activeTabText]}>My Queue ({garments.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'earnings' && styles.activeTab]} onPress={() => setTab('earnings')}>
          <Text style={[styles.tabText, tab === 'earnings' && styles.activeTabText]}>Earnings & Claims</Text>
        </TouchableOpacity>
      </View>

      <FlatList<any>
        data={tab === 'queue' ? garments : ledger}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={<>
          {/* Status + Actions */}
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Availability Status</Text>
            <View style={styles.statusToggleGroup}>
              {(['available', 'busy'] as const).map(s => (
                <TouchableOpacity key={s}
                  style={[styles.statusToggle, tailor.status === s && (s === 'available' ? styles.statusActiveGreen : styles.statusActiveYellow)]}
                  onPress={() => setStatus(s)}>
                  <Text style={[styles.statusText, tailor.status === s && styles.statusTextActive]}>{s.charAt(0).toUpperCase() + s.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Earnings summary card */}
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <View>
                <Text style={styles.earningsLabel}>Pending</Text>
                <Text style={styles.earningsValue}>₹{tailor.pendingBalance}</Text>
              </View>
              <View>
                <Text style={styles.earningsLabel}>Total Earned</Text>
                <Text style={styles.earningsValue}>₹{tailor.earnedBalance}</Text>
              </View>
              <View>
                <Text style={styles.earningsLabel}>Paid Out</Text>
                <Text style={[styles.earningsValue, { color: '#10b981' }]}>₹{tailor.paidBalance}</Text>
              </View>
            </View>
            {tab === 'earnings' && (
              <TouchableOpacity style={styles.withdrawBtn} onPress={raiseClaim}>
                <Text style={styles.withdrawBtnText}>Raise Payout Claim</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Quick action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => setLeaveModalVisible(true)}>
              <Text style={styles.quickBtnIcon}>📅</Text>
              <Text style={styles.quickBtnText}>Apply Leave</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={shareLocation}>
              <Text style={styles.quickBtnIcon}>📍</Text>
              <Text style={styles.quickBtnText}>Share Location</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.actionRow, { marginTop: -8, marginBottom: 20 }]}>
            <TouchableOpacity style={styles.quickBtn} onPress={downloadApplicationPDF}>
              <Text style={styles.quickBtnIcon}>📄</Text>
              <Text style={styles.quickBtnText}>Download Application PDF</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>
            {tab === 'queue' ? `Stitching Queue (${garments.length})` : `Payout Ledger (${ledger.length})`}
          </Text>
        </>}

        renderItem={({ item }) => {
          if (tab === 'queue') {
            const g = item as Garment;
            return (
              <View style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <View style={styles.taskBadge}><Text style={styles.taskBadgeText}>{g.type}</Text></View>
                  <Text style={styles.taskQr}>{g.qrCode}</Text>
                </View>
                <View style={styles.taskMeta}>
                  <Text style={styles.taskPayout}>+ ₹{g.payoutAmount}</Text>
                  <Text style={styles.taskGender}>{g.gender.toUpperCase()}</Text>
                </View>
                {g.slaDeadline && (() => {
                  const sla = MockApi.getSlaStatus(g.slaDeadline);
                  return (
                    <View style={[styles.slaBadge, { backgroundColor: sla.color + '20' }]}>
                      <Text style={[styles.slaText, { color: sla.color }]}>⏱ {sla.label}</Text>
                    </View>
                  );
                })()}
                {/* Measurements Block */}
                <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, marginVertical: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontWeight: '700', color: '#1e293b' }}>Measurements</Text>
                    {g.measurements?.status === 'CONFIRMED' && <Text style={{ color: '#10b981', fontWeight: '800', fontSize: 12 }}>✓ CONFIRMED (v{g.measurements.version})</Text>}
                    {g.measurements?.status === 'NEEDS_CLARIFICATION' && <Text style={{ color: '#f59e0b', fontWeight: '800', fontSize: 12 }}>⚠ WAITING FOR CUSTOMER</Text>}
                    {(!g.measurements || g.measurements.status === 'NOT_PROVIDED') && <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 12 }}>⚠ NOT PROVIDED</Text>}
                  </View>
                  
                  {g.measurements?.status === 'CONFIRMED' && g.measurements.data && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {Object.entries(g.measurements.data).map(([k, v]) => (
                        <View key={k} style={{ backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                          <Text style={{ fontSize: 11, color: '#64748b' }}>{k}</Text>
                          <Text style={{ fontSize: 13, color: '#1e293b', fontWeight: '600' }}>{String(v)}"</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {(!g.measurements || g.measurements.status !== 'CONFIRMED') && (
                     <TouchableOpacity 
                       style={{ backgroundColor: '#fef2f2', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#fca5a5', alignItems: 'center', marginTop: 4 }}
                       onPress={() => {
                         setClarifyGarmentId(g.id);
                         setClarificationModalVisible(true);
                       }}
                     >
                       <Text style={{ color: '#ef4444', fontWeight: '700', fontSize: 12 }}>REQUEST CLARIFICATION</Text>
                     </TouchableOpacity>
                  )}
                </View>

                <View style={styles.taskActions}>
                  <TouchableOpacity style={styles.callBtn} onPress={callCustomer}>
                    <Text style={styles.callBtnText}>📞 Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.finishBtn, (!g.measurements || g.measurements.status !== 'CONFIRMED') && { backgroundColor: '#94a3b8' }]} 
                    onPress={() => advanceStage(g.qrCode)}
                    disabled={!g.measurements || g.measurements.status !== 'CONFIRMED'}
                  >
                    <Text style={styles.finishBtnText}>Finish → QC ✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          } else {
            const l = item as unknown as PayoutLedger;
            return (
              <View style={styles.ledgerCard}>
                <View style={styles.ledgerHeader}>
                  <Text style={styles.ledgerType}>{l.garmentType}</Text>
                  <Text style={styles.ledgerAmount}>₹{l.amount}</Text>
                </View>
                <Text style={styles.ledgerOrderId}>Order: {l.orderId.slice(-8)}</Text>
                <View style={[styles.ledgerStatus, { backgroundColor: ledgerStatusColor(l.status) + '20' }]}>
                  <Text style={[styles.ledgerStatusText, { color: ledgerStatusColor(l.status) }]}>
                    {ledgerStatusLabel(l.status)}
                  </Text>
                </View>
              </View>
            );
          }
        }}

        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>{tab === 'queue' ? '✂️' : '💰'}</Text>
            <Text style={styles.emptyTitle}>{tab === 'queue' ? 'No garments assigned' : 'No earnings yet'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'queue'
                ? 'Wait for the Hub Manager to assign garments based on your specialisation and capacity.'
                : 'Complete stitching assignments to generate earnings here.'}
            </Text>
          </View>
        }
      />

      {/* Clarification Modal */}
      <Modal visible={clarificationModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Request Clarification</Text>
            <Text style={styles.inputLabel}>Message to Customer</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              multiline
              placeholder="e.g. Please confirm sleeve length, 50 inches seems incorrect."
              value={clarifyMessage}
              onChangeText={setClarifyMessage}
            />
            
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setClarificationModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={submitClarification}>
                <Text style={styles.submitBtnText}>Send Request</Text>
              </TouchableOpacity>
                      </View>
        </View>
      </Modal>

      {/* Leave Modal */}
      <Modal visible={leaveModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Apply for Leave</Text>
            <Text style={styles.inputLabel}>Date</Text>
            <TextInput
              style={styles.input}
              value={leaveDate}
              onChangeText={setLeaveDate}
              placeholder="e.g. Tomorrow, 25 Sep 2026"
              placeholderTextColor="#94a3b8"
            />
            <Text style={styles.inputLabel}>Reason (optional)</Text>
            <TextInput
              style={[styles.input, { height: 70 }]}
              value={leaveReason}
              onChangeText={setLeaveReason}
              multiline
              placeholder="e.g. Medical appointment"
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={submitLeave}>
              <Text style={styles.submitBtnText}>Submit Leave Request</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setLeaveModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#64748b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerRole: { fontSize: 13, color: '#f59e0b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerName: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  logoutBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: '#475569', fontWeight: '700', fontSize: 14 },

  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#f59e0b' },
  tabText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  activeTabText: { color: '#f59e0b', fontWeight: '800' },

  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 60 },

  statusCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12 },
  statusLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  statusToggleGroup: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 3 },
  statusToggle: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 6 },
  statusActiveGreen: { backgroundColor: '#10b981' },
  statusActiveYellow: { backgroundColor: '#f59e0b' },
  statusText: { color: '#64748b', fontWeight: '600', fontSize: 13 },
  statusTextActive: { color: '#fff', fontWeight: '700' },

  earningsCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 12 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  earningsLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  earningsValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  withdrawBtn: { backgroundColor: '#10b981', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  withdrawBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickBtn: { flex: 1, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1 },
  quickBtnIcon: { fontSize: 18, marginRight: 8 },
  quickBtnText: { color: '#475569', fontWeight: '700', fontSize: 14 },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 16 },

  taskCard: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#3b82f6', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taskBadge: { backgroundColor: '#eff6ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  taskBadgeText: { color: '#3b82f6', fontWeight: '800', fontSize: 13, textTransform: 'uppercase' },
  taskQr: { color: '#94a3b8', fontSize: 12, fontFamily: 'Courier' },
  taskMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  taskPayout: { fontSize: 20, fontWeight: '800', color: '#10b981' },
  taskGender: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  slaBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  slaText: { fontSize: 12, fontWeight: '700' },
  taskActions: { flexDirection: 'row', gap: 10 },
  callBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  callBtnText: { color: '#475569', fontWeight: '700', fontSize: 13 },
  finishBtn: { flex: 2, backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  finishBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  ledgerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  ledgerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  ledgerType: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  ledgerAmount: { fontSize: 16, fontWeight: '800', color: '#10b981' },
  ledgerOrderId: { fontSize: 12, color: '#94a3b8', marginBottom: 10 },
  ledgerStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  ledgerStatusText: { fontSize: 12, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingHorizontal: 24, lineHeight: 22 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1e293b', marginBottom: 16 },
  submitBtn: { backgroundColor: '#f59e0b', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 8 },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '600' },
});
