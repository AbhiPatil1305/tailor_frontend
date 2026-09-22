import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';
import { Garment, GarmentEvent } from '../../../../domain/models/types';
import { SLABadge } from '../../components/manager/SLABadge';

const STAGE_COLORS: Record<string, string> = {
  intake: '#6366f1', cutting: '#8b5cf6', stitching: '#a855f7', qc: '#ec4899',
  rework: '#dc2626', ironing: '#f97316', packed: '#10b981', dispatched: '#0ea5e9',
  out_for_delivery: '#0284c7', delivered: '#16a34a',
};

const EVENT_ICONS: Record<string, string> = {
  GARMENT_CREATED: '📋', INTAKE: '📥', CUTTING_STARTED: '✂️', CUTTING_COMPLETED: '✅',
  TAILOR_ASSIGNED: '🧵', STITCHING_STARTED: '▶️', STITCHING_COMPLETED: '✅',
  QC_STARTED: '🔍', QC_PASSED: '✅', QC_REWORK: '🔄', REWORK_COMPLETED: '✅',
  IRONING_STARTED: '🔥', IRONING_COMPLETED: '✅', PACKED: '📦',
  DISPATCHED: '🚚', OUT_FOR_DELIVERY: '🛵', DELIVERED: '✅', COD_COLLECTED: '💰',
  MEASUREMENTS_ADDED: '📏', MEASUREMENTS_CONFIRMED: '✅', MEASUREMENTS_CLARIFICATION_REQUESTED: '❓',
};

export const ManagerGarmentDetailScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { garmentId } = route.params;

  const [garment, setGarment] = useState<Garment | null>(null);
  const [events, setEvents] = useState<GarmentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [g, ev] = await Promise.all([
          ApiClient.getGarmentById(garmentId),
          ApiClient.getGarmentEvents(garmentId),
        ]);
        setGarment(g);
        setEvents(ev);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [garmentId]);

  if (loading) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}><ActivityIndicator size="large" color="#7c3aed" /></View>
    </SafeAreaView>
  );

  if (error || !garment) return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'Garment not found'}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const stageColor = STAGE_COLORS[garment.stage] ?? '#64748b';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Garments</Text>
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleRow}>
          <Text style={styles.garmentId}>{garment.qrCode}</Text>
          <View style={[styles.stageBadge, { backgroundColor: stageColor + '20', borderColor: stageColor }]}>
            <Text style={[styles.stageText, { color: stageColor }]}>{garment.stage.toUpperCase()}</Text>
          </View>
        </View>

        {/* SLA */}
        <SLABadge garment={garment} />

        {/* Info cards */}
        <View style={styles.infoGrid}>
          <InfoCard label="Type"     value={garment.type} />
          <InfoCard label="Gender"   value={garment.gender} />
          <InfoCard label="Order ID" value={garment.orderId} mono />
          <InfoCard label="Measurements" value={garment.measurementsConfirmed ? '✅ Confirmed' : '⏳ Pending'} />
          <InfoCard label="Assigned Tailor" value={garment.assignedTailorId ?? 'Unassigned'} />
          <InfoCard label="Hub"      value={garment.hubId} />
        </View>

        {/* Measurements detail */}
        {garment.measurements?.data && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MEASUREMENTS</Text>
            <View style={styles.measurementsGrid}>
              {Object.entries(garment.measurements.data).map(([k, v]) => (
                <View key={k} style={styles.measureItem}>
                  <Text style={styles.measureKey}>{k}</Text>
                  <Text style={styles.measureValue}>{String(v)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Event Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EVENT TIMELINE</Text>
          {events.length === 0 ? (
            <Text style={styles.noEvents}>No events recorded</Text>
          ) : (
            <View style={styles.timeline}>
              {events.map((ev, idx) => {
                const isLast = idx === events.length - 1;
                return (
                  <View key={ev.id} style={styles.timelineRow}>
                    <View style={styles.timelineLeft}>
                      <View style={[styles.dot, isLast && styles.dotActive]}>
                        <Text style={styles.dotIcon}>{EVENT_ICONS[ev.eventType] ?? '●'}</Text>
                      </View>
                      {!isLast && <View style={styles.line} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.eventType}>{ev.eventType.replace(/_/g, ' ')}</Text>
                      <Text style={styles.eventBy}>{ev.performedByRole} · {ev.performedBy}</Text>
                      <Text style={styles.eventTime}>{new Date(ev.timestamp).toLocaleString()}</Text>
                      {ev.metadata?.reason && (
                        <Text style={styles.eventReason}>Reason: {ev.metadata.reason}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoCard = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <View style={icStyles.card}>
    <Text style={icStyles.label}>{label}</Text>
    <Text style={[icStyles.value, mono && icStyles.mono]} numberOfLines={2}>{value}</Text>
  </View>
);

const icStyles = StyleSheet.create({
  card: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  label: { fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 4 },
  value: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  mono: { fontFamily: 'Courier New', fontSize: 12 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  errorText: { color: '#dc2626', fontSize: 15, textAlign: 'center', marginBottom: 16 },
  backBtn: { backgroundColor: '#7c3aed', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 20 },
  backBtnText: { color: '#fff', fontWeight: '700' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  backArrow: { fontSize: 20, color: '#7c3aed' },
  backLabel: { fontSize: 15, color: '#7c3aed', fontWeight: '600' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  garmentId: { fontSize: 22, fontWeight: '900', color: '#1e293b', fontFamily: 'Courier New', flex: 1 },
  stageBadge: { borderRadius: 8, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 5 },
  stageText: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16, marginBottom: 8 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginTop: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 16 },
  measurementsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  measureItem: { minWidth: '30%', backgroundColor: '#f8fafc', borderRadius: 10, padding: 10 },
  measureKey: { fontSize: 10, color: '#94a3b8', fontWeight: '600', marginBottom: 3 },
  measureValue: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  noEvents: { color: '#94a3b8', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 14 },
  timelineLeft: { alignItems: 'center', width: 36 },
  dot: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' },
  dotActive: { backgroundColor: '#ede9fe', borderColor: '#7c3aed' },
  dotIcon: { fontSize: 16 },
  line: { flex: 1, width: 2, backgroundColor: '#e2e8f0', marginTop: 4, marginBottom: 4 },
  timelineContent: { flex: 1, paddingBottom: 20, paddingTop: 6 },
  eventType: { fontSize: 14, fontWeight: '700', color: '#1e293b', textTransform: 'capitalize' },
  eventBy: { fontSize: 12, color: '#64748b', marginTop: 2 },
  eventTime: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  eventReason: { fontSize: 12, color: '#dc2626', marginTop: 4, fontStyle: 'italic' },
});
