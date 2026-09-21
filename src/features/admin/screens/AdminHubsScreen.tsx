import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AdminLayout } from '../layouts/AdminLayout';
import { AddHubModal } from '../components/AddHubModal';
import { EditHubModal, HubData } from '../components/EditHubModal';
import { CreateHubManagerModal } from '../components/CreateHubManagerModal';
import { ApiClient } from '../../../infrastructure/api/ApiClient';

interface HubManagerData {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
}

interface HubItem {
  id?: string;
  _id?: string;
  name: string;
  code: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  contactPhone: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  managerUserId?: string;
  manager?: HubManagerData | null;
}

export const AdminHubsScreen = () => {
  const [hubs, setHubs] = useState<HubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHub, setEditingHub] = useState<HubItem | null>(null);
  const [managingHub, setManagingHub] = useState<HubItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchHubs = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.getHubs(false);
      if (Array.isArray(data)) {
        setHubs(data);
      }
    } catch (e) {
      console.error('Failed to load hubs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHubs();
  }, []);

  const handleHubCreated = (createdHub?: any) => {
    const name = createdHub?.name || 'New Hub';
    const code = createdHub?.code ? ` (${createdHub.code})` : '';
    setSuccessMessage(`Hub "${name}"${code} was created successfully!`);
    fetchHubs();

    setTimeout(() => {
      setSuccessMessage((prev) => (prev?.includes(name) ? null : prev));
    }, 6000);
  };

  const handleHubUpdated = (updatedHub?: any) => {
    setEditingHub(null);
    const name = updatedHub?.name || 'Hub';
    setSuccessMessage(`Hub "${name}" updated successfully!`);
    fetchHubs();

    setTimeout(() => {
      setSuccessMessage((prev) => (prev?.includes(name) ? null : prev));
    }, 6000);
  };

  const handleManagerCreated = (manager: any, hubName: string) => {
    setManagingHub(null);
    setSuccessMessage(
      `Hub Manager "${manager.name}" created for ${hubName}! Login Phone: ${manager.phone}`
    );
    fetchHubs();

    setTimeout(() => {
      setSuccessMessage(null);
    }, 8000);
  };

  const handleDeleteHub = (hub: HubItem) => {
    const hubId = hub.id || hub._id;
    if (!hubId) return;

    const confirmPrompt = `Are you sure you want to delete "${hub.name}" (${hub.code})? This action cannot be undone.`;

    const executeDelete = async () => {
      try {
        setDeletingId(hubId);
        await ApiClient.deleteHub(hubId);
        setSuccessMessage(`Hub "${hub.name}" deleted successfully.`);
        fetchHubs();

        setTimeout(() => {
          setSuccessMessage((prev) => (prev?.includes(hub.name) ? null : prev));
        }, 6000);
      } catch (e: any) {
        let msg = e.message || 'Failed to delete hub';
        try {
          const jsonStart = msg.indexOf('{');
          if (jsonStart !== -1) {
            const parsed = JSON.parse(msg.slice(jsonStart));
            if (parsed.detail?.message) msg = parsed.detail.message;
          }
        } catch {}

        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.alert) {
          window.alert(msg);
        } else {
          Alert.alert('Error', msg);
        }
      } finally {
        setDeletingId(null);
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      if (window.confirm(confirmPrompt)) {
        executeDelete();
      }
    } else {
      Alert.alert('Delete Hub', confirmPrompt, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete },
      ]);
    }
  };

  // Filtered hubs
  const filteredHubs = useMemo(() => {
    return hubs.filter((hub) => {
      if (filterStatus === 'ACTIVE' && hub.isActive === false) return false;
      if (filterStatus === 'INACTIVE' && hub.isActive !== false) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = hub.name?.toLowerCase().includes(q);
      const matchCode = hub.code?.toLowerCase().includes(q);
      const matchCity = hub.city?.toLowerCase().includes(q);
      const matchState = hub.state?.toLowerCase().includes(q);
      const matchPin = hub.pincode?.toLowerCase().includes(q);
      const matchPhone = hub.contactPhone?.toLowerCase().includes(q);
      const matchManager = hub.manager?.name?.toLowerCase().includes(q) || hub.manager?.phone?.includes(q);
      return matchName || matchCode || matchCity || matchState || matchPin || matchPhone || matchManager;
    });
  }, [hubs, searchQuery, filterStatus]);

  const totalCount = hubs.length;
  const activeCount = hubs.filter((h) => h.isActive !== false).length;
  const citiesCount = new Set(hubs.map((h) => h.city?.trim().toLowerCase()).filter(Boolean)).size;

  return (
    <AdminLayout title="Hubs Management" activeRoute="Hubs">
      {/* Top Banner Message */}
      {successMessage && (
        <View style={styles.successBanner}>
          <View style={styles.successContent}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBannerBtn}
            onPress={() => setSuccessMessage(null)}
          >
            <Text style={styles.closeBannerText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Header Action Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topBarSubtitle}>
            Configure, monitor, and manage distribution hubs and operational credentials
          </Text>
        </View>
        <View style={styles.topBarActions}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={fetchHubs}
            disabled={loading}
          >
            <Ionicons name="reload-outline" size={16} color="#475569" />
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text style={styles.addBtnText}>Add New Hub</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary KPI Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>TOTAL HUBS</Text>
            <View style={[styles.statIconBadge, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="business" size={16} color="#2563eb" />
            </View>
          </View>
          <Text style={styles.statValue}>{loading ? '...' : totalCount}</Text>
          <Text style={styles.statSub}>Configured facilities</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>ACTIVE HUBS</Text>
            <View style={[styles.statIconBadge, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
            </View>
          </View>
          <Text style={[styles.statValue, { color: '#059669' }]}>
            {loading ? '...' : activeCount}
          </Text>
          <Text style={styles.statSub}>Operational hubs</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>CITIES COVERED</Text>
            <View style={[styles.statIconBadge, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="location" size={16} color="#d97706" />
            </View>
          </View>
          <Text style={styles.statValue}>{loading ? '...' : citiesCount}</Text>
          <Text style={styles.statSub}>Geographic spread</Text>
        </View>
      </View>

      {/* Filter and Search Bar */}
      <View style={styles.filterCard}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by hub name, code, city, or manager..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabChip, filterStatus === 'ALL' && styles.tabChipActive]}
            onPress={() => setFilterStatus('ALL')}
          >
            <Text style={[styles.tabChipText, filterStatus === 'ALL' && styles.tabChipTextActive]}>
              All ({totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, filterStatus === 'ACTIVE' && styles.tabChipActive]}
            onPress={() => setFilterStatus('ACTIVE')}
          >
            <Text style={[styles.tabChipText, filterStatus === 'ACTIVE' && styles.tabChipTextActive]}>
              Active ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, filterStatus === 'INACTIVE' && styles.tabChipActive]}
            onPress={() => setFilterStatus('INACTIVE')}
          >
            <Text style={[styles.tabChipText, filterStatus === 'INACTIVE' && styles.tabChipTextActive]}>
              Inactive ({totalCount - activeCount})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hubs Content Area */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading hubs from cluster...</Text>
        </View>
      ) : filteredHubs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="business-outline" size={48} color="#94a3b8" />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery || filterStatus !== 'ALL' ? 'No Matching Hubs' : 'No Hubs Found'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || filterStatus !== 'ALL'
              ? 'Try adjusting your search query or status filter.'
              : 'Get started by setting up the first hub in your production network.'}
          </Text>
          <TouchableOpacity
            style={styles.emptyActionBtn}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.emptyActionBtnText}>Create New Hub</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {filteredHubs.map((hub) => {
            const isHubActive = hub.isActive !== false;
            const hubId = hub.id || hub._id;
            const isDeletingThis = deletingId === hubId;
            const hasManager = !!hub.manager?.name;

            return (
              <View key={hubId || hub.code} style={styles.hubCard}>
                {/* Hub Card Header */}
                <View style={styles.cardHeader}>
                  <View style={styles.hubTitleWrap}>
                    <Text style={styles.hubName}>{hub.name}</Text>
                    <View style={styles.codeBadge}>
                      <Text style={styles.codeBadgeText}>{hub.code}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      isHubActive ? styles.statusActive : styles.statusInactive,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: isHubActive ? '#10b981' : '#94a3b8' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: isHubActive ? '#065f46' : '#475569' },
                      ]}
                    >
                      {isHubActive ? 'Operational' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                {/* Hub Details */}
                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={18} color="#64748b" style={styles.infoIcon} />
                    <Text style={styles.infoText}>
                      {[hub.addressLine1, hub.city, `${hub.state} - ${hub.pincode}`]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="call-outline" size={18} color="#64748b" style={styles.infoIcon} />
                    <Text style={styles.infoText}>{hub.contactPhone || 'No contact phone'}</Text>
                  </View>

                  {/* Hub Manager Info Box */}
                  <View style={styles.managerInfoBox}>
                    <View style={styles.managerInfoLeft}>
                      <Ionicons
                        name="person-circle-outline"
                        size={22}
                        color={hasManager ? '#2563eb' : '#d97706'}
                        style={styles.infoIcon}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.managerHeaderLabel}>HUB MANAGER</Text>
                        {hasManager ? (
                          <Text style={styles.managerNameText} numberOfLines={1}>
                            {hub.manager?.name} ({hub.manager?.phone})
                          </Text>
                        ) : (
                          <Text style={styles.noManagerText}>No manager profile assigned</Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.managerActionBtn,
                        hasManager ? styles.managerActionBtnEdit : styles.managerActionBtnAdd,
                      ]}
                      onPress={() => setManagingHub(hub)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={hasManager ? 'key-outline' : 'person-add-outline'}
                        size={13}
                        color={hasManager ? '#334155' : '#ffffff'}
                      />
                      <Text
                        style={[
                          styles.managerActionBtnText,
                          hasManager ? styles.managerActionBtnTextEdit : styles.managerActionBtnTextAdd,
                        ]}
                      >
                        {hasManager ? 'Credentials' : 'Create Manager'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {hub.createdAt && (
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={16} color="#94a3b8" style={styles.infoIcon} />
                      <Text style={styles.infoDate}>
                        Created on {new Date(hub.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Hub Card Footer & Action Buttons */}
                <View style={styles.cardFooter}>
                  <View style={styles.cardFooterTag}>
                    <Ionicons name="cube-outline" size={14} color="#64748b" />
                    <Text style={styles.cardFooterTagText}>Facility</Text>
                  </View>

                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => setEditingHub(hub)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="create-outline" size={15} color="#2563eb" />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteHub(hub)}
                      activeOpacity={0.8}
                      disabled={isDeletingThis}
                    >
                      {isDeletingThis ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <>
                          <Ionicons name="trash-outline" size={15} color="#dc2626" />
                          <Text style={styles.deleteBtnText}>Delete</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Add Hub Modal */}
      <AddHubModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleHubCreated}
      />

      {/* Edit Hub Modal */}
      <EditHubModal
        visible={!!editingHub}
        hub={editingHub as HubData | null}
        onClose={() => setEditingHub(null)}
        onSuccess={handleHubUpdated}
      />

      {/* Create Hub Manager Modal */}
      <CreateHubManagerModal
        visible={!!managingHub}
        hub={managingHub}
        onClose={() => setManagingHub(null)}
        onSuccess={handleManagerCreated}
      />
    </AdminLayout>
  );
};

const styles = StyleSheet.create({
  successBanner: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  successIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
    marginRight: 10,
  },
  successText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065f46',
  },
  closeBannerBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#d1fae5',
  },
  closeBannerText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '700',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  topBarSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    elevation: 2,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flex: 1,
    minWidth: 200,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  statIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  statSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flex: 1,
    minWidth: 260,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    padding: 0,
  },
  clearSearchBtn: {
    padding: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  tabChipActive: {
    backgroundColor: '#0f172a',
  },
  tabChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tabChipTextActive: {
    color: '#ffffff',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  hubCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    flex: 1,
    minWidth: 320,
    maxWidth: Platform.OS === 'web' ? '49%' : '100%',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  hubTitleWrap: {
    flex: 1,
    marginRight: 10,
  },
  hubName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: '#ecfdf5',
  },
  statusInactive: {
    backgroundColor: '#f1f5f9',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    paddingVertical: 14,
    marginBottom: 14,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoIcon: {
    marginTop: 1,
  },
  infoText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
    flex: 1,
    fontWeight: '500',
  },
  managerInfoBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  managerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  managerHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  managerNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  noManagerText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#b45309',
    fontStyle: 'italic',
  },
  managerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  managerActionBtnAdd: {
    backgroundColor: '#2563eb',
  },
  managerActionBtnEdit: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  managerActionBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  managerActionBtnTextAdd: {
    color: '#ffffff',
  },
  managerActionBtnTextEdit: {
    color: '#334155',
  },
  infoDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '400',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardFooterTagText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 64,
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  centerContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 50,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
