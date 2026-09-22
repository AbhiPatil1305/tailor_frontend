import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../core/auth/AuthContext';
import { ApiClient } from '../../../infrastructure/api/ApiClient';
import { useNavigation } from '@react-navigation/native';
import { AvailabilityBadge } from '../components/AvailabilityBadge';

export const TailorProfileScreen = () => {
  const { userName, logout } = useAuth();
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const data = await ApiClient.getTailorProfile();
      setProfile(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfile();
    });
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color="#6d28d9" /></View>
      </SafeAreaView>
    );
  }

  const p = profile || {};

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(userName || 'T')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.phone}>{p.mobile || '+91 XXXX XXXXX'}</Text>
          
          <View style={styles.availWrap}>
            <AvailabilityBadge status={p.availability || 'AVAILABLE'} />
            <TouchableOpacity 
              style={styles.editAvailBtn}
              onPress={() => navigation.navigate('TailorAvailability')}
            >
              <Text style={styles.editAvailText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hub Assignment</Text>
          <View style={styles.card}>
            <Text style={styles.infoLabel}>Hub Name</Text>
            <Text style={styles.infoValue}>{p.hubName || 'Unassigned'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.card}>
            <View style={styles.skillsRow}>
              {(p.skills || ['Shirts', 'Trousers']).map((skill: string, i: number) => (
                <View key={i} style={styles.skillBadge}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.perfGrid}>
            <View style={styles.perfBox}>
              <Text style={styles.perfVal}>⭐ {p.rating || '4.8'}</Text>
              <Text style={styles.perfLabel}>Rating</Text>
            </View>
            <View style={styles.perfBox}>
              <Text style={styles.perfVal}>{p.completedGarments || 0}</Text>
              <Text style={styles.perfLabel}>Completed</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  scroll: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6d28d9', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '800' },
  name: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  phone: { fontSize: 15, color: '#64748b', marginBottom: 16 },
  availWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editAvailBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  editAvailText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
  infoLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillBadge: { backgroundColor: '#f3e8ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  skillText: { color: '#6d28d9', fontSize: 13, fontWeight: '700' },
  perfGrid: { flexDirection: 'row', gap: 12 },
  perfBox: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
  perfVal: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  perfLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  logoutBtn: { marginHorizontal: 20, marginVertical: 30, backgroundColor: '#fee2e2', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#dc2626', fontSize: 16, fontWeight: '800' },
});
