import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AdminLayout } from '../layouts/AdminLayout';
import { AddHubModal } from '../components/AddHubModal';
import { ApiClient } from '../../../infrastructure/api/ApiClient';

import { useNavigation } from '@react-navigation/native';

export const AdminDashboardScreen = () => {
  const navigation = useNavigation<any>();
  const [showAddHub, setShowAddHub] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hubCount, setHubCount] = useState<number | null>(null);

  const loadHubs = async () => {
    try {
      const hubs = await ApiClient.getHubs();
      if (Array.isArray(hubs)) {
        setHubCount(hubs.length);
      }
    } catch (e) {
      console.error('Failed to load hubs:', e);
    }
  };

  useEffect(() => {
    loadHubs();
  }, []);

  const handleHubCreated = (createdHub?: any) => {
    const hubName = createdHub?.name || 'New Hub';
    const hubCode = createdHub?.code ? ` (${createdHub.code})` : '';
    setSuccessMessage(`Hub "${hubName}"${hubCode} created successfully!`);
    loadHubs();

    // Auto-dismiss after 6 seconds
    setTimeout(() => {
      setSuccessMessage((prev) => (prev?.includes(hubName) ? null : prev));
    }, 6000);
  };

  return (
    <AdminLayout title="Dashboard" activeRoute="Dashboard">
      <View style={styles.topBar}>
        <Text style={styles.dashboardSubtitle}>Real-time operations overview & management</Text>
        <TouchableOpacity
          style={styles.addHubTopBtn}
          onPress={() => setShowAddHub(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addHubTopBtnText}>＋ Add New Hub</Text>
        </TouchableOpacity>
      </View>

      {successMessage && (
        <View style={styles.successBanner}>
          <View style={styles.successContent}>
            <Text style={styles.successIcon}>✓</Text>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setSuccessMessage(null)}
            accessibilityLabel="Dismiss success message"
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.card, styles.clickableCard]}
          onPress={() => navigation.navigate('AdminHubs')}
          activeOpacity={0.85}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={styles.value}>{hubCount !== null ? hubCount : '...'}</Text>
            <Text style={styles.cardArrow}>→</Text>
          </View>
          <Text style={styles.label}>Total Hubs</Text>
          <Text style={styles.cardHint}>Click to manage all hubs</Text>
        </TouchableOpacity>
        <View style={styles.card}>
          <Text style={styles.value}>284</Text>
          <Text style={styles.label}>Orders Today</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>1,142</Text>
          <Text style={styles.label}>Garments in Production</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>18</Text>
          <Text style={styles.label}>At Risk</Text>
        </View>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddHub(true)}
        accessibilityLabel="Add New Hub"
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <AddHubModal
        visible={showAddHub}
        onClose={() => setShowAddHub(false)}
        onSuccess={handleHubCreated}
      />
    </AdminLayout>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 12,
  },
  dashboardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  addHubTopBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  addHubTopBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  successBanner: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 10,
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
    fontSize: 15,
    fontWeight: '600',
    color: '#065f46',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#d1fae5',
  },
  closeBtnText: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 200,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  clickableCard: {
    borderColor: '#93c5fd',
    backgroundColor: '#f0f9ff',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  cardArrow: {
    fontSize: 20,
    color: '#2563eb',
    fontWeight: '700',
  },
  cardHint: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 6,
    fontWeight: '500',
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 28, lineHeight: 28 },
});
