import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface Stage {
  key: string;
  label: string;
  count: number;
  color: string;
}

interface Props {
  stages: Stage[];
  onStagePress?: (stageKey: string) => void;
}

const PIPELINE_STAGES: { key: string; label: string; color: string }[] = [
  { key: 'intake',     label: 'INTAKE',    color: '#6366f1' },
  { key: 'cutting',    label: 'CUTTING',   color: '#8b5cf6' },
  { key: 'stitching',  label: 'STITCHING', color: '#a855f7' },
  { key: 'qc',         label: 'QC',        color: '#ec4899' },
  { key: 'ironing',    label: 'IRONING',   color: '#f97316' },
  { key: 'packed',     label: 'PACKED',    color: '#10b981' },
  { key: 'dispatched', label: 'DISPATCH',  color: '#0ea5e9' },
];

export const ProductionPipeline = ({ stages, onStagePress }: Props) => {
  const countMap = Object.fromEntries(stages.map(s => [s.key, s.count]));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PRODUCTION PIPELINE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pipeline}>
        {PIPELINE_STAGES.map((stage, idx) => {
          const count = countMap[stage.key] ?? 0;
          const isLast = idx === PIPELINE_STAGES.length - 1;
          return (
            <React.Fragment key={stage.key}>
              <TouchableOpacity
                style={[styles.stage, count > 0 && styles.stageActive]}
                onPress={() => onStagePress?.(stage.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.stageIcon, { backgroundColor: stage.color + '20', borderColor: stage.color }]}>
                  <Text style={[styles.stageCount, { color: stage.color }]}>{count}</Text>
                </View>
                <Text style={styles.stageLabel}>{stage.label}</Text>
              </TouchableOpacity>
              {!isLast && (
                <View style={styles.arrow}>
                  <Text style={styles.arrowText}>›</Text>
                </View>
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  title: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 16 },
  pipeline: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stage: { alignItems: 'center', minWidth: 70, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12 },
  stageActive: { backgroundColor: '#f8fafc' },
  stageIcon: { width: 52, height: 52, borderRadius: 14, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  stageCount: { fontSize: 22, fontWeight: '900' },
  stageLabel: { fontSize: 9, fontWeight: '700', color: '#64748b', letterSpacing: 0.5, textAlign: 'center' },
  arrow: { alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 20, color: '#cbd5e1', fontWeight: '300' },
});
