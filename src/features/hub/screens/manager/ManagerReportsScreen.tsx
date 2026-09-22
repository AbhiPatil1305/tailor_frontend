import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../../../core/auth/AuthContext';
import { ApiClient } from '../../../../infrastructure/api/ApiClient';

type ReportPeriod = 'today' | 'week' | 'month';

const PERIOD_OPTIONS: { key: ReportPeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

const MetricCard = ({
  label, value, sub, color = '#7c3aed', icon,
}: {
  label: string; value: string | number; sub?: string; color?: string; icon: string;
}) => (
  <View style={mcStyles.card}>
    <View style={[mcStyles.iconWrap, { backgroundColor: color + '15' }]}>
      <Text style={mcStyles.icon}>{icon}</Text>
    </View>
    <Text style={[mcStyles.value, { color }]}>{value}</Text>
    <Text style={mcStyles.label}>{label}</Text>
    {sub && <Text style={mcStyles.sub}>{sub}</Text>}
  </View>
);

const mcStyles = StyleSheet.create({
  card: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 16, padding: 18, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  iconWrap: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  icon: { fontSize: 24 },
  value: { fontSize: 30, fontWeight: '900', marginBottom: 4 },
  label: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3, textAlign: 'center' },
  sub: { fontSize: 10, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
});

const ProgressRow = ({ label, value, total, color }: { label: string; value: number; total: number; color: string }) => {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0;
  return (
    <View style={prStyles.row}>
      <View style={prStyles.top}>
        <Text style={prStyles.label}>{label}</Text>
        <Text style={prStyles.value}>{value} <Text style={prStyles.total}>/ {total}</Text></Text>
      </View>
      <View style={prStyles.barBg}>
        <View style={[prStyles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const prStyles = StyleSheet.create({
  row: { marginBottom: 14 },
  top: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, color: '#475569', fontWeight: '600' },
  value: { fontSize: 13, fontWeight: '800', color: '#1e293b' },
  total: { color: '#94a3b8', fontWeight: '400' },
  barBg: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
});

export const ManagerReportsScreen = () => {
  const { hubId } = useAuth();

  const [period, setPeriod] = useState<ReportPeriod>('today');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await ApiClient.getHubReport(hubId || undefined, period);
      setReport(data);
    } catch { setReport(null); }
    finally { setLoading(false); setRefreshing(false); }
  }, [hubId, period]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  const r = report || {};

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#7c3aed" />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Hub Reports</Text>
        </View>

        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.periodBtn, period === opt.key && styles.periodBtnActive]}
              onPress={() => setPeriod(opt.key)}
            >
              <Text style={[styles.periodText, period === opt.key && styles.periodTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.centered}><ActivityIndicator size="large" color="#7c3aed" /></View>
        ) : (
          <>
            {/* KPI Grid */}
            <Text style={styles.sectionLabel}>KEY METRICS</Text>
            <View style={styles.metricsGrid}>
              <MetricCard icon="👕" label="Garments Processed" value={r.garmentsProcessed ?? '—'} color="#7c3aed" />
              <MetricCard icon="✅" label="Delivered"          value={r.delivered ?? '—'}          color="#16a34a" />
              <MetricCard icon="⏱"  label="Avg TAT (hrs)"     value={r.avgTAT?.toFixed(1) ?? '—'} color="#0ea5e9" sub="Target: ≤24h" />
              <MetricCard icon="🔍" label="QC Pass Rate"       value={r.qcPassRate ? `${r.qcPassRate}%` : '—'} color="#ec4899" />
              <MetricCard icon="🔄" label="Rework Rate"        value={r.reworkRate ? `${r.reworkRate}%` : '—'} color="#f97316" />
              <MetricCard icon="💰" label="Payouts Processed"  value={r.payoutsProcessed ? `₹${r.payoutsProcessed.toLocaleString()}` : '—'} color="#10b981" />
            </View>

            {/* Tailor Performance */}
            {r.tailorPerformance && r.tailorPerformance.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>TAILOR PERFORMANCE</Text>
                <View style={styles.section}>
                  {r.tailorPerformance.map((tp: any) => (
                    <ProgressRow
                      key={tp.tailorId}
                      label={tp.name}
                      value={tp.completed}
                      total={tp.assigned}
                      color="#7c3aed"
                    />
                  ))}
                </View>
              </>
            )}

            {/* Stage Distribution */}
            {r.stageDistribution && (
              <>
                <Text style={styles.sectionLabel}>STAGE DISTRIBUTION</Text>
                <View style={styles.section}>
                  {Object.entries(r.stageDistribution).map(([stage, count]) => (
                    <ProgressRow
                      key={stage}
                      label={stage.charAt(0).toUpperCase() + stage.slice(1)}
                      value={count as number}
                      total={r.garmentsProcessed || 1}
                      color="#6366f1"
                    />
                  ))}
                </View>
              </>
            )}

            {/* SLA Summary */}
            <Text style={styles.sectionLabel}>SLA SUMMARY</Text>
            <View style={styles.slaRow}>
              <View style={[styles.slaCard, { backgroundColor: '#f0fdf4' }]}>
                <Text style={[styles.slaVal, { color: '#16a34a' }]}>{r.slaOnTrack ?? '—'}</Text>
                <Text style={styles.slaLabel}>On Track</Text>
              </View>
              <View style={[styles.slaCard, { backgroundColor: '#fffbeb' }]}>
                <Text style={[styles.slaVal, { color: '#d97706' }]}>{r.slaAtRisk ?? '—'}</Text>
                <Text style={styles.slaLabel}>At Risk</Text>
              </View>
              <View style={[styles.slaCard, { backgroundColor: '#fef2f2' }]}>
                <Text style={[styles.slaVal, { color: '#dc2626' }]}>{r.slaOverdue ?? '—'}</Text>
                <Text style={styles.slaLabel}>Overdue</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: '900', color: '#1e293b' },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 24, backgroundColor: '#e2e8f0', borderRadius: 14, padding: 4 },
  periodBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  periodBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  periodText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  periodTextActive: { color: '#7c3aed', fontWeight: '800' },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  centered: { paddingVertical: 80, alignItems: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  slaRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  slaCard: { flex: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  slaVal: { fontSize: 28, fontWeight: '900', marginBottom: 4 },
  slaLabel: { fontSize: 11, color: '#64748b', fontWeight: '700' },
});
