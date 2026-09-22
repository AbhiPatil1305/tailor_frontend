import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Garment, SlaStatus } from '../../../../domain/models/types';

interface Props {
  garment: Garment;
  compact?: boolean;
}

function getSlaInfo(garment: Garment): { status: SlaStatus; label: string; hoursLeft: number } {
  if (!garment.slaDeadline) return { status: 'safe', label: 'NO SLA', hoursLeft: 99 };
  const now = Date.now();
  const due = new Date(garment.slaDeadline).getTime();
  const hoursLeft = (due - now) / 3_600_000;

  if (hoursLeft < 0) return { status: 'overdue', label: 'OVERDUE', hoursLeft };
  if (hoursLeft < 2) return { status: 'at_risk', label: 'AT RISK', hoursLeft };
  if (hoursLeft < 6) return { status: 'warning', label: 'WARNING', hoursLeft };
  return { status: 'safe', label: 'ON TRACK', hoursLeft };
}

export const SLABadge = ({ garment, compact = false }: Props) => {
  const { status, label, hoursLeft } = getSlaInfo(garment);
  const colors: Record<SlaStatus, { bg: string; text: string; border: string }> = {
    safe:     { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
    warning:  { bg: '#fffbeb', text: '#d97706', border: '#fcd34d' },
    at_risk:  { bg: '#fff7ed', text: '#ea580c', border: '#fdba74' },
    overdue:  { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  };
  const c = colors[status];

  if (compact) {
    return (
      <View style={[styles.badge, { backgroundColor: c.bg, borderColor: c.border }]}>
        <Text style={[styles.badgeText, { color: c.text }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.full, { backgroundColor: c.bg, borderColor: c.border }]}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      {hoursLeft >= 0
        ? <Text style={[styles.sub, { color: c.text }]}>{hoursLeft.toFixed(1)}h left</Text>
        : <Text style={[styles.sub, { color: c.text }]}>{Math.abs(hoursLeft).toFixed(1)}h ago</Text>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  full: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  sub: { fontSize: 10, fontWeight: '500', marginTop: 2 },
});
