import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { ApiClient } from '../../../infrastructure/api/ApiClient';

export const TailorLocationScreen = () => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
    })();
  }, []);

  const handleUpdateLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location services to use this feature.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      await ApiClient.updateTailorLocation(location.coords.latitude, location.coords.longitude);
      Alert.alert('Success', 'Location updated successfully. Hub manager can now assign local pickups if needed.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStopSharing = async () => {
    setLoading(true);
    try {
      await ApiClient.deleteTailorLocation();
      Alert.alert('Success', 'Location sharing stopped.');
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
        <Text style={styles.title}>Location</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.mapIcon}>🗺</Text>
        </View>
        <Text style={styles.heading}>Share your location</Text>
        <Text style={styles.desc}>
          Providing your location allows the hub manager to efficiently assign garments to you, 
          especially if there is a pickup or delivery nearby. 
          {permissionStatus === 'granted' ? '\n\nLocation permission is granted.' : '\n\nWe need your permission to access your device location.'}
        </Text>

        <TouchableOpacity 
          style={styles.btnPrimary} 
          onPress={handleUpdateLocation}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Update Location Now</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.btnSecondary} 
          onPress={handleStopSharing}
          disabled={loading}
        >
          <Text style={styles.btnTextSecondary}>Stop Sharing Location</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  backBtn: { padding: 8 },
  backIcon: { fontSize: 24, color: '#1e293b' },
  title: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  content: { padding: 24, alignItems: 'center', paddingTop: 60 },
  iconContainer: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#f3e8ff',
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
  },
  mapIcon: { fontSize: 48 },
  heading: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginBottom: 12 },
  desc: { fontSize: 15, color: '#64748b', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  btnPrimary: {
    backgroundColor: '#6d28d9', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', width: '100%', marginBottom: 16,
    shadowColor: '#6d28d9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  btnSecondary: {
    backgroundColor: '#f1f5f9', paddingVertical: 16, borderRadius: 12,
    alignItems: 'center', width: '100%',
  },
  btnTextSecondary: { color: '#475569', fontSize: 16, fontWeight: '700' },
});
