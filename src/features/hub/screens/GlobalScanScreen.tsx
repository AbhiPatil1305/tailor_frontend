import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MockApi } from '../../../infrastructure/api/MockApi';

export const GlobalScanScreen = () => {
  const navigation = useNavigation<any>();
  const [manualQr, setManualQr] = useState('');
  const [loading, setLoading] = useState(false);

  const processQr = async (qr: string) => {
    if (!qr.trim()) return;
    setLoading(true);
    const garment = await MockApi.getGarmentByQR(qr.trim());
    setLoading(false);
    if (!garment) {
      Alert.alert('Unknown QR', 'Garment not found in system.');
      return;
    }
    // Navigate to Garment Action Screen
    navigation.navigate('GarmentAction', { garmentId: garment.id });
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>
        <Text style={s.title}>SCAN GARMENT</Text>
        
        <View style={s.cameraFrame}>
          <Text style={s.cameraPreviewText}>[ Camera Preview ]</Text>
          <Text style={s.cameraNote}>Place garment QR inside the frame</Text>
        </View>

        <Text style={s.orText}>— OR ENTER MANUALLY —</Text>

        <View style={s.manualBox}>
          <TextInput
            style={s.input}
            placeholder="e.g. T24-GRM-G001"
            value={manualQr}
            onChangeText={setManualQr}
            autoCapitalize="characters"
          />
          <TouchableOpacity style={s.submitBtn} onPress={() => processQr(manualQr)} disabled={loading}>
            <Text style={s.submitText}>{loading ? '...' : 'FIND'}</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={s.demoHint}>Demo: T24-GRM-G001, T24-GRM-G002, etc.</Text>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  container: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: 2, marginBottom: 40 },
  
  cameraFrame: { width: 300, height: 300, borderWidth: 2, borderColor: '#3b82f6', borderRadius: 20, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 40 },
  cameraPreviewText: { color: '#475569', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  cameraNote: { color: '#94a3b8', fontSize: 14 },
  
  orText: { color: '#64748b', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 20 },
  
  manualBox: { flexDirection: 'row', width: '100%', maxWidth: 400, gap: 10 },
  input: { flex: 1, backgroundColor: '#1e293b', color: '#fff', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, fontSize: 16, fontWeight: '600' },
  submitBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, justifyContent: 'center', borderRadius: 12 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  
  demoHint: { color: '#475569', fontSize: 13, marginTop: 20 },
});
