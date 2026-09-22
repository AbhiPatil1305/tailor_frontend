import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { Tailor } from '../../../../domain/models/types';

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={infoStyles.row}>
    <Text style={infoStyles.label}>{label}</Text>
    <Text style={infoStyles.value}>{value}</Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '700', color: '#1e293b', textAlign: 'right', flex: 1, marginLeft: 20 },
});

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  available: { bg: '#f0fdf4', text: '#16a34a' },
  busy:      { bg: '#fffbeb', text: '#d97706' },
  'on-leave':{ bg: '#fef2f2', text: '#dc2626' },
};

export const ManagerTailorDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { tailorId } = route.params;

  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getTailorById(tailorId).then(t => { setTailor(t); setLoading(false); });
  }, [tailorId]);

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}><ActivityIndicator size="large" color="#7c3aed" /></View>
    </SafeAreaView>
  );

  if (!tailor) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>
        <Text style={styles.errorText}>Tailor not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const sc = STATUS_COLORS[tailor.status] ?? STATUS_COLORS.busy;
  const remaining = tailor.capacityPerDay - tailor.assignedToday;
  const utilPct = Math.min(100, (tailor.assignedToday / tailor.capacityPerDay) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Tailors</Text>
        </TouchableOpacity>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{tailor.name.charAt(0)}</Text>
          </View>
          <Text style={styles.name}>{tailor.name}</Text>
          <Text style={styles.spec}>{tailor.specialisations.join(' · ')}</Text>
          <Text style={styles.gender}>{tailor.gender} specialist</Text>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{tailor.status.toUpperCase()}</Text>
          </View>
          <Text style={styles.rating}>{'★'.repeat(Math.round(tailor.rating))} {tailor.rating.toFixed(1)}</Text>
        </View>

        {/* Capacity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CAPACITY TODAY</Text>
          <View style={styles.capacityRow}>
            <View style={styles.capacityStat}>
              <Text style={styles.capValue}>{tailor.assignedToday}</Text>
              <Text style={styles.capLabel}>Assigned</Text>
            </View>
            <View style={styles.capacityStat}>
              <Text style={[styles.capValue, { color: '#16a34a' }]}>{remaining}</Text>
              <Text style={styles.capLabel}>Remaining</Text>
            </View>
            <View style={styles.capacityStat}>
              <Text style={styles.capValue}>{tailor.capacityPerDay}</Text>
              <Text style={styles.capLabel}>Total</Text>
            </View>
          </View>
          <View style={styles.barBg}>
            <View style={[styles.barFill, {
              width: `${utilPct}%` as any,
              backgroundColor: utilPct > 80 ? '#dc2626' : utilPct > 60 ? '#f97316' : '#16a34a',
            }]} />
          </View>
          <Text style={styles.utilText}>{utilPct.toFixed(0)}% utilized</Text>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETAILS</Text>
          <InfoRow label="Phone"     value={tailor.phone} />
          <InfoRow label="Hub"       value={tailor.hubId} />
          <InfoRow label="Rating"    value={`${tailor.rating.toFixed(1)} / 5.0`} />
          <InfoRow label="Specialisations" value={tailor.specialisations.join(', ')} />
          <InfoRow label="Gender Focus" value={tailor.gender} />
        </View>

        {/* Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PAYOUT SUMMARY</Text>
          <View style={styles.earningsRow}>
            <EarnCard label="Earned"  value={`₹${tailor.earnedBalance}`}  color="#16a34a" />
            <EarnCard label="Pending" value={`₹${tailor.pendingBalance}`} color="#f97316" />
            <EarnCard label="Paid"    value={`₹${tailor.paidBalance}`}    color="#7c3aed" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const EarnCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <View style={earnStyles.card}>
    <Text style={[earnStyles.value, { color }]}>{value}</Text>
    <Text style={earnStyles.label}>{label}</Text>
  </View>
);

const earnStyles = StyleSheet.create({
  card: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, alignItems: 'center' },
  value: { fontSize: 20, fontWeight: '900', marginBottom: 4 },
  label: { fontSize: 11, color: '#64748b', fontWeight: '600' },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { color: '#dc2626', fontSize: 15, marginBottom: 16 },
  backBtn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backArrow: { fontSize: 20, color: '#7c3aed' },
  backLabel: { fontSize: 15, color: '#7c3aed', fontWeight: '600' },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 16, shadowColor: '#7c3aed', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 6 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  avatarText: { fontSize: 36, fontWeight: '900', color: '#7c3aed' },
  name: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginBottom: 6 },
  spec: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  gender: { fontSize: 12, color: '#8b5cf6', fontWeight: '600', textTransform: 'capitalize', marginBottom: 10 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 8 },
  statusText: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  rating: { fontSize: 16, color: '#f59e0b', fontWeight: '700' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 16 },
  capacityRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  capacityStat: { flex: 1, backgroundColor: '#f8fafc', borderRadius: 12, padding: 14, alignItems: 'center' },
  capValue: { fontSize: 28, fontWeight: '900', color: '#1e293b', marginBottom: 4 },
  capLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  barBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', borderRadius: 4 },
  utilText: { fontSize: 12, color: '#64748b', textAlign: 'right' },
  earningsRow: { flexDirection: 'row', gap: 10 },
});
