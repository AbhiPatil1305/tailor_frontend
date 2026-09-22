import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SLABadge, getSLAStatus } from './SLABadge';

interface GarmentCardProps {
  garment: any;
  onPress: () => void;
}

export const GarmentCard: React.FC<GarmentCardProps> = ({ garment, onPress }) => {
  const g = garment;
  const stageFormatted = (g.currentStage || '').replace(/_/g, ' ');
  const isClarificationNeeded = g.measurements?.status === 'NEEDS_CLARIFICATION';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{g.type || g.garmentType}</Text>
        </View>
        <Text style={styles.qr}>{g.qrCode}</Text>
      </View>
      
      <View style={styles.metaRow}>
        <Text style={styles.gender}>{g.gender?.toUpperCase()}</Text>
        {g.payoutAmount && <Text style={styles.payout}>₹{g.payoutAmount}</Text>}
      </View>

      <View style={styles.stageRow}>
        <Text style={styles.stageLabel}>Stage:</Text>
        <Text style={styles.stageValue}>{stageFormatted}</Text>
      </View>

      <View style={styles.footer}>
        <SLABadge 
          status={g.slaStatus || getSLAStatus(g.sla?.dueAt)} 
          compact 
        />
        {isClarificationNeeded && (
          <View style={styles.clarifyBadge}>
            <Text style={styles.clarifyText}>⚠ Clarification</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6d28d9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#6d28d9',
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  qr: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gender: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  payout: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  stageLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginRight: 6,
  },
  stageValue: {
    fontSize: 13,
    color: '#1e293b',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clarifyBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clarifyText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
  },
});
