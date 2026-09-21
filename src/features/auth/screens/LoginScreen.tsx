import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../../../core/auth/AuthContext';
import { MockApi } from '../../../infrastructure/api/MockApi';

// ── Demo accounts (Priority 5) ──────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  {
    section: 'Customer',
    roles: [
      { title: 'Customer App', email: 'customer@tailor24.demo', role: 'customer' as const, id: 'c1', name: 'Ravi Kumar', icon: '📱', color: '#ec4899' },
    ],
  },
  {
    section: 'Tailor Workforce',
    roles: [
      { title: 'Tailor (Lata — Ladies)', email: 'lata@tailor24.demo', role: 'tailor' as const, id: 't1', name: 'Lata Sharma', icon: '🧵', color: '#f59e0b' },
      { title: 'Tailor (Santosh — Gents)', email: 'santosh@tailor24.demo', role: 'tailor' as const, id: 't2', name: 'Santosh Kumar', icon: '🧵', color: '#f59e0b' },
    ],
  },
  {
    section: 'Hub Operations',
    roles: [
      { title: 'Hub Staff (Intake / Scan)', email: 'staff@tailor24.demo', role: 'hub_staff' as const, id: 's1', name: 'Hub Staff', icon: '📦', color: '#10b981' },
      { title: 'Hub Manager',              email: 'manager@tailor24.demo', role: 'hub_manager' as const, id: 'm1', name: 'Hub Manager', icon: '📊', color: '#8b5cf6' },
    ],
  },
  {
    section: 'Logistics & Admin',
    roles: [
      { title: 'Delivery Rider', email: 'rider@tailor24.demo', role: 'rider' as const, id: 'r1', name: 'Rider', icon: '🛵', color: '#f97316' },
      { title: 'Admin & Finance', email: 'admin@tailor24.demo', role: 'admin' as const, id: 'a1', name: 'Finance Admin', icon: '🏦', color: '#64748b' },
    ],
  },
];

export const LoginScreen = () => {
  const { login } = useAuth();
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    Alert.alert(
      '🔄 Reset Demo Data',
      'This restores all garments, tailors, orders, and events to the original demo state.\n\nUseful before a judge presentation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Now',
          style: 'destructive',
          onPress: () => {
            setResetting(true);
            setTimeout(() => {
              MockApi.resetDemo();
              setResetting(false);
              Alert.alert('✅ Demo Reset', 'All data restored to the demo scenario. You can now run the full 2-minute walkthrough.');
            }, 400);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>✂️</Text>
          </View>
          <Text style={styles.title}>TAILOR<Text style={styles.titleAccent}>24</Text></Text>
          <Text style={styles.subtitle}>On-Demand Tailoring Platform</Text>
          <Text style={styles.tagline}>Book it. Tag it. Stitch it. Pay it.</Text>
        </View>

        {/* Demo Reset — Dev only */}
        <TouchableOpacity
          style={[styles.resetBtn, resetting && styles.resetBtnDisabled]}
          onPress={handleReset}
          disabled={resetting}
        >
          <Text style={styles.resetIcon}>🔄</Text>
          <Text style={styles.resetText}>{resetting ? 'Resetting...' : 'Reset Demo Data'}</Text>
        </TouchableOpacity>

        {/* Role cards */}
        {DEMO_ACCOUNTS.map(section => (
          <View key={section.section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.section}</Text>
            {section.roles.map(r => (
              <TouchableOpacity
                key={r.id + r.role}
                style={[styles.roleCard, { borderLeftColor: r.color }]}
                onPress={() => login(r.role, r.id, r.name)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconBox, { backgroundColor: r.color + '20' }]}>
                  <Text style={styles.iconText}>{r.icon}</Text>
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleTitle}>{r.title}</Text>
                  <Text style={styles.roleEmail}>{r.email}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Refresh warning */}
        <View style={styles.warningBox}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningText}>
            This is an in-memory demo. Refreshing the browser will clear live session actions.
            Use <Text style={{ fontWeight: '700' }}>Reset Demo Data</Text> before each presentation.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flexGrow: 1, padding: 24, paddingBottom: 60, alignItems: 'center' },

  header: { alignItems: 'center', marginTop: 40, marginBottom: 28 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  logoIcon: { fontSize: 36 },
  title: { fontSize: 32, fontWeight: '900', color: '#1e293b', letterSpacing: 1 },
  titleAccent: { color: '#f59e0b' },
  subtitle: { fontSize: 16, color: '#64748b', marginTop: 8, fontWeight: '500' },
  tagline: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontStyle: 'italic' },

  resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef3c7', borderWidth: 1.5, borderColor: '#f59e0b', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, marginBottom: 28, width: '100%', maxWidth: 500, gap: 8 },
  resetBtnDisabled: { opacity: 0.5 },
  resetIcon: { fontSize: 18 },
  resetText: { fontSize: 15, fontWeight: '700', color: '#92400e' },

  section: { width: '100%', maxWidth: 500, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginLeft: 4 },

  roleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  iconBox: { width: 46, height: 46, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  iconText: { fontSize: 22 },
  roleTextContainer: { flex: 1 },
  roleTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  roleEmail: { fontSize: 12, color: '#94a3b8', fontFamily: 'Courier' },
  chevron: { fontSize: 24, color: '#cbd5e1' },

  warningBox: { flexDirection: 'row', backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a', borderRadius: 12, padding: 14, width: '100%', maxWidth: 500, gap: 10, marginTop: 8 },
  warningIcon: { fontSize: 16 },
  warningText: { flex: 1, fontSize: 12, color: '#78350f', lineHeight: 18 },
});
