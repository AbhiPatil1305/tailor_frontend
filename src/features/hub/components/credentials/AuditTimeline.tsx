import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface AuditRecord {
  id?: string;
  action: string;
  actorUserId?: string;
  actorRole?: string;
  timestamp?: string;
  metadata?: any;
}

interface AuditTimelineProps {
  logs: AuditRecord[];
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ logs }) => {
  if (!logs || logs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No audit events recorded yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AUDIT LOG & SECURITY HISTORY</Text>
      {logs.map((item, idx) => {
        const actionLabel = (item.action || '').replace(/_/g, ' ');
        const dateStr = item.timestamp
          ? new Date(item.timestamp).toLocaleString()
          : 'Recent';

        return (
          <View key={item.id || idx} style={styles.itemRow}>
            <View style={styles.dotLineCol}>
              <View style={styles.dot} />
              {idx < logs.length - 1 && <View style={styles.line} />}
            </View>
            <View style={styles.contentCol}>
              <View style={styles.actionHeader}>
                <Text style={styles.actionText}>{actionLabel}</Text>
                <Text style={styles.dateText}>{dateStr}</Text>
              </View>
              <Text style={styles.metaText}>
                Performed by: {item.actorRole || 'System'} ({item.actorUserId || 'N/A'})
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  emptyContainer: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dotLineCol: {
    alignItems: 'center',
    marginRight: 12,
    width: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7c3aed',
    marginTop: 4,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
  },
  contentCol: {
    flex: 1,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
});
