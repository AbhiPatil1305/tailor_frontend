import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, SafeAreaView, Modal, TextInput
} from 'react-native';
import { useAuth } from '../../../core/auth/AuthContext';
import { MockApi } from '../../../infrastructure/api/MockApi';
import { Garment, Tailor, LeaveRequest, PayoutClaim, GenderCategory, TailorScore, Hub } from '../../../domain/models/types';

type TabType = 'garments' | 'tailors' | 'approvals' | 'dashboard';

export const HubManagerDashboard = () => {
  const { logout, role, userName, userId, hubId: authHubId, setHubId } = useAuth();
  const isManager = role === 'hub_manager';

  const [hubs, setHubs] = useState<Hub[]>([]);
  const [selectedHubId, setSelectedHubId] = useState<string>(authHubId || 'h1');
  const [hubPickerVisible, setHubPickerVisible] = useState(false);

  const [garments, setGarments] = useState<Garment[]>([]);

  const [tailors, setTailors] = useState<Tailor[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payoutClaims, setPayoutClaims] = useState<PayoutClaim[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<TabType>('garments');
  const [genderTab, setGenderTab] = useState<GenderCategory>('ladies');

  // QC Rework modal state
  const [reworkModalVisible, setReworkModalVisible] = useState(false);
  const [reworkGarment, setReworkGarment] = useState<Garment | null>(null);
  const [reworkReason, setReworkReason] = useState('');

  // Smart assign modal state
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignGarment, setAssignGarment] = useState<Garment | null>(null);
  const [assignScores, setAssignScores] = useState<TailorScore[]>([]);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { loadData(); }, [selectedHubId]);

  const loadData = async () => {
    const [g, t, lr, pc, db, h] = await Promise.all([
      MockApi.getGarmentsByHub(selectedHubId),
      MockApi.getTailorsByHub(selectedHubId),
      MockApi.getLeaveRequests(),
      MockApi.getPayoutClaims(),
      MockApi.getDashboardMetrics(selectedHubId),
      MockApi.getHubs(),
    ]);
    setGarments(g);
    setTailors(t);
    setLeaveRequests(lr);
    setPayoutClaims(pc);
    setDashboard(db);
    setHubs(h);
  };

  const advanceStage = async (qr: string, stage: any) => {
    try {
      await MockApi.advanceGarmentStage(qr, stage, userId || 'staff', role || 'hub_staff');
      loadData();
    } catch (e: any) {
      Alert.alert('Invalid Action', e.message);
    }
  };

  const openSmartAssign = (garment: Garment) => {
    const scores = MockApi.suggestTailorWithScores(garment);
    setAssignGarment(garment);
    setAssignScores(scores);
    setAssignModalVisible(true);
  };

  const confirmAssign = async (tailor: Tailor) => {
    if (!assignGarment) return;
    await MockApi.assignTailor(assignGarment.id, tailor.id);
    await MockApi.advanceGarmentStage(assignGarment.qrCode, 'stitching', userId || 'm1', 'hub_manager', { tailorId: tailor.id });
    setAssignModalVisible(false);
    setAssignGarment(null);
    Alert.alert('Assigned', `${assignGarment.type} assigned to ${tailor.name}`);
    loadData();
  };

  const openRework = (garment: Garment) => {
    setReworkGarment(garment);
    setReworkReason('');
    setReworkModalVisible(true);
  };

  const confirmRework = async () => {
    if (!reworkGarment) return;
    if (!reworkReason.trim()) {
      Alert.alert('Reason Required', 'Please enter a reason for rework.');
      return;
    }
    try {
      await MockApi.recordQC(reworkGarment.qrCode, 'rework', userId || 'staff', reworkReason);
      setReworkModalVisible(false);
      setReworkGarment(null);
      loadData();
      Alert.alert('Rework Sent', `Garment returned to stitching queue.\nReason: ${reworkReason}`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const confirmQcPass = async (garment: Garment) => {
    try {
      await MockApi.recordQC(garment.qrCode, 'pass', userId || 'staff');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleLeave = async (id: string, status: 'approved' | 'rejected') => {
    await MockApi.updateLeaveRequest(id, status);
    loadData();
  };

  const handlePayout = async (id: string, status: 'approved' | 'rejected') => {
    await MockApi.updatePayoutClaim(id, 'hub', status);
    loadData();
  };

  const formatStage = (stage: string) => stage.replace(/_/g, ' ').toUpperCase();

  const getSlaStyle = (slaDeadline?: string) => {
    if (!slaDeadline) return {};
    const sla = MockApi.getSlaStatus(slaDeadline);
    return { borderLeftColor: sla.color };
  };

  const getSlaLabel = (slaDeadline?: string) => {
    if (!slaDeadline) return null;
    return MockApi.getSlaStatus(slaDeadline);
  };

  const pendingApprovals = leaveRequests.filter(l => l.status === 'pending').length
    + payoutClaims.filter(p => p.hubManagerApproval === 'pending').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerRole}>Hub {isManager ? 'Manager' : 'Staff'}</Text>
          <Text style={styles.headerName}>{userName}</Text>
          <TouchableOpacity style={styles.hubPill} onPress={() => setHubPickerVisible(true)}>
            <Text style={styles.hubPillText}>🏭 {hubs.find(h => h.id === selectedHubId)?.name || 'Select Hub'} ▾</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {(isManager ? ['dashboard','garments','tailors','approvals'] : ['garments']).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.activeTab]} onPress={() => setActiveTab(t as TabType)}>
            <Text style={[styles.tabText, activeTab === t && styles.activeTabText]}>
              {t === 'approvals' ? `Approvals${pendingApprovals > 0 ? ` 🔴` : ''}` : t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ── DASHBOARD TAB ────────────────────────── */}
        {activeTab === 'dashboard' && dashboard && (
          <>
            <View style={styles.metricsGrid}>
              {[
                { label: 'In Production', value: dashboard.inProduction, color: '#3b82f6' },
                { label: 'Delivered Today', value: dashboard.deliveredToday, color: '#10b981' },
                { label: 'At Risk / Overdue', value: dashboard.atRisk, color: '#ef4444' },
                { label: 'COD Pending', value: dashboard.codPending, color: '#f59e0b' },
                { label: 'Pending Claims', value: dashboard.pendingClaims, color: '#8b5cf6' },
              ].map(m => (
                <View key={m.label} style={[styles.metricCard, { borderTopColor: m.color }]}>
                  <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
                  <Text style={styles.metricLabel}>{m.label}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionHeader}>Station Queues</Text>
            {Object.entries(dashboard.stageQueues).map(([stage, count]) => (
              <View key={stage} style={styles.queueRow}>
                <Text style={styles.queueStage}>{formatStage(stage)}</Text>
                <View style={styles.queueBarContainer}>
                  <View style={[styles.queueBar, { width: `${Math.min(100, ((count as number) / 5) * 100)}%` }]} />
                </View>
                <Text style={styles.queueCount}>{count as number}</Text>
              </View>
            ))}
          </>
        )}

        {/* ── GARMENTS TAB ─────────────────────────── */}
        {activeTab === 'garments' && (
          <>
            {isManager && (
              <View style={styles.filterPills}>
                {(['ladies', 'gents', 'kids', 'unisex'] as GenderCategory[]).map(g => (
                  <TouchableOpacity key={g} style={[styles.pill, genderTab === g && styles.activePill]} onPress={() => setGenderTab(g)}>
                    <Text style={[styles.pillText, genderTab === g && styles.activePillText]}>{g.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {!isManager && (
              <View style={styles.staffHero}>
                <Text style={styles.staffHeroIcon}>📷</Text>
                <Text style={styles.staffHeroTitle}>Hub Station Workflow</Text>
                <Text style={styles.staffHeroSub}>Scan garment QR or select action below</Text>
              </View>
            )}

            {garments
              .filter(g => isManager ? g.gender === genderTab : true)
              .map(item => {
                const sla = getSlaLabel(item.slaDeadline);
                const assignedTailor = tailors.find(t => t.id === item.assignedTailorId);
                return (
                  <View key={item.id} style={[styles.garmentCard, getSlaStyle(item.slaDeadline)]}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle}>{item.type} <Text style={styles.cardGender}>({item.gender})</Text></Text>
                      <View style={[styles.stageBadge, { backgroundColor: item.stage === 'qc' ? '#ede9fe' : '#f1f5f9' }]}>
                        <Text style={[styles.stageBadgeText, { color: item.stage === 'qc' ? '#7c3aed' : '#475569' }]}>{formatStage(item.stage)}</Text>
                      </View>
                    </View>

                    <Text style={styles.qrCode}>{item.qrCode}</Text>

                    {assignedTailor && (
                      <Text style={styles.assignedTailor}>✂️ {assignedTailor.name}</Text>
                    )}

                    {sla && (
                      <View style={[styles.slaTag, { backgroundColor: sla.color + '20' }]}>
                        <Text style={[styles.slaTagText, { color: sla.color }]}>⏱ {sla.label}</Text>
                      </View>
                    )}

                    {/* Hub Staff actions */}
                    {!isManager && item.stage === 'booked' && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => advanceStage(item.qrCode, 'intake')}>
                        <Text style={styles.actionBtnText}>📷 Scan Intake QR</Text>
                      </TouchableOpacity>
                    )}
                    {!isManager && item.stage === 'intake' && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => advanceStage(item.qrCode, 'cutting')}>
                        <Text style={styles.actionBtnText}>✂️ Move to Cutting</Text>
                      </TouchableOpacity>
                    )}
                    {!isManager && item.stage === 'qc' && (
                      <View style={styles.qcActions}>
                        <TouchableOpacity style={[styles.qcBtn, styles.qcPassBtn]} onPress={() => confirmQcPass(item)}>
                          <Text style={styles.qcBtnText}>✓ QC Pass → Ironing</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.qcBtn, styles.qcReworkBtn]} onPress={() => openRework(item)}>
                          <Text style={styles.qcBtnText}>↩ Rework</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {!isManager && item.stage === 'rework' && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => advanceStage(item.qrCode, 'stitching')}>
                        <Text style={styles.actionBtnText}>↩ Return to Stitching</Text>
                      </TouchableOpacity>
                    )}
                    {!isManager && item.stage === 'ironing' && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#10b981' }]} onPress={() => advanceStage(item.qrCode, 'packed')}>
                        <Text style={styles.actionBtnText}>📦 Pack Garment</Text>
                      </TouchableOpacity>
                    )}
                    {!isManager && item.stage === 'packed' && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#6366f1' }]} onPress={() => advanceStage(item.qrCode, 'dispatched')}>
                        <Text style={styles.actionBtnText}>🚚 Dispatch</Text>
                      </TouchableOpacity>
                    )}

                    {/* Manager actions */}
                    {isManager && item.stage === 'cutting' && (
                      <TouchableOpacity style={styles.smartAssignBtn} onPress={() => openSmartAssign(item)}>
                        <Text style={styles.smartAssignBtnText}>✨ Smart Assign Tailor</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
          </>
        )}

        {/* ── TAILORS TAB ───────────────────────────── */}
        {activeTab === 'tailors' && tailors.map(t => (
          <View key={t.id} style={styles.tailorCard}>
            <View style={styles.tailorHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tailorName}>{t.name}</Text>
                <Text style={styles.tailorGender}>{t.gender.toUpperCase()} SPECIALIST</Text>
              </View>
              <View style={styles.ratingBox}>
                <Text style={styles.ratingText}>★ {t.rating}</Text>
              </View>
            </View>
            <View style={styles.tailorStats}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Status</Text>
                <Text style={[styles.statValue, { color: t.status === 'available' ? '#10b981' : t.status === 'busy' ? '#f59e0b' : '#ef4444' }]}>{t.status.toUpperCase()}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Assigned Today</Text>
                <Text style={styles.statValue}>{t.assignedToday} / {t.capacityPerDay}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Remaining</Text>
                <Text style={[styles.statValue, { color: (t.capacityPerDay - t.assignedToday) > 0 ? '#10b981' : '#ef4444' }]}>
                  {Math.max(0, t.capacityPerDay - t.assignedToday)}
                </Text>
              </View>
            </View>
            <Text style={styles.specialisations}>{t.specialisations.join(' • ')}</Text>
          </View>
        ))}

        {/* ── APPROVALS TAB ──────────────────────────── */}
        {activeTab === 'approvals' && (
          <>
            <Text style={styles.sectionHeader}>Leave Requests</Text>
            {leaveRequests.filter(l => l.status === 'pending').length === 0
              ? <Text style={styles.emptyText}>No pending leave requests.</Text>
              : leaveRequests.filter(l => l.status === 'pending').map(l => (
                <View key={l.id} style={styles.approvalCard}>
                  <Text style={styles.approvalName}>{l.tailorName}</Text>
                  <Text style={styles.approvalDetail}>Requesting leave on <Text style={{ fontWeight: '700' }}>{l.date}</Text></Text>
                  {l.reason ? <Text style={styles.approvalReason}>Reason: {l.reason}</Text> : null}
                  <View style={styles.approvalActions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleLeave(l.id, 'approved')}><Text style={styles.btnWhite}>✓ Approve</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleLeave(l.id, 'rejected')}><Text style={styles.btnWhite}>✕ Reject</Text></TouchableOpacity>
                  </View>
                </View>
              ))
            }

            <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Payout Claims (Step 1 of 2)</Text>
            {payoutClaims.filter(p => p.hubManagerApproval === 'pending').length === 0
              ? <Text style={styles.emptyText}>No pending payout claims.</Text>
              : payoutClaims.filter(p => p.hubManagerApproval === 'pending').map(p => (
                <View key={p.id} style={styles.approvalCard}>
                  <Text style={styles.approvalName}>Tailor: {p.tailorId}</Text>
                  <Text style={styles.approvalDetail}>Amount: <Text style={{ fontWeight: '800', color: '#10b981' }}>₹{p.amount}</Text></Text>
                  <Text style={styles.approvalReason}>Covers {p.ledgerIds.length} garment(s)</Text>
                  <View style={styles.approvalActions}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handlePayout(p.id, 'approved')}><Text style={styles.btnWhite}>✓ Approve</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handlePayout(p.id, 'rejected')}><Text style={styles.btnWhite}>✕ Reject</Text></TouchableOpacity>
                  </View>
                </View>
              ))
            }
          </>
        )}
      </ScrollView>

      {/* ── Smart Assign Modal ─────────────────────── */}
      <Modal visible={assignModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Smart Tailor Assignment</Text>
            {assignGarment && (
              <Text style={styles.modalSub}>{assignGarment.type} ({assignGarment.gender})</Text>
            )}
            {assignScores.length === 0 ? (
              <Text style={styles.modalEmpty}>No available tailors match this garment.</Text>
            ) : (
              assignScores.map((s, idx) => (
                <View key={s.tailor.id} style={[styles.scoreCard, idx === 0 && styles.topScoreCard]}>
                  {idx === 0 && <Text style={styles.topBadge}>Best Match</Text>}
                  <View style={styles.scoreHeader}>
                    <Text style={styles.scoreName}>{s.tailor.name}</Text>
                    <Text style={styles.scoreTotal}>Score: {s.totalScore}</Text>
                  </View>
                  <View style={styles.scoreBreakdown}>
                    <Text style={[styles.scoreItem, { color: s.breakdown.genderMatch > 0 ? '#10b981' : '#94a3b8' }]}>
                      {s.breakdown.genderMatch > 0 ? '✓' : '✗'} Gender Match +{s.breakdown.genderMatch}
                    </Text>
                    <Text style={[styles.scoreItem, { color: s.breakdown.skillMatch > 0 ? '#10b981' : '#94a3b8' }]}>
                      {s.breakdown.skillMatch > 0 ? '✓' : '✗'} Skill Match +{s.breakdown.skillMatch}
                    </Text>
                    <Text style={[styles.scoreItem, { color: s.breakdown.capacityHeadroom > 0 ? '#10b981' : '#94a3b8' }]}>
                      {s.breakdown.capacityHeadroom > 0 ? '✓' : '✗'} Capacity Headroom +{s.breakdown.capacityHeadroom}
                    </Text>
                    <Text style={styles.scoreItem}>★ Rating {s.rating} (tie-breaker)</Text>
                  </View>
                  <TouchableOpacity style={styles.assignBtn} onPress={() => confirmAssign(s.tailor)}>
                    <Text style={styles.assignBtnText}>Assign {s.tailor.name}</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAssignModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── QC Rework Modal ────────────────────────── */}
      <Modal visible={reworkModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Send for Rework</Text>
            {reworkGarment && (
              <Text style={styles.modalSub}>{reworkGarment.type} — {reworkGarment.qrCode}</Text>
            )}
            <Text style={styles.inputLabel}>Rework Reason (required)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={reworkReason}
              onChangeText={setReworkReason}
              multiline
              placeholder="e.g. Sleeve measurement mismatch, stitching loose at collar..."
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity style={[styles.assignBtn, { backgroundColor: '#ef4444' }]} onPress={confirmRework}>
              <Text style={styles.assignBtnText}>↩ Confirm Rework</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setReworkModalVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Hub Picker Modal ───────────────────────── */}
      <Modal visible={hubPickerVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: 32 }]}>
            <Text style={styles.modalTitle}>Select Hub</Text>
            <Text style={styles.modalSub}>Only garments and tailors from the selected hub are shown.</Text>
            {hubs.map(h => (
              <TouchableOpacity
                key={h.id}
                style={[styles.hubOption, selectedHubId === h.id && styles.hubOptionActive]}
                onPress={() => { setSelectedHubId(h.id); setHubId(h.id); setHubPickerVisible(false); }}
              >
                <Text style={styles.hubOptionIcon}>🏭</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hubOptionName, selectedHubId === h.id && { color: '#8b5cf6' }]}>{h.name}</Text>
                  <Text style={styles.hubOptionLocation}>{h.location}</Text>
                </View>
                {selectedHubId === h.id && <Text style={{ color: '#8b5cf6', fontWeight: '800' }}>✓</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setHubPickerVisible(false)}>
              <Text style={styles.cancelBtnText}>Close</Text>
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
  headerRole: { fontSize: 13, color: '#8b5cf6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  headerName: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginTop: 2 },
  hubPill: { backgroundColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 6 },
  hubPillText: { color: '#7c3aed', fontSize: 12, fontWeight: '700' },
  hubOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0', gap: 10 },
  hubOptionActive: { borderColor: '#8b5cf6', backgroundColor: '#faf5ff' },
  hubOptionIcon: { fontSize: 22 },
  hubOptionName: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  hubOptionLocation: { fontSize: 12, color: '#94a3b8' },

  logoutBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: '#475569', fontWeight: '700', fontSize: 14 },

  tabScroll: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', maxHeight: 52 },
  tab: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#8b5cf6' },
  tabText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  activeTabText: { color: '#8b5cf6', fontWeight: '800' },

  scrollContent: { flexGrow: 1, padding: 16, paddingBottom: 60 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  metricCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  metricValue: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  metricLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  sectionHeader: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  queueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  queueStage: { width: 120, fontSize: 12, fontWeight: '600', color: '#475569' },
  queueBarContainer: { flex: 1, height: 8, backgroundColor: '#e2e8f0', borderRadius: 4 },
  queueBar: { height: 8, backgroundColor: '#8b5cf6', borderRadius: 4 },
  queueCount: { width: 24, fontSize: 13, fontWeight: '800', color: '#1e293b', textAlign: 'right' },

  filterPills: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#e2e8f0', borderRadius: 20 },
  activePill: { backgroundColor: '#1e293b' },
  pillText: { color: '#475569', fontWeight: '600', fontSize: 12 },
  activePillText: { color: '#fff' },

  staffHero: { backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 16 },
  staffHeroIcon: { fontSize: 36, marginBottom: 8 },
  staffHeroTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  staffHeroSub: { color: '#94a3b8', fontSize: 13 },

  garmentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  cardGender: { fontWeight: '500', color: '#64748b' },
  stageBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stageBadgeText: { fontSize: 11, fontWeight: '700' },
  qrCode: { color: '#94a3b8', fontSize: 12, fontFamily: 'Courier', marginBottom: 6 },
  assignedTailor: { color: '#475569', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  slaTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  slaTagText: { fontSize: 12, fontWeight: '700' },
  actionBtn: { backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  qcActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  qcBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  qcPassBtn: { backgroundColor: '#10b981' },
  qcReworkBtn: { backgroundColor: '#ef4444' },
  qcBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  smartAssignBtn: { backgroundColor: '#8b5cf6', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  smartAssignBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  tailorCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  tailorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tailorName: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  tailorGender: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginTop: 2 },
  ratingBox: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  ratingText: { color: '#d97706', fontWeight: '700', fontSize: 14 },
  tailorStats: { flexDirection: 'row', gap: 12, marginBottom: 10, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statBox: { flex: 1 },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  specialisations: { fontSize: 13, color: '#64748b' },

  emptyText: { color: '#94a3b8', fontStyle: 'italic', marginBottom: 12 },
  approvalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  approvalName: { fontSize: 16, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  approvalDetail: { fontSize: 14, color: '#475569', marginBottom: 4 },
  approvalReason: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
  approvalActions: { flexDirection: 'row', gap: 8 },
  approveBtn: { flex: 1, backgroundColor: '#10b981', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  rejectBtn: { flex: 1, backgroundColor: '#ef4444', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  btnWhite: { color: '#fff', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  modalEmpty: { color: '#94a3b8', textAlign: 'center', paddingVertical: 20 },
  scoreCard: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  topScoreCard: { borderColor: '#8b5cf6', borderWidth: 2, backgroundColor: '#faf5ff' },
  topBadge: { fontSize: 11, fontWeight: '800', color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  scoreName: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  scoreTotal: { fontSize: 17, fontWeight: '800', color: '#8b5cf6' },
  scoreBreakdown: { marginBottom: 12 },
  scoreItem: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 4 },
  assignBtn: { backgroundColor: '#8b5cf6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  assignBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelBtn: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#64748b', fontWeight: '600', fontSize: 14 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1e293b', marginBottom: 16 },
});
