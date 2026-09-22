import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ApiClient } from '../../../infrastructure/api/ApiClient';

export const TailorNotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getMyNotifications();
      setNotifications(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handlePress = async (item: any) => {
    if (item.status !== 'READ') {
      try {
        await ApiClient.markNotificationRead(item._id || item.id);
        setNotifications(prev => prev.map(n => 
          (n._id === item._id || n.id === item.id) ? { ...n, status: 'READ' } : n
        ));
      } catch {}
    }
    
    // Deep link routing if meta exists
    if (item.metadata?.garmentId) {
      navigation.navigate('TailorGarmentDetail', { garmentId: item.metadata.garmentId });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#6d28d9" /></View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id || item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isUnread = item.status !== 'READ';
            return (
              <TouchableOpacity 
                style={[styles.card, isUnread && styles.cardUnread]}
                onPress={() => handlePress(item)}
              >
                <View style={styles.iconBox}>
                  <Text style={styles.icon}>
                    {item.title?.toLowerCase().includes('garment') ? '👔' : 
                     item.title?.toLowerCase().includes('payout') ? '💰' : '🔔'}
                  </Text>
                </View>
                <View style={styles.content}>
                  <Text style={[styles.msgTitle, isUnread && styles.textUnread]}>{item.title}</Text>
                  <Text style={styles.msgBody} numberOfLines={2}>{item.message}</Text>
                  <Text style={styles.time}>{new Date(item.createdAt).toLocaleString()}</Text>
                </View>
                {isUnread && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>All caught up</Text>
              <Text style={styles.emptyText}>You don't have any notifications right now.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 24, color: '#1e293b' },
  title: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, elevation: 1 },
  cardUnread: { backgroundColor: '#faf5ff', borderWidth: 1, borderColor: '#e9d5ff' },
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  msgTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 4 },
  textUnread: { color: '#6d28d9', fontWeight: '800' },
  msgBody: { fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 6 },
  time: { fontSize: 11, color: '#94a3b8' },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6d28d9', marginLeft: 10 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b' },
});
