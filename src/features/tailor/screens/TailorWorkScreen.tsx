import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../core/auth/AuthContext';
import { ApiClient } from '../../../infrastructure/api/ApiClient';
import { GarmentCard } from '../components/GarmentCard';
import { OfflineBanner } from '../components/OfflineBanner';

const TABS = [
  { id: 'ALL', label: 'All' },
  { id: 'STITCHING_ASSIGNED', label: 'Assigned' },
  { id: 'STITCHING_STARTED', label: 'In Progress' },
  { id: 'QC_REWORK', label: 'Rework' },
  { id: 'STITCHING_COMPLETED', label: 'Completed' },
];

export const TailorWorkScreen = () => {
  const { userId } = useAuth();
  const navigation = useNavigation<any>();
  const [garments, setGarments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [isOnline, setIsOnline] = useState(true);

  const loadData = useCallback(async (showIndicator = true) => {
    if (showIndicator) setLoading(true);
    try {
      const data = await ApiClient.getMyGarmentsFull(userId!);
      setGarments(data);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(false); };

  const filtered = activeTab === 'ALL'
    ? garments
    : garments.filter(g => g.currentStage === activeTab);

  const renderTab = (tab: { id: string, label: string }) => {
    const isActive = activeTab === tab.id;
    return (
      <TouchableOpacity
        key={tab.id}
        style={[styles.tab, isActive && styles.tabActive]}
        onPress={() => setActiveTab(tab.id)}
      >
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <OfflineBanner visible={!isOnline} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Work</Text>
      </View>

      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderTab(item)}
          contentContainerStyle={styles.tabsList}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6d28d9" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id || item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <GarmentCard
              garment={item}
              onPress={() => navigation.navigate('TailorGarmentDetail', { garmentId: item._id || item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>✂️</Text>
              <Text style={styles.emptyTitle}>No garments found</Text>
              <Text style={styles.emptyText}>You don't have any garments in this stage right now.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  tabsContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabsList: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  tabActive: { backgroundColor: '#6d28d9' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#ffffff', fontWeight: '800' },
  listContent: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 22 },
});
