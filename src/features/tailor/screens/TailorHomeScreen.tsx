import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, SafeAreaView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../core/auth/AuthContext';
import { ApiClient } from '../../../infrastructure/api/ApiClient';
import { AvailabilityBadge } from '../components/AvailabilityBadge';
import { SLABadge, getSLAStatus } from '../components/SLABadge';
import { OfflineBanner } from '../components/OfflineBanner';

export const TailorHomeScreen = () => {
  const { userName, userId, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await ApiClient.getTailorDashboard();
      setDashboard(data);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);
  const onRefresh = () => { setRefreshing(true); loadDashboard(); };

  const confirmLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to log out?')) logout();
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', onPress: logout, style: 'destructive' },
      ]);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const d = dashboard || {};
  const availability = d.availability || 'AVAILABLE';
  const counts = d.workCounts || {};
  const earnings = d.earnings || {};
  const atRisk = d.atRiskGarments || [];

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6d28d9" />
          <Text style={styles.loadingText}>Loading your dashboard…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <OfflineBanner visible={!isOnline} />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>TAILOR24</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('TailorNotifications')}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {(d.unreadNotifications || 0) > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{d.unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={confirmLogout}>
            <Ionicons name="log-out-outline" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6d28d9" />}
      >
        {/* Greeting + availability */}
        <View style={styles.greetCard}>
          <Text style={styles.greetSub}>{greeting()},</Text>
          <Text style={styles.greetName}>{(userName || 'Tailor').split(' ')[0]} 🧵</Text>
          <View style={styles.availRow}>
            <AvailabilityBadge status={availability} large />
            <TouchableOpacity
              style={styles.changeAvailBtn}
              onPress={() => navigation.navigate('TailorAvailability')}
            >
              <Text style={styles.changeAvailText}>Change</Text>
            </TouchableOpacity>
          </View>
          {d.profile?.hubName && (
            <Text style={styles.hubName}>📍 {d.profile.hubName}</Text>
          )}
        </View>

        {/* At-risk garments */}
        {atRisk.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>⚠ URGENT — NEEDS ATTENTION</Text>
            {atRisk.map((g: any) => (
              <TouchableOpacity
                key={g.id || g._id}
                style={styles.urgentCard}
                onPress={() => navigation.navigate('TailorGarmentDetail', { garmentId: g.id || g._id })}
              >
                <View style={styles.urgentRow}>
                  <Text style={styles.urgentQr}>{g.qrCode}</Text>
                  <SLABadge status={g.slaStatus || getSLAStatus(g.sla?.dueAt)} compact />
                </View>
                <Text style={styles.urgentType}>{g.garmentType || g.type} · {g.gender}</Text>
                <Text style={styles.urgentStage}>{(g.currentStage || '').replace(/_/g, ' ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Today's work summary */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TODAY'S WORK</Text>
          <View style={styles.countsGrid}>
            <CountCard label="Assigned" value={counts.assigned || 0} color="#6d28d9" />
            <CountCard label="In Progress" value={counts.inProgress || 0} color="#2563eb" />
            <CountCard label="Rework" value={counts.rework || 0} color="#dc2626" />
            <CountCard label="Done Today" value={counts.completedToday || 0} color="#10b981" />
          </View>
        </View>

        {/* Big scan CTA */}
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate('TailorScan')}
        >
          <Text style={styles.scanIcon}>📷</Text>
          <Text style={styles.scanText}>SCAN GARMENT</Text>
        </TouchableOpacity>

        {/* Earnings snapshot */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EARNINGS</Text>
          <View style={styles.earningsCard}>
            <EarningRow label="Today" value={earnings.today || 0} />
            <View style={styles.divider} />
            <EarningRow label="Pending" value={earnings.pending || 0} highlight />
            <EarningRow label="Paid" value={earnings.paid || 0} />
            <TouchableOpacity
              style={styles.earningsLink}
              onPress={() => navigation.navigate('TailorEarnings')}
            >
              <Text style={styles.earningsLinkText}>View full earnings →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.quickGrid}>
            <QuickBtn icon="📋" label="My Work" onPress={() => navigation.navigate('TailorWork')} />
            <QuickBtn icon="📅" label="Leave" onPress={() => navigation.navigate('TailorLeave')} />
            <QuickBtn icon="📍" label="Location" onPress={() => navigation.navigate('TailorLocation')} />
            <QuickBtn icon="👤" label="Profile" onPress={() => navigation.navigate('TailorProfile')} />
          </View>
        </View>

        {/* Pending leave status */}
        {d.pendingLeaveRequest && (
          <View style={styles.leaveAlert}>
            <Text style={styles.leaveAlertText}>
              📅 Leave request pending approval (submitted {new Date(d.pendingLeaveRequest.createdAt).toLocaleDateString()})
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const CountCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <View style={[styles.countCard, { borderTopColor: color }]}>
    <Text style={[styles.countValue, { color }]}>{value}</Text>
    <Text style={styles.countLabel}>{label}</Text>
  </View>
);

const EarningRow = ({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) => (
  <View style={styles.earningRow}>
    <Text style={styles.earningLabel}>{label}</Text>
    <Text style={[styles.earningValue, highlight && { color: '#6d28d9' }]}>
      ₹{value.toLocaleString('en-IN')}
    </Text>
  </View>
);

const QuickBtn = ({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) => (
  <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
    <Text style={styles.quickIcon}>{icon}</Text>
    <Text style={styles.quickLabel}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#6d28d9', marginTop: 12, fontWeight: '600' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  brand: { fontSize: 18, fontWeight: '900', color: '#6d28d9', letterSpacing: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { position: 'relative', padding: 6 },
  bellIcon: { fontSize: 22 },
  badge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: '#dc2626',
    borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  greetCard: {
    backgroundColor: '#6d28d9', borderRadius: 20, padding: 22, marginBottom: 16,
  },
  greetSub: { color: '#c4b5fd', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  greetName: { color: '#ffffff', fontSize: 26, fontWeight: '900', marginBottom: 14 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  changeAvailBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  changeAvailText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  hubName: { color: '#c4b5fd', fontSize: 13, marginTop: 10 },
  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#94a3b8',
    letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase',
  },
  urgentCard: {
    backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: '#dc2626',
  },
  urgentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  urgentQr: { fontFamily: 'monospace', fontSize: 12, color: '#64748b', fontWeight: '600' },
  urgentType: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  urgentStage: { fontSize: 12, color: '#64748b' },
  countsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  countCard: {
    flex: 1, minWidth: '44%', backgroundColor: '#ffffff', borderRadius: 14,
    padding: 14, borderTopWidth: 3, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  countValue: { fontSize: 30, fontWeight: '900', marginBottom: 4 },
  countLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  scanBtn: {
    backgroundColor: '#6d28d9', borderRadius: 18, paddingVertical: 20,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12,
    marginBottom: 16, shadowColor: '#6d28d9', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  scanIcon: { fontSize: 28 },
  scanText: { color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  earningsCard: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1,
  },
  earningRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  earningLabel: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  earningValue: { fontSize: 16, color: '#1e293b', fontWeight: '800' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 4 },
  earningsLink: { paddingTop: 10 },
  earningsLinkText: { color: '#6d28d9', fontWeight: '700', fontSize: 13, textAlign: 'right' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: {
    flex: 1, minWidth: '44%', backgroundColor: '#ffffff', borderRadius: 14,
    padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, elevation: 1,
  },
  quickIcon: { fontSize: 26, marginBottom: 6 },
  quickLabel: { fontSize: 12, color: '#1e293b', fontWeight: '700' },
  leaveAlert: {
    backgroundColor: '#fef3c7', borderRadius: 12, padding: 14, marginBottom: 8,
  },
  leaveAlertText: { color: '#92400e', fontSize: 13, fontWeight: '600' },
});
