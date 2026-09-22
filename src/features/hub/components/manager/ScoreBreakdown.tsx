import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TailorScore } from '../../../../domain/models/types';

interface Props {
  score: TailorScore;
  onAssign: (tailorId: string) => void;
  recommended?: boolean;
  loading?: boolean;
}

export const ScoreBreakdown = ({ score, onAssign, recommended = false, loading = false }: Props) => {
  const { tailor, totalScore, breakdown, rating } = score;
  const available = tailor.status === 'available';
  const remaining = tailor.capacityPerDay - tailor.assignedToday;

  return (
    <View style={[styles.card, recommended && styles.cardTop]}>
      {recommended && (
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>⭐ BEST MATCH</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{tailor.name.charAt(0)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{tailor.name}</Text>
          <Text style={styles.specialisation}>{tailor.specialisations.join(', ')}</Text>
        </View>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreNum}>{totalScore}</Text>
          <Text style={styles.scoreLabel}>SCORE</Text>
        </View>
      </View>

      {/* Score Breakdown */}
      <View style={styles.breakdown}>
        <ScoreRow label="Gender Match"      value={breakdown.genderMatch}      max={40} />
        <ScoreRow label="Skill Match"       value={breakdown.skillMatch}       max={25} />
        <ScoreRow label="Capacity Headroom" value={breakdown.capacityHeadroom} max={10} />
        <ScoreRow label="Rating Tie-breaker" value={Math.round(rating * 2)}   max={10} suffix={`(${rating.toFixed(1)}★)`} />
      </View>

      {/* Stats row */}
      <View style={styles.stats}>
        <Stat label="Status"   value={available ? 'AVAILABLE' : tailor.status.toUpperCase()} highlight={available} />
        <Stat label="Capacity" value={`${tailor.assignedToday} / ${tailor.capacityPerDay}`} />
        <Stat label="Remaining" value={String(remaining)} highlight={remaining > 5} />
        <Stat label="Rating"   value={`${rating.toFixed(1)}★`} />
      </View>

      <TouchableOpacity
        style={[styles.assignBtn, !available && styles.assignBtnDisabled, loading && styles.assignBtnDisabled]}
        onPress={() => available && !loading && onAssign(tailor.id)}
        disabled={!available || loading}
      >
        <Text style={styles.assignBtnText}>{loading ? 'ASSIGNING...' : 'ASSIGN TAILOR'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const ScoreRow = ({ label, value, max, suffix }: { label: string; value: number; max: number; suffix?: string }) => (
  <View style={srStyles.row}>
    <Text style={srStyles.label}>{label}</Text>
    <View style={srStyles.bar}>
      <View style={[srStyles.fill, { width: `${Math.min(100, (value / max) * 100)}%` as any, backgroundColor: value > 0 ? '#8b5cf6' : '#e2e8f0' }]} />
    </View>
    <Text style={[srStyles.val, { color: value > 0 ? '#7c3aed' : '#94a3b8' }]}>+{value}{suffix ? ` ${suffix}` : ''}</Text>
  </View>
);

const Stat = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <View style={statStyles.box}>
    <Text style={[statStyles.value, highlight && statStyles.valueHL]}>{value}</Text>
    <Text style={statStyles.label}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardTop: { borderColor: '#8b5cf6', borderWidth: 2, shadowColor: '#8b5cf6', shadowOpacity: 0.15, shadowRadius: 12, elevation: 6 },
  topBadge: { backgroundColor: '#ede9fe', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 12 },
  topBadgeText: { color: '#7c3aed', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ede9fe', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontWeight: '900', color: '#7c3aed' },
  info: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: '#1e293b' },
  specialisation: { fontSize: 12, color: '#64748b', marginTop: 2 },
  scoreCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center' },
  scoreNum: { fontSize: 20, fontWeight: '900', color: '#fff' },
  scoreLabel: { fontSize: 8, color: '#c4b5fd', fontWeight: '700', letterSpacing: 0.5 },
  breakdown: { backgroundColor: '#faf5ff', borderRadius: 12, padding: 14, marginBottom: 14, gap: 8 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  assignBtn: { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  assignBtnDisabled: { backgroundColor: '#cbd5e1' },
  assignBtnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
});

const srStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { flex: 1, fontSize: 12, color: '#64748b', fontWeight: '500' },
  bar: { width: 80, height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  val: { width: 70, fontSize: 12, fontWeight: '700', textAlign: 'right' },
});

const statStyles = StyleSheet.create({
  box: { flex: 1, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0', padding: 10, alignItems: 'center' },
  value: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 2 },
  valueHL: { color: '#16a34a' },
  label: { fontSize: 9, color: '#94a3b8', fontWeight: '600', letterSpacing: 0.3 },
});
