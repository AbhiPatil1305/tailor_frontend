import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ApiClient } from '../../../infrastructure/api/ApiClient';

export const TailorAvailabilityScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  
  const handleSelect = async (status: 'AVAILABLE' | 'BUSY' | 'ON_LEAVE') => {
    setLoading(true);
    try {
      await ApiClient.updateTailorAvailability(status);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Availability</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.instruction}>Select your current working status. This helps the hub manager assign work appropriately.</Text>

        <TouchableOpacity 
          style={[styles.optionCard, { borderColor: '#10b981' }]} 
          onPress={() => handleSelect('AVAILABLE')}
          disabled={loading}
        >
          <View style={styles.optionHeader}>
            <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
            <Text style={styles.optionTitle}>Available</Text>
          </View>
          <Text style={styles.optionDesc}>I am ready to receive new assignments immediately.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionCard, { borderColor: '#f59e0b' }]} 
          onPress={() => handleSelect('BUSY')}
          disabled={loading}
        >
          <View style={styles.optionHeader}>
            <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.optionTitle}>Busy</Text>
          </View>
          <Text style={styles.optionDesc}>I am currently working at capacity. Do not assign new items right now.</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionCard, { borderColor: '#94a3b8' }]} 
          onPress={() => handleSelect('ON_LEAVE')}
          disabled={loading}
        >
          <View style={styles.optionHeader}>
            <View style={[styles.dot, { backgroundColor: '#94a3b8' }]} />
            <Text style={styles.optionTitle}>On Leave</Text>
          </View>
          <Text style={styles.optionDesc}>I am out of office. Requires an approved leave request for extended periods.</Text>
        </TouchableOpacity>

        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#6d28d9" />
            <Text style={styles.loaderText}>Updating...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 24, color: '#1e293b' },
  title: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  content: { padding: 20 },
  instruction: { fontSize: 14, color: '#64748b', marginBottom: 24, lineHeight: 22 },
  optionCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    elevation: 2,
  },
  optionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  optionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  optionDesc: { fontSize: 14, color: '#64748b', lineHeight: 20 },
  loader: { alignItems: 'center', marginTop: 24 },
  loaderText: { color: '#6d28d9', marginTop: 12, fontWeight: '600' },
});
