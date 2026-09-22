import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, useWindowDimensions, Platform
} from 'react-native';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { UserStatusBadge } from '../../components/credentials/UserStatusBadge';
import { ActivationSuccessModal } from '../../components/credentials/ActivationSuccessModal';
import { ResetAccessModal } from '../../components/credentials/ResetAccessModal';
import { DeactivateAccountModal } from '../../components/credentials/DeactivateAccountModal';
import { ActivateTailorModal } from '../../components/credentials/ActivateTailorModal';
import { CreateTailorModal } from '../../components/credentials/CreateTailorModal';

export const ManagerTailorsScreen = ({ navigation }: { navigation: any }) => {
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const isSmallScreen = windowWidth < 768;

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'applications' | 'pending' | 'inactive'>('active');
  const [tailors, setTailors] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Modals
  const [createdTailorData, setCreatedTailorData] = useState<any>(null);
  const [targetTailor, setTargetTailor] = useState<any>(null);
  const [targetApp, setTargetApp] = useState<any>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.getTailorsManagement(search || undefined, activeTab);
      setTailors(res.tailors || []);
      setApplications(res.applications || []);
    } catch (e) {
      console.error('Failed to fetch tailors data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, activeTab]);

  const handleCreateAccountFromApp = async (password?: string) => {
    if (!targetApp) return;
    const appId = targetApp.applicationId || targetApp.id;
    try {
      setActionLoadingId(appId);
      const res = await ApiClient.createTailorFromApplication(appId, password);
      setCreatedTailorData(res);
      fetchData();
    } catch (e: any) {
      console.error(e);
      throw e;
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDirectCreate = async (data: any) => {
    const res = await ApiClient.createTailorDirect(data);
    setCreatedTailorData(res);
    fetchData();
  };


  const handleConfirmReset = async () => {
    if (!targetTailor) return;
    const res = await ApiClient.resetTailorAccess(targetTailor.userId || targetTailor.id);
    fetchData();
    return res;
  };

  const handleConfirmDeactivate = async () => {
    if (!targetTailor) return;
    await ApiClient.deactivateTailor(targetTailor.userId || targetTailor.id);
    fetchData();
  };

  const handleReactivate = async (tailorId: string) => {
    await ApiClient.reactivateTailor(tailorId);
    fetchData();
  };

  // Filter tailors based on active tab
  const filteredTailors = tailors.filter((t) => {
    if (activeTab === 'active') return t.isActive !== false && t.accountStatus === 'ACTIVE';
    if (activeTab === 'pending') return t.accountStatus === 'PENDING_ACTIVATION';
    if (activeTab === 'inactive') return t.isActive === false || t.accountStatus === 'INACTIVE';
    return true;
  });

  return (
    <View style={[styles.container, { height: Platform.OS === 'web' ? windowHeight - 56 : undefined }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.title}>INDEPENDENT TAILORS</Text>
            <Text style={styles.subtitle}>Manage approved independent tailors and their credential access.</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.addBtnText}>+ ADD TAILOR</Text>
          </TouchableOpacity>
        </View>


        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'active' && styles.tabItemActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              ACTIVE ({tailors.filter(t => t.isActive !== false && t.accountStatus === 'ACTIVE').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'applications' && styles.tabItemActive]}
            onPress={() => setActiveTab('applications')}
          >
            <Text style={[styles.tabText, activeTab === 'applications' && styles.tabTextActive]}>
              APPLICATIONS ({applications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'pending' && styles.tabItemActive]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
              PENDING ACTIVATION ({tailors.filter(t => t.accountStatus === 'PENDING_ACTIVATION').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'inactive' && styles.tabItemActive]}
            onPress={() => setActiveTab('inactive')}
          >
            <Text style={[styles.tabText, activeTab === 'inactive' && styles.tabTextActive]}>
              INACTIVE ({tailors.filter(t => t.isActive === false || t.accountStatus === 'INACTIVE').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.filterRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, skill, or specialization..."
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Tab Content */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : activeTab === 'applications' ? (
          /* Applications View */
          applications.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No pending or approved tailor applications found.</Text>
            </View>
          ) : (
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Applicant</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Phone</Text>
                <Text style={[styles.th, { flex: 2 }]}>Skills</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Specialization</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Application Status</Text>
                <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>Actions</Text>
              </View>

              {applications.map((app, idx) => (
                <View key={app.applicationId || app.id || idx} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.td, styles.tdBold, { flex: 2 }]}>{app.applicantName}</Text>
                  <Text style={[styles.td, { flex: 1.5 }]}>{app.phone}</Text>
                  <Text style={[styles.td, { flex: 2 }]}>
                    {Array.isArray(app.skills) ? app.skills.join(', ') : app.skills || 'Kurtis'}
                  </Text>
                  <Text style={[styles.td, { flex: 1.5 }]}>
                    {Array.isArray(app.genderSpecialization) ? app.genderSpecialization.join(', ') : app.genderSpecialization || 'LADIES'}
                  </Text>
                  <View style={{ flex: 1.5 }}>
                    <View style={[
                      styles.appBadge,
                      app.status === 'APPROVED' ? styles.appApproved : app.status === 'REJECTED' ? styles.appRejected : styles.appPending
                    ]}>
                      <Text style={styles.appBadgeText}>{app.status}</Text>
                    </View>
                  </View>
                  <View style={styles.tdActions}>
                    {app.status === 'APPROVED' ? (
                      <TouchableOpacity
                        style={styles.createAccountBtn}
                        disabled={actionLoadingId === (app.applicationId || app.id)}
                        onPress={() => {
                          setTargetApp(app);
                          setShowActivateModal(true);
                        }}
                      >
                        {actionLoadingId === (app.applicationId || app.id) ? (
                          <ActivityIndicator color="#fff" size="small" />
                        ) : (
                          <Text style={styles.createAccountBtnText}>CREATE TAILOR ACCOUNT</Text>
                        )}
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.awaitingText}>Awaiting Approval</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )
        ) : (
          /* Active / Pending / Inactive Tailors View */
          filteredTailors.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No tailors match the selected criteria.</Text>
            </View>
          ) : isSmallScreen ? (
            <View style={styles.cardsContainer}>
              {filteredTailors.map((t) => (
                <View key={t.userId || t.id} style={styles.tailorCard}>
                  <View style={styles.cardTop}>
                    <Text style={styles.tailorName}>{t.name}</Text>
                    <UserStatusBadge status={t.accountStatus || 'ACTIVE'} />
                  </View>
                  <Text style={styles.tailorPhone}>{t.phone}</Text>
                  <Text style={styles.metaLabel}>Skills: <Text style={styles.metaVal}>{Array.isArray(t.skills) ? t.skills.join(', ') : 'Kurtis'}</Text></Text>
                  <Text style={styles.metaLabel}>Capacity: <Text style={styles.metaVal}>{t.dailyCapacity || 50} / day</Text></Text>

                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => navigation.navigate('MGRTailorDetail', { tailorId: t.userId || t.id })}
                    >
                      <Text style={styles.viewBtnText}>VIEW</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.resetAccessBtn}
                      onPress={() => { setTargetTailor(t); setShowResetModal(true); }}
                    >
                      <Text style={styles.resetAccessBtnText}>RESET</Text>
                    </TouchableOpacity>
                    {t.isActive !== false ? (
                      <TouchableOpacity
                        style={styles.deactBtn}
                        onPress={() => { setTargetTailor(t); setShowDeactivateModal(true); }}
                      >
                        <Text style={styles.deactBtnText}>DEACTIVATE</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.reactBtn}
                        onPress={() => handleReactivate(t.userId || t.id)}
                      >
                        <Text style={styles.reactBtnText}>REACTIVATE</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.tableCard}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 2 }]}>Tailor Name</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Phone</Text>
                <Text style={[styles.th, { flex: 2 }]}>Skills</Text>
                <Text style={[styles.th, { flex: 1.2 }]}>Availability</Text>
                <Text style={[styles.th, { flex: 1.5 }]}>Account Status</Text>
                <Text style={[styles.th, { flex: 2, textAlign: 'right' }]}>Actions</Text>
              </View>

              {filteredTailors.map((t, idx) => (
                <View key={t.userId || t.id} style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}>
                  <Text style={[styles.td, styles.tdBold, { flex: 2 }]}>{t.name}</Text>
                  <Text style={[styles.td, { flex: 1.5 }]}>{t.phone}</Text>
                  <Text style={[styles.td, { flex: 2 }]}>
                    {Array.isArray(t.skills) ? t.skills.join(', ') : 'Kurtis'}
                  </Text>
                  <View style={{ flex: 1.2 }}>
                    <UserStatusBadge status={t.availabilityStatus || 'AVAILABLE'} type="operational" />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <UserStatusBadge status={t.accountStatus || 'ACTIVE'} />
                  </View>
                  <View style={styles.tdActions}>
                    <TouchableOpacity
                      style={styles.viewBtn}
                      onPress={() => navigation.navigate('MGRTailorDetail', { tailorId: t.userId || t.id })}
                    >
                      <Text style={styles.viewBtnText}>VIEW</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.resetAccessBtn}
                      onPress={() => { setTargetTailor(t); setShowResetModal(true); }}
                    >
                      <Text style={styles.resetAccessBtnText}>RESET</Text>
                    </TouchableOpacity>
                    {t.isActive !== false ? (
                      <TouchableOpacity
                        style={styles.deactBtn}
                        onPress={() => { setTargetTailor(t); setShowDeactivateModal(true); }}
                      >
                        <Text style={styles.deactBtnText}>DEACTIVATE</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.reactBtn}
                        onPress={() => handleReactivate(t.userId || t.id)}
                      >
                        <Text style={styles.reactBtnText}>REACTIVATE</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )
        )}
      </ScrollView>

      {/* Modals */}
      <CreateTailorModal
        visible={showCreateModal}
        onSubmit={handleDirectCreate}
        onClose={() => setShowCreateModal(false)}
      />

      <ActivateTailorModal
        visible={showActivateModal}
        applicantName={targetApp?.applicantName || targetApp?.name || ''}
        applicantPhone={targetApp?.phone || ''}
        onConfirm={handleCreateAccountFromApp}
        onClose={() => setShowActivateModal(false)}
      />

      <ActivationSuccessModal
        visible={!!createdTailorData}
        data={createdTailorData}
        onClose={() => setCreatedTailorData(null)}
      />


      <ResetAccessModal
        visible={showResetModal}
        userName={targetTailor?.name || ''}
        userRole="TAILOR"
        onConfirm={handleConfirmReset}
        onClose={() => setShowResetModal(false)}
      />

      <DeactivateAccountModal
        visible={showDeactivateModal}
        userName={targetTailor?.name || ''}
        userRole="TAILOR"
        onConfirm={handleConfirmDeactivate}
        onClose={() => setShowDeactivateModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scrollContent: { padding: 20 },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#0f172a', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  addBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },

  tabBar: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, flexWrap: 'wrap' },
  tabItem: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  tabItemActive: { backgroundColor: '#7c3aed' },
  tabText: { fontSize: 12, fontWeight: '800', color: '#64748b' },
  tabTextActive: { color: '#ffffff' },
  filterRow: { marginBottom: 20 },
  searchInput: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#0f172a' },
  loadingBox: { padding: 40, alignItems: 'center' },
  emptyBox: { backgroundColor: '#ffffff', borderRadius: 12, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  emptyText: { fontSize: 14, color: '#64748b' },
  tableCard: { backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  th: { fontSize: 12, fontWeight: '800', color: '#475569', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableRowAlt: { backgroundColor: '#f8fafc' },
  td: { fontSize: 13, color: '#334155' },
  tdBold: { fontWeight: '700', color: '#0f172a' },
  tdActions: { flex: 2, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 },
  appBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  appApproved: { backgroundColor: '#dcfce7' },
  appRejected: { backgroundColor: '#fee2e2' },
  appPending: { backgroundColor: '#fef3c7' },
  appBadgeText: { fontSize: 11, fontWeight: '800', color: '#0f172a' },
  createAccountBtn: { backgroundColor: '#7c3aed', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  createAccountBtnText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  awaitingText: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic' },
  viewBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  viewBtnText: { fontSize: 11, fontWeight: '800', color: '#475569' },
  resetAccessBtn: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  resetAccessBtnText: { fontSize: 11, fontWeight: '800', color: '#b45309' },
  deactBtn: { backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  deactBtnText: { fontSize: 11, fontWeight: '800', color: '#b91c1c' },
  reactBtn: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  reactBtnText: { fontSize: 11, fontWeight: '800', color: '#15803d' },
  cardsContainer: { gap: 12 },
  tailorCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tailorName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  tailorPhone: { fontSize: 13, color: '#64748b', marginTop: 2 },
  metaLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  metaVal: { fontWeight: '700', color: '#0f172a' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
