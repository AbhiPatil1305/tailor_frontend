import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { ApiClient } from '../../../infrastructure/api/ApiClient';

export const TailorScanScreen = () => {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [loading, setLoading] = useState(false);
  // Explicit state to control camera — set false on cancel, true when tab refocused
  const [cameraActive, setCameraActive] = useState(false);

  // Turn camera on when screen is focused, off when it loses focus
  useEffect(() => {
    if (isFocused) setCameraActive(true);
    else setCameraActive(false);
  }, [isFocused]);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    processScan(data);
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) return;
    processScan(manualInput.trim());
  };

  const processScan = async (qr: string) => {
    setLoading(true);
    try {
      const garment = await ApiClient.getGarmentByQrCode(qr);
      if (!garment) {
        Alert.alert('Not Found', `No garment found with QR ${qr}`, [
          { text: 'Try Again', onPress: () => setScanned(false) }
        ]);
        return;
      }
      navigation.navigate('TailorGarmentDetail', { garmentId: garment._id || garment.id });
      setScanned(false);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Scan failed', [
        { text: 'Try Again', onPress: () => setScanned(false) }
      ]);
    } finally {
      setLoading(false);
      setManualInput('');
    }
  };

  if (hasPermission === null) {
    return <SafeAreaView style={styles.safe}><Text style={styles.msg}>Requesting camera permission...</Text></SafeAreaView>;
  }
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.msg}>No access to camera</Text>
        <FallbackInput 
          manualInput={manualInput} 
          setManualInput={setManualInput} 
          onSubmit={handleManualSubmit} 
          loading={loading} 
        />
      </SafeAreaView>
    );
  }

  const handleCancel = () => {
    // Kill camera FIRST, then navigate — prevents camera staying alive on web
    setCameraActive(false);
    setScanned(false);
    navigation.navigate('Home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          <Text style={styles.title}>Scan Garment</Text>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.sub}>Align QR code within the frame</Text>
      </View>
      
      <View style={styles.cameraContainer}>
        {cameraActive ? (
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        ) : null}
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        )}
        
        <View style={styles.overlay}>
          <View style={styles.targetFrame} />
          <TouchableOpacity style={styles.cancelOverlayBtn} onPress={handleCancel} disabled={loading}>
            <Text style={styles.cancelOverlayText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FallbackInput 
        manualInput={manualInput} 
        setManualInput={setManualInput} 
        onSubmit={handleManualSubmit} 
        loading={loading} 
      />
    </SafeAreaView>
  );
};

const FallbackInput = ({ manualInput, setManualInput, onSubmit, loading }: any) => (
  <View style={styles.fallbackContainer}>
    <Text style={styles.fallbackLabel}>Or enter QR code manually:</Text>
    <View style={styles.fallbackRow}>
      <TextInput
        style={styles.input}
        placeholder="e.g. GRT-123456"
        value={manualInput}
        onChangeText={setManualInput}
        autoCapitalize="characters"
        editable={!loading}
      />
      <TouchableOpacity 
        style={[styles.btn, !manualInput.trim() && styles.btnDisabled]} 
        onPress={onSubmit}
        disabled={loading || !manualInput.trim()}
      >
        <Text style={styles.btnText}>Go</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },
  msg: { color: '#fff', textAlign: 'center', marginTop: 40 },
  header: { padding: 20, paddingTop: 40, alignItems: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 4 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  cancelBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  cancelText: { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 20 },
  sub: { color: '#94a3b8', fontSize: 14 },
  cameraContainer: { flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#1e293b' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 32 },
  targetFrame: { width: 250, height: 250, borderWidth: 2, borderColor: '#10b981', borderRadius: 20, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
  cancelOverlayBtn: { backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 30, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  cancelOverlayText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  loadingText: { color: '#fff', marginTop: 12, fontWeight: '700' },
  fallbackContainer: { backgroundColor: '#1e293b', padding: 24, paddingBottom: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  fallbackLabel: { color: '#94a3b8', fontSize: 13, marginBottom: 12, fontWeight: '600' },
  fallbackRow: { flexDirection: 'row', gap: 10 },
  input: { flex: 1, backgroundColor: '#334155', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 16, fontWeight: '600' },
  btn: { backgroundColor: '#6d28d9', paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center', borderRadius: 12 },
  btnDisabled: { backgroundColor: '#475569' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
