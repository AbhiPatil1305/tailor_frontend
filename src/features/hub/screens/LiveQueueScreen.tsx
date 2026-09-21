import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { ApiClient as MockApi, getSlaStatus } from '../../../infrastructure/api/ApiClient';
import { Garment } from '../../../domain/models/types';
import { SLAIndicator } from '../../../shared/components/SLAIndicator';

const TABS = [
  { id: 'all', label: 'ALL' },
  { id: 'cutting', label: 'CUTTING', stage: 'intake' },
  { id: 'stitching', label: 'STITCHING', stage: 'cutting' },
  { id: 'qc', label: 'QC', stage: 'stitching' },
  { id: 'ironing', label: 'IRONING', stage: 'qc' },
  { id: 'dispatch', label: 'DISPATCH', stage: 'packed' },
];

export const LiveQueueScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  // If navigated from Dashboard station card, set active tab
  const initialTab = route.params?.stationId || 'all';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [queue, setQueue] = useState<Garment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchQueue = async (tabId: string) => {
    setLoading(true);
    const tab = TABS.find(t => t.id === tabId);
    if (tab && tab.stage) {
      const items = await MockApi.getQueueForStage(tab.stage, 'h1');
      setQueue(items);
    } else {
      const all = await MockApi.getGarmentsByHub('h1');
      const activeStages = ['intake','cutting','stitching','qc','rework','ironing','packed','dispatched'];
      setQueue(all.filter(g => activeStages.includes(g.stage)));
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchQueue(activeTab);
    }, [activeTab])
  );

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>LIVE QUEUE</Text>
        <TouchableOpacity onPress={() => fetchQueue(activeTab)}>
          <Text style={s.refreshBtn}>↻ Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={s.tabsScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsContainer}>
          {TABS.map(tab => (
            <TouchableOpacity 
              key={tab.id} 
              style={[s.tab, activeTab === tab.id && s.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[s.tabText, activeTab === tab.id && s.activeTabText]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={s.searchContainer}>
        <TextInput
          style={s.searchInput}
          placeholder="Search QR, Order, or Garment Type..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>

      <ScrollView contentContainerStyle={s.listContainer}>
        {loading ? (
           <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : queue.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>✓</Text>
            <Text style={s.emptyText}>No garments waiting.</Text>
            <Text style={s.emptySubText}>You're all caught up here.</Text>
          </View>
        ) : (
          queue
          .filter(g => 
            !searchQuery || 
            g.qrCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.type.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(g => {
            const sla = getSlaStatus(g.slaDeadline);
            return (
              <View key={g.id} style={s.queueItem}>
                <View style={s.itemTop}>
                  <Text style={s.itemQr}>{g.qrCode}</Text>
                  <Text style={s.itemType}>{g.gender} {g.type}</Text>
                </View>
                <View style={s.itemMiddle}>
                  <View>
                    <Text style={s.label}>Current</Text>
                    <Text style={s.value}>{g.stage.toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={s.label}>Tailor</Text>
                    <Text style={s.value}>{g.assignedTailorId || 'None'}</Text>
                  </View>
                </View>
                <SLAIndicator slaDeadline={g.slaDeadline} />
                
                <TouchableOpacity 
                  style={s.processBtn} 
                  onPress={() => navigation.navigate('GarmentAction', { garmentId: g.id })}
                >
                  <Text style={s.processBtnText}>[ SCAN / PROCESS ]</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { fontSize: 18, fontWeight: '900', color: '#1e293b', letterSpacing: 1 },
  refreshBtn: { color: '#3b82f6', fontWeight: '700' },
  
  tabsScrollWrapper: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabsContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9' },
  activeTab: { backgroundColor: '#1e293b' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#64748b', letterSpacing: 1 },
  activeTabText: { color: '#fff' },

  searchContainer: { padding: 16, backgroundColor: '#f1f5f9' },
  searchInput: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', fontSize: 14 },

  listContainer: { padding: 16, paddingBottom: 60, paddingTop: 0 },
  
  emptyState: { alignItems: 'center', padding: 40, marginTop: 40 },
  emptyIcon: { fontSize: 40, color: '#10b981', marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  emptySubText: { fontSize: 14, color: '#64748b', marginTop: 4 },

  queueItem: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemQr: { fontSize: 16, fontWeight: '900', color: '#1e293b', fontFamily: 'Courier' },
  itemType: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  itemMiddle: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' },
  value: { fontSize: 14, color: '#334155', fontWeight: '700' },
  
  processBtn: { marginTop: 16, backgroundColor: '#f8fafc', padding: 14, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#cbd5e1' },
  processBtnText: { color: '#3b82f6', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
});
